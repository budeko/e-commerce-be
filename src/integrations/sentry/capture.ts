import * as Sentry from '@sentry/node';
import { HttpError } from '@/internal/common/errors';
import { isSentryEnabled } from '@/integrations/sentry/init';

const shouldCapture = (error: unknown): boolean => {
  if (error instanceof HttpError) {
    return error.statusCode >= 500;
  }

  return true;
};

export const captureException = (
  error: unknown,
  context?: Record<string, unknown>
): void => {
  if (!isSentryEnabled() || !shouldCapture(error)) {
    return;
  }

  if (!context) {
    Sentry.captureException(error);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setExtras(context);
    Sentry.captureException(error);
  });
};
