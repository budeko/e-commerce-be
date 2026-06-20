import mongoose from 'mongoose';
import type { ItemFulfillmentStatus, OrderStatus } from '@/integrations/mongo';
import { createUserId } from '@/internal/common/ids';
import { CommerceError } from '@/internal/common/errors/commerce-error';
import { approvePaymentSplitsForSeller } from '@/internal/buyers/payment/payment-split';
import { cancelPendingOrder } from '@/internal/buyers/orders/cancel-pending-order';
import {
  assertProductStockAvailable,
  assertSellersReadyForOrder,
  resolveOrderUnitPrice,
} from '@/internal/buyers/orders/order-item-validation';
import {
  assertSellerItemStatusTransition,
  computeAggregateOrderStatus,
  computeSellerSubtotal,
} from '@/internal/buyers/orders/order-fulfillment';
import type { UpdateOrderStatusInput } from '@/features/buyers/orders/update-order-status.schema';
import { findBuyerShippingProfileLean } from '@/repositories/buyers/buyer.repository';
import { clearNonEmptyCartInSession } from '@/repositories/buyers/cart.repository';
import {
  createOrderInSession,
  findBuyerOrder,
  findOrderByIdLean,
  findSellerOrderForUpdate,
  findSellerOrderLean,
  listBuyerOrdersLean,
  listSellerOrdersLean,
  saveOrderDocument,
} from '@/repositories/buyers/order.repository';
import { failPendingPaymentsByOrderId } from '@/repositories/buyers/payment.repository';
import { findActiveCatalogProductLean } from '@/repositories/catalog/product.repository';

type OrderItemRecord = {
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  fulfillmentStatus?: ItemFulfillmentStatus;
};

type ShippingAddressRecord = {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
};

type OrderRecord = {
  _id: unknown;
  buyerId: string;
  items: OrderItemRecord[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShippingAddressRecord;
  createdAt?: Date;
  updatedAt?: Date;
};

const toOrderResponse = (order: OrderRecord) => ({
  id: String(order._id),
  buyerId: order.buyerId,
  items: order.items,
  totalAmount: order.totalAmount,
  currency: order.currency,
  status: order.status,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const buildShippingAddress = async (buyerId: string): Promise<ShippingAddressRecord> => {
  const buyer = await findBuyerShippingProfileLean(buyerId);

  if (
    !buyer?.firstName ||
    !buyer.lastName ||
    !buyer.phone ||
    !buyer.country ||
    !buyer.city ||
    !buyer.deliveryAddress
  ) {
    throw new CommerceError(400, 'Sipariş için teslimat profili eksik');
  }

  return {
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    phone: buyer.phone,
    country: buyer.country,
    city: buyer.city,
    address: buyer.deliveryAddress,
  };
};

export const getBuyerOrder = findBuyerOrder;

const buildOrderItemsFromCart = async (
  cartItems: Array<{ productId: string; quantity: number; priceSnapshot?: number | null }>
) => {
  const orderItems: OrderItemRecord[] = [];

  for (const item of cartItems) {
    const product = await findActiveCatalogProductLean(item.productId);

    if (!product) {
      throw new CommerceError(400, 'Sepette geçersiz ürün var');
    }

    assertProductStockAvailable(product, item.quantity);

    const price = resolveOrderUnitPrice(item.priceSnapshot, product.price);

    orderItems.push({
      productId: item.productId,
      sellerId: product.sellerId,
      name: product.name,
      price,
      quantity: item.quantity,
      subtotal: price * item.quantity,
      fulfillmentStatus: 'pending',
    });
  }

  await assertSellersReadyForOrder(orderItems);

  return orderItems;
};

export const createOrderFromCart = async (buyerId: string) => {
  const shippingAddress = await buildShippingAddress(buyerId);
  const orderId = createUserId();
  const session = await mongoose.startSession();

  try {
    let createdOrder: OrderRecord | null = null;

    await session.withTransaction(async () => {
      const cart = await clearNonEmptyCartInSession(buyerId, session);

      if (!cart?.items?.length) {
        throw new CommerceError(400, 'Sepet boş');
      }

      const orderItems = await buildOrderItemsFromCart(cart.items);
      const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

      const order = await createOrderInSession(
        {
          _id: orderId,
          buyerId,
          items: orderItems,
          totalAmount,
          currency: 'TRY',
          status: 'pending',
          shippingAddress,
        },
        session
      );

      createdOrder = order.toObject() as OrderRecord;
    });

    if (!createdOrder) {
      throw new CommerceError(500, 'Sipariş oluşturulamadı');
    }

    return toOrderResponse(createdOrder);
  } finally {
    await session.endSession();
  }
};

export const listBuyerOrders = async (buyerId: string) => {
  const orders = await listBuyerOrdersLean(buyerId);

  return orders.map((order) => toOrderResponse(order as OrderRecord));
};

export const getBuyerOrderById = async (buyerId: string, orderId: string) => {
  const order = await getBuyerOrder(buyerId, orderId);

  return toOrderResponse(order as OrderRecord);
};

export const listSellerOrders = async (sellerId: string) => {
  const orders = await listSellerOrdersLean(sellerId);

  return orders.map((order) => {
    const sellerItems = order.items.filter((item) => item.sellerId === sellerId);

    return {
      ...toOrderResponse(order as OrderRecord),
      items: sellerItems,
      totalAmount: computeSellerSubtotal(order.items, sellerId),
    };
  });
};

export const getSellerOrderById = async (sellerId: string, orderId: string) => {
  const order = await findSellerOrderLean(sellerId, orderId);
  const sellerItems = order.items.filter((item) => item.sellerId === sellerId);

  return {
    ...toOrderResponse(order as OrderRecord),
    items: sellerItems,
    totalAmount: computeSellerSubtotal(order.items, sellerId),
  };
};

export const updateOrderStatus = async (
  sellerId: string,
  orderId: string,
  input: UpdateOrderStatusInput
) => {
  const order = await findSellerOrderForUpdate(sellerId, orderId);

  if (!order) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  if (order.status !== 'paid' && order.status !== 'shipped') {
    throw new CommerceError(400, 'Sipariş bu durumda güncellenemez');
  }

  let sellerItemsUpdated = false;

  for (const item of order.items) {
    if (item.sellerId !== sellerId) {
      continue;
    }

    const currentStatus = (item.fulfillmentStatus ?? 'pending') as ItemFulfillmentStatus;
    assertSellerItemStatusTransition(currentStatus, input.status);
    sellerItemsUpdated = true;
  }

  if (!sellerItemsUpdated) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  if (input.status === 'delivered') {
    await approvePaymentSplitsForSeller(orderId, sellerId);
  }

  for (const item of order.items) {
    if (item.sellerId !== sellerId) {
      continue;
    }

    item.fulfillmentStatus = input.status;
  }

  order.status = computeAggregateOrderStatus(order.items);
  await saveOrderDocument(order);

  return toOrderResponse(order.toObject() as OrderRecord);
};

export const cancelBuyerPendingOrder = async (buyerId: string, orderId: string) => {
  const order = await findBuyerOrder(buyerId, orderId);

  if (order.status !== 'pending') {
    throw new CommerceError(400, 'Yalnızca bekleyen sipariş iptal edilebilir');
  }

  const cancelled = await cancelPendingOrder(orderId);

  if (!cancelled) {
    throw new CommerceError(400, 'Sipariş iptal edilemedi');
  }

  await failPendingPaymentsByOrderId(orderId);

  const updatedOrder = await findOrderByIdLean(orderId);

  return toOrderResponse(updatedOrder as OrderRecord);
};
