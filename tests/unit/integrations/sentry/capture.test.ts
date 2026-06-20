import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: { setExtras: ReturnType<typeof vi.fn> }) => void) => {
    callback({ setExtras: vi.fn() });
  }),
}));

vi.mock('@/integrations/sentry/init', () => ({
  isSentryEnabled: vi.fn(),
}));

import * as Sentry from '@sentry/node';
import { HttpError } from '@/internal/common/errors';
import { isSentryEnabled } from '@/integrations/sentry/init';
import { captureException } from '@/integrations/sentry/capture';

describe('captureException', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Sentry kapalıyken no-op', () => {
    vi.mocked(isSentryEnabled).mockReturnValue(false);

    captureException(new Error('boom'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('beklenmeyen hataları Sentry\'ye gönderir', () => {
    vi.mocked(isSentryEnabled).mockReturnValue(true);
    const error = new Error('boom');

    captureException(error, { route: '/test' });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('4xx HttpError göndermez', () => {
    vi.mocked(isSentryEnabled).mockReturnValue(true);

    captureException(new HttpError(400, 'bad request'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
