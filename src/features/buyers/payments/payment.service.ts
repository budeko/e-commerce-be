import { env } from '@/config/env';
import type { PaymentStatus } from '@/integrations/mongo';
import { findBuyerOrder, findOrderByIdLean } from '@/repositories/buyers/order.repository';
import { findBuyerPaymentProfileLean } from '@/repositories/buyers/buyer.repository';
import {
  claimPendingPaymentForProcessing,
  createPayment,
  findOrderIdByCheckoutToken,
  findPaymentByOrderId,
  findPaymentByOrderIdLean,
  savePaymentDocument,
  updatePaymentStatusByOrderId,
} from '@/repositories/buyers/payment.repository';
import { findActiveProductLean } from '@/repositories/catalog/product.repository';
import { initializeIyzicoCheckout } from '@/integrations/iyzico/initialize-checkout';
import { completeIyzicoCheckout } from '@/integrations/iyzico/retrieve-checkout';
import { refundIyzicoPayment } from '@/integrations/iyzico/refund-payment';
import { CommerceError } from '@/internal/common/errors/commerce-error';
import { logger } from '@/internal/common/logging';
import type { CreatePaymentInput } from '@/features/buyers/payments/create-payment.schema';
import {
  buildPaymentSplitsForOrder,
  syncPaymentSplitTransactionIds,
} from '@/internal/buyers/payment/payment-split';
import { logPaymentTransition } from '@/internal/buyers/payment/payment-audit';
import {
  assertProductStockAvailable,
  assertSellersReadyForOrder,
} from '@/internal/buyers/orders/order-item-validation';
import { cancelPendingOrder } from '@/internal/buyers/orders/cancel-pending-order';
import { fulfillPaidOrder } from '@/internal/buyers/orders/fulfill-order';
import { reservePendingOrderStock } from '@/internal/buyers/orders/reserve-order-stock';
import { creditSellerPendingFromPaidOrder } from '@/internal/sellers/wallet/credit-pending-from-order';

