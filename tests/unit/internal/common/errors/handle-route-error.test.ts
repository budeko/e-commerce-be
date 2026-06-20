import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyReply } from 'fastify';
import { AuthError } from '@/internal/auth/errors';
import { CommerceError } from '@/internal/common/errors/commerce-error';

vi.mock('@/internal/common/logging', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('@/integrations/sentry/capture', () => ({
  captureException: vi.fn(),
}));

import { handleRouteError } from '@/internal/common/errors/handle-route-error';
import { captureException } from '@/integrations/sentry/capture';
import { logger } from '@/internal/common/logging';

const createReply = () => {
  const reply = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return reply as unknown as FastifyReply & { statusCode: number; body: unknown };
};

describe('handleRouteError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('HttpError için status ve mesaj döner', () => {
    const reply = createReply();

    handleRouteError(reply, new CommerceError(404, 'Ürün bulunamadı'), 'Sunucu hatası');

    expect(reply.statusCode).toBe(404);
    expect(reply.body).toEqual({ message: 'Ürün bulunamadı' });
  });

  it('AuthError için status ve mesaj döner', () => {
    const reply = createReply();

    handleRouteError(reply, new AuthError(403, 'Yetkisiz'), 'Sunucu hatası');

    expect(reply.statusCode).toBe(403);
    expect(reply.body).toEqual({ message: 'Yetkisiz' });
  });

  it('duplicate key için 409 döner', () => {
    const reply = createReply();

    handleRouteError(reply, { code: 11000 }, 'Kayıt hatası', {
      duplicateKeyMessage: 'Kayıt zaten var',
    });

    expect(reply.statusCode).toBe(409);
    expect(reply.body).toEqual({ message: 'Kayıt zaten var' });
  });

  it('bilinmeyen hata için fallback mesaj döner', () => {
    const reply = createReply();

    handleRouteError(reply, new Error('boom'), 'İşlem sırasında bir hata oluştu');

    expect(reply.statusCode).toBe(500);
    expect(reply.body).toEqual({ message: 'İşlem sırasında bir hata oluştu' });
    expect(logger.error).toHaveBeenCalled();
    expect(captureException).toHaveBeenCalled();
  });
});
