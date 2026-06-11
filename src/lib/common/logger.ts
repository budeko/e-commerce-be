import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

export const createLogger = (context: Record<string, unknown>) => logger.child(context);
