import { refundIyzicoPayment } from '@/integrations/iyzico/refund-payment';
import { createLogger } from '@/internal/common/logging';
import { findOrderByIdLean } from '@/repositories/buyers/order.repository';
import {
  listCompletedIyzicoPaymentsLean,
  updatePaymentById,
} from '@/repositories/buyers/payment.repository';

const log = createLogger({ module: 'payment-reconcile' });

export const reconcilePaymentOrderMismatches = async (): Promise<number> => {
  const mismatches = await listCompletedIyzicoPaymentsLean();

  let handled = 0;

  for (const payment of mismatches) {
    const order = await findOrderByIdLean(payment.orderId);

    if (!order || order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
      continue;
    }

    log.error(
      {
        orderId: payment.orderId,
        paymentId: payment._id,
        orderStatus: order.status,
        externalId: payment.externalId,
      },
      'Ödeme tamamlandı ancak sipariş uyumsuz; iade deneniyor'
    );

    const refunded = payment.externalId
      ? await refundIyzicoPayment(String(payment.externalId), payment.amount, payment.orderId)
      : false;

    await updatePaymentById(String(payment._id), {
      status: refunded ? 'refunded' : 'completed',
      updatedAt: new Date(),
    });

    if (!refunded) {
      log.error(
        { orderId: payment.orderId, paymentId: payment._id },
        'Otomatik iade başarısız; manuel müdahale gerekir'
      );
    }

    handled += 1;
  }

  return handled;
};

export const startPaymentReconciliationScheduler = (): void => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const run = () => {
    void reconcilePaymentOrderMismatches().catch((err) => {
      log.error({ err }, 'Ödeme-sipariş uzlaştırma işi başarısız');
    });
  };

  run();
  setInterval(run, 5 * 60_000);
};
