import * as Sentry from '@sentry/node';
import { env } from '@/config/env';

let initialized = false;

export const initSentry = (): void => {
  if (initialized || env.nodeEnv === 'test') {
    return;
  }

  if (!env.sentryEnabled || !env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
    tracesSampleRate: env.sentryTracesSampleRate,
  });

  initialized = true;
};

export const isSentryEnabled = (): boolean => initialized;
