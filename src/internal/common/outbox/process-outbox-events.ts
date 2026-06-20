import { env } from '@/config/env';
import {
  sendSellerApprovedEmail,
  sendSellerRejectedEmail,
} from '@/internal/auth/admin/mail/send-seller-notifications';
import { logger } from '@/internal/common/logging';
import { OUTBOX_EVENT_TYPES } from '@/internal/common/outbox/enqueue-outbox-event';
import {
  listPendingOutboxEvents,
  markOutboxEventFailed,
  markOutboxEventProcessed,
} from '@/repositories/common/outbox-event.repository';

const BATCH_SIZE = 20;

const processOutboxEvent = async (event: {
  _id: unknown;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
}): Promise<void> => {
  const eventId = String(event._id);
  const attempts = (event.attempts ?? 0) + 1;

  try {
    if (event.eventType === OUTBOX_EVENT_TYPES.EMAIL_SELLER_APPROVED) {
      const email = String(event.payload.email ?? '');
      const companyName = String(event.payload.companyName ?? '');
      await sendSellerApprovedEmail(email, companyName);
    } else if (event.eventType === OUTBOX_EVENT_TYPES.EMAIL_SELLER_REJECTED) {
      const email = String(event.payload.email ?? '');
      const reason = String(event.payload.reason ?? '');
      const companyName = String(event.payload.companyName ?? '');
      await sendSellerRejectedEmail(email, reason, companyName);
    } else {
      throw new Error(`Unsupported outbox event type: ${event.eventType}`);
    }

    await markOutboxEventProcessed(eventId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markOutboxEventFailed(eventId, message, attempts);
    throw error;
  }
};

export const processPendingOutboxEvents = async (): Promise<number> => {
  const events = await listPendingOutboxEvents(BATCH_SIZE);
  let processedCount = 0;

  for (const event of events) {
    try {
      await processOutboxEvent({
        _id: event._id,
        eventType: event.eventType,
        payload: event.payload as Record<string, unknown>,
        attempts: event.attempts ?? 0,
      });
      processedCount += 1;
    } catch (error) {
      logger.warn(
        { err: error, eventId: event._id, eventType: event.eventType },
        'Outbox event işlenemedi'
      );
    }
  }

  return processedCount;
};

export const startOutboxProcessorScheduler = (): void => {
  if (env.nodeEnv === 'test') {
    return;
  }

  const run = () => {
    void processPendingOutboxEvents()
      .then((count) => {
        if (count > 0) {
          logger.info({ count }, 'Outbox eventleri işlendi');
        }
      })
      .catch((error) => {
        logger.error({ err: error }, 'Outbox işleyici hatası');
      });
  };

  run();
  setInterval(run, 60_000);
};
