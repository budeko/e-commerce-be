import { OutboxEvent } from '@/integrations/mongo';

export const createOutboxEvent = async (data: {
  _id: string;
  eventType: string;
  payload: Record<string, unknown>;
}) =>
  OutboxEvent.create({
    ...data,
    status: 'pending',
    attempts: 0,
    lastError: null,
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

export const listPendingOutboxEvents = async (limit: number) =>
  OutboxEvent.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

export const markOutboxEventProcessed = async (eventId: string) =>
  OutboxEvent.findByIdAndUpdate(eventId, {
    $set: {
      status: 'processed',
      processedAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
    },
  });

export const markOutboxEventFailed = async (
  eventId: string,
  errorMessage: string,
  attempts: number
) =>
  OutboxEvent.findByIdAndUpdate(eventId, {
    $set: {
      status: attempts >= 5 ? 'failed' : 'pending',
      lastError: errorMessage.slice(0, 2000),
      attempts,
      updatedAt: new Date(),
    },
  });
