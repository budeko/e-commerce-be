import { createLogger } from '@/internal/common/logging';
import { approvePaymentSplitsForSeller } from '@/internal/buyers/payment/payment-split';
import { findOrderByIdLean } from '@/repositories/buyers/order.repository';
import {
  listRetryablePaymentSplitGroupsLean,
  resetFailedPaymentSplitsToPending,
} from '@/repositories/buyers/payment-split.repository';

const log = createLogger({ module: 'retry-payment-splits' });

const isSellerDeliveryComplete = (
  order: {
    items: Array<{ sellerId: string; fulfillmentStatus?: string | null }>;
  },
  sellerId: string
) =>
  order.items
    .filter((item) => item.sellerId === sellerId)
    .every((item) => item.fulfillmentStatus === 'delivered');

export const retryFailedPaymentSplitApprovals = async (): Promise<number> => {
  const groups = await listRetryablePaymentSplitGroupsLean();
  let handled = 0;

  for (const group of groups) {
    const order = await findOrderByIdLean(group.orderId);

    if (!order || !isSellerDeliveryComplete(order, group.sellerId)) {
      continue;
    }

    try {
      await resetFailedPaymentSplitsToPending(group.orderId, group.sellerId);
      await approvePaymentSplitsForSeller(group.orderId, group.sellerId);
      handled += 1;
    } catch (error) {
      log.warn(
        { err: error, orderId: group.orderId, sellerId: group.sellerId },
        'Split onay yeniden denemesi başarısız'
      );
    }
  }

  return handled;
};

export const startPaymentSplitApprovalRetryScheduler = (): void => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const run = () => {
    void retryFailedPaymentSplitApprovals().catch((err) => {
      log.error({ err }, 'Split onay yeniden deneme işi başarısız');
    });
  };

  run();
  setInterval(run, 5 * 60_000);
};