type PaymentRecord = {
  _id: unknown;
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  provider?: string | null;
  externalId?: string | null;
  status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

type OrderItemRecord = {
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type CreatePaymentOptions = {
  clientIp?: string;
};

const AMOUNT_TOLERANCE = 0.01;

const FINAL_ORDER_STATUSES = new Set(['paid', 'shipped', 'delivered']);

const toPaymentResponse = (payment: PaymentRecord) => ({
  id: String(payment._id),
  orderId: payment.orderId,
  buyerId: payment.buyerId,
  amount: payment.amount,
  currency: payment.currency,
  provider: payment.provider ?? null,
  externalId: payment.externalId ?? null,
  status: payment.status,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const amountsMatch = (expected: number, actual: number): boolean =>
  Math.abs(expected - actual) <= AMOUNT_TOLERANCE;

const isFinalOrderStatus = (status: string | undefined): boolean =>
  Boolean(status && FINAL_ORDER_STATUSES.has(status));

const markPaymentCompleted = async (
  payment: {
    _id: unknown;
    orderId: string;
    status: string;
    provider?: string | null;
    externalId?: string | null;
    save: () => Promise<unknown>;
  },
  externalId: string
) => {
  const prevStatus = payment.status as PaymentStatus;
  payment.status = 'completed';
  payment.provider = 'iyzico';
  payment.externalId = externalId;
  await savePaymentDocument(payment);
  logPaymentTransition({
    paymentId: String(payment._id),
    orderId: payment.orderId,
    from: prevStatus,
    to: 'completed',
    reason: 'iyzico_checkout_verified',
  });
};

const loadBuyerPaymentProfile = async (buyerId: string) => {
  const { user, buyer } = await findBuyerPaymentProfileLean(buyerId);

  if (!user?.email) {
    throw new CommerceError(400, 'Ödeme için e-posta bilgisi eksik');
  }

  if (
    !buyer?.firstName ||
    !buyer.lastName ||
    !buyer.phone ||
    !buyer.country ||
    !buyer.city ||
    !buyer.deliveryAddress ||
    !buyer.nationalId
  ) {
    throw new CommerceError(400, 'Ödeme için profil bilgileri eksik (TC kimlik no dahil)');
  }

  return {
    email: String(user.email),
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    phone: buyer.phone,
    nationalId: buyer.nationalId,
    country: buyer.country,
    city: buyer.city,
    address: buyer.deliveryAddress,
    createdAt: (user.createdAt as Date | undefined) ?? new Date(),
  };
};

const assertOrderReadyForPayment = async (items: OrderItemRecord[]) => {
  await assertSellersReadyForOrder(items);

  for (const item of items) {
    const product = await findActiveProductLean(item.productId);

    if (!product) {
      throw new CommerceError(400, 'Siparişte geçersiz ürün var');
    }

    assertProductStockAvailable(product, item.quantity);
  }
};

export const createPaymentForOrder = async (
  buyerId: string,
  input: CreatePaymentInput,
  options?: CreatePaymentOptions
) => {
  const order = await findBuyerOrder(buyerId, input.orderId);

  if (order.status !== 'pending') {
    throw new CommerceError(400, 'Sipariş ödemeye uygun değil');
  }

  const existingPayment = await findPaymentByOrderId(input.orderId);

  if (existingPayment?.status === 'completed') {
    throw new CommerceError(409, 'Bu sipariş için ödeme zaten tamamlandı');
  }

  await assertOrderReadyForPayment(order.items as OrderItemRecord[]);
  await reservePendingOrderStock(
    input.orderId,
    order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  );

  const buyerProfile = await loadBuyerPaymentProfile(buyerId);
  const paymentSplits = await buildPaymentSplitsForOrder(input.orderId, order.items);
  const checkout = await initializeIyzicoCheckout({
    orderId: input.orderId,
    buyerId,
    amount: order.totalAmount,
    currency: order.currency,
    clientIp: options?.clientIp ?? '127.0.0.1',
    buyer: buyerProfile,
    items: paymentSplits.map((split) => split.checkoutItem),
  });

  const payment =
    existingPayment ??
    (await createPayment({
      orderId: input.orderId,
      buyerId,
      amount: order.totalAmount,
      currency: order.currency,
      provider: 'iyzico',
      status: 'pending',
    }));

  payment.provider = 'iyzico';
  payment.externalId = checkout.token;
  const prevStatus = payment.status as PaymentStatus;
  payment.status = 'pending';
  await savePaymentDocument(payment);
  if (prevStatus !== 'pending') {
    logPaymentTransition({
      paymentId: String(payment._id),
      orderId: payment.orderId,
      from: prevStatus,
      to: 'pending',
      reason: 'checkout_initialized',
    });
  }

  return {
    payment: toPaymentResponse(payment.toObject()),
    checkout,
  };
};

const handleFulfillmentFailure = async (
  payment: {
    _id: unknown;
    orderId: string;
    amount: number;
    status: string;
    provider?: string | null;
    externalId?: string | null;
    updatedAt?: Date;
    save: () => Promise<unknown>;
  },
  externalId: string,
  error: unknown
): Promise<never> => {
  await markPaymentCompleted(payment, externalId);
  await cancelPendingOrder(payment.orderId);

  const refunded = await refundIyzicoPayment(externalId, payment.amount, payment.orderId);

  if (refunded) {
    const prevStatus = payment.status as PaymentStatus;
    payment.status = 'refunded';
    await savePaymentDocument(payment);
    logPaymentTransition({
      paymentId: String(payment._id),
      orderId: payment.orderId,
      from: prevStatus,
      to: 'refunded',
      reason: 'fulfillment_failed_refund_success',
    });
  }

  logger.error(
    { err: error, orderId: payment.orderId, refunded },
    'Ödeme alındı ancak sipariş tamamlanamadı'
  );

  throw error;
};

export const completePaymentFromCheckoutToken = async (token: string) => {
  const result = await completeIyzicoCheckout(token);
  let payment = await findPaymentByOrderId(result.orderId);

  if (!payment) {
    throw new CommerceError(404, 'Ödeme kaydı bulunamadı');
  }

  if (result.status === 'failed') {
    const previousStatus = payment.status;
    const updated = await updatePaymentStatusByOrderId(result.orderId, 'failed');
    payment = updated ?? payment;
    if (previousStatus !== 'failed') {
      logPaymentTransition({
        paymentId: String(payment._id),
        orderId: payment.orderId,
        from: previousStatus,
        to: 'failed',
        reason: 'iyzico_checkout_failed',
      });
    }
    await cancelPendingOrder(result.orderId);

    return {
      payment: toPaymentResponse(payment.toObject()),
      success: false as const,
      reason: result.reason,
    };
  }

  if (payment.status === 'completed') {
    const order = await findOrderByIdLean(result.orderId);

    if (isFinalOrderStatus(order?.status)) {
      return {
        payment: toPaymentResponse(payment.toObject()),
        success: true as const,
      };
    }
  }

  const order = await findOrderByIdLean(result.orderId);

  if (!order) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  if (isFinalOrderStatus(order.status)) {
    if (payment.status !== 'completed') {
      await markPaymentCompleted(payment, result.externalId);
    }

    return {
      payment: toPaymentResponse(payment.toObject()),
      success: true as const,
    };
  }

  if (order.status !== 'pending') {
    throw new CommerceError(409, 'Sipariş ödemeye uygun değil');
  }

  if (payment.status === 'completed') {
    throw new CommerceError(409, 'Ödeme zaten tamamlandı, sipariş uzlaştırması bekleniyor');
  }

  if (payment.status === 'processing') {
    throw new CommerceError(409, 'Ödeme işleniyor, lütfen kısa süre sonra tekrar deneyin');
  }

  const claimedPayment = await claimPendingPaymentForProcessing(result.orderId);
  if (claimedPayment) {
    logPaymentTransition({
      paymentId: String(claimedPayment._id),
      orderId: claimedPayment.orderId,
      from: 'pending',
      to: 'processing',
      reason: 'callback_claim',
    });
    payment = claimedPayment;
  } else {
    const latestPayment = await findPaymentByOrderId(result.orderId);

    if (!latestPayment) {
      throw new CommerceError(404, 'Ödeme kaydı bulunamadı');
    }

    payment = latestPayment;

    if (payment.status === 'completed') {
      return {
        payment: toPaymentResponse(payment.toObject()),
        success: true as const,
      };
    }

    if (payment.status === 'processing') {
      throw new CommerceError(409, 'Ödeme işleniyor, lütfen kısa süre sonra tekrar deneyin');
    }
  }

  if (payment.status !== 'processing') {
    throw new CommerceError(409, 'Ödeme işleme alınamadı');
  }

  if (!amountsMatch(order.totalAmount, result.paidAmount)) {
    logger.error(
      {
        orderId: result.orderId,
        expected: order.totalAmount,
        paid: result.paidAmount,
      },
      'Iyzico ödeme tutarı sipariş tutarıyla uyuşmuyor'
    );
    throw new CommerceError(409, 'Ödeme tutarı sipariş tutarıyla uyuşmuyor');
  }

  try {
    await fulfillPaidOrder(
      result.orderId,
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );
  } catch (error) {
    if (error instanceof CommerceError && error.statusCode === 409) {
      const refreshed = await findOrderByIdLean(result.orderId);

      if (
        isFinalOrderStatus(refreshed?.status)
      ) {
        await markPaymentCompleted(payment, result.externalId);

        try {
          await syncPaymentSplitTransactionIds(result.orderId, result.itemTransactions);
        } catch (syncError) {
          logger.error({ err: syncError, orderId: result.orderId }, 'Split transaction sync başarısız');
        }

        try {
          await creditSellerPendingFromPaidOrder(result.orderId);
        } catch (walletError) {
          logger.error({ err: walletError, orderId: result.orderId }, 'Satıcı pending bakiye yazılamadı');
        }

        return {
          payment: toPaymentResponse(payment.toObject()),
          success: true as const,
        };
      }
    }

    await handleFulfillmentFailure(payment, result.externalId, error);
  }

  await markPaymentCompleted(payment, result.externalId);

  try {
    await syncPaymentSplitTransactionIds(result.orderId, result.itemTransactions);
  } catch (syncError) {
    logger.error({ err: syncError, orderId: result.orderId }, 'Split transaction sync başarısız');
  }

  try {
    await creditSellerPendingFromPaidOrder(result.orderId);
  } catch (walletError) {
    logger.error({ err: walletError, orderId: result.orderId }, 'Satıcı pending bakiye yazılamadı');
  }

  return {
    payment: toPaymentResponse(payment.toObject()),
    success: true as const,
  };
};

export const getPaymentByOrderId = async (buyerId: string, orderId: string) => {
  await findBuyerOrder(buyerId, orderId);

  const payment = await findPaymentByOrderIdLean(orderId);

  if (!payment) {
    throw new CommerceError(404, 'Ödeme kaydı bulunamadı');
  }

  return toPaymentResponse(payment as PaymentRecord);
};

type PaymentCallbackOutcome = 'success' | 'failed';

const parseIyzicoCallbackBody = (body: unknown): Record<string, string> => {
  if (typeof body === 'string') {
    return Object.fromEntries(new URLSearchParams(body));
  }

  if (Buffer.isBuffer(body)) {
    return Object.fromEntries(new URLSearchParams(body.toString('utf8')));
  }

  if (typeof body === 'object' && body !== null) {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, String(value)])
    );
  }

  return {};
};

export const buildPaymentRedirectUrl = (
  outcome: PaymentCallbackOutcome,
  orderId?: string | null
): string => {
  const frontendUrl = env.frontendUrlOrDefault.replace(/\/+$/, '');

  if (orderId) {
    return `${frontendUrl}/orders/${orderId}?payment=${outcome}`;
  }

  return `${frontendUrl}/checkout?payment=${outcome}`;
};

export const handlePaymentCallback = async (body: unknown): Promise<string> => {
  let checkoutToken: string | undefined;

  try {
    const form = parseIyzicoCallbackBody(body);
    checkoutToken = form.token?.trim();

    if (!checkoutToken) {
      return buildPaymentRedirectUrl('failed');
    }

    const result = await completePaymentFromCheckoutToken(checkoutToken);

    if (!result.success) {
      return buildPaymentRedirectUrl('failed', result.payment.orderId);
    }

    return buildPaymentRedirectUrl('success', result.payment.orderId);
  } catch (error) {
    const orderId = checkoutToken ? await findOrderIdByCheckoutToken(checkoutToken) : null;

    logger.error(
      { err: error, orderId, hasToken: Boolean(checkoutToken) },
      'Iyzico ödeme callback doğrulaması başarısız'
    );

    return buildPaymentRedirectUrl('failed', orderId);
  }
};

