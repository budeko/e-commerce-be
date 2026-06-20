import { createUserId } from '@/internal/common/ids';
import { createLogger } from '@/internal/common/logging';
import { createOutboxEvent } from '@/repositories/common/outbox-event.repository';

const log = createLogger({ module: 'outbox' });

export const OUTBOX_EVENT_TYPES = {
  EMAIL_SELLER_APPROVED: 'email.seller.approved',
  EMAIL_SELLER_REJECTED: 'email.seller.rejected',
} as const;

export type OutboxEventType = (typeof OUTBOX_EVENT_TYPES)[keyof typeof OUTBOX_EVENT_TYPES];

export const enqueueOutboxEvent = async (
  eventType: OutboxEventType,
  payload: Record<string, unknown>
): Promise<void> => {
  try {
    await createOutboxEvent({
      _id: createUserId(),
      eventType,
      payload,
    });
    log.info({ eventType }, 'Outbox event enqueued');
  } catch (error) {
    log.error({ err: error, eventType, payload }, 'Outbox event yazılamadı');
  }
};
