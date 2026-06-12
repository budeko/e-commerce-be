import { describe, expect, it } from 'vitest';
import { AuthError } from '@/features/auth/shared/errors';
import { handleAuthRouteError } from '@/features/auth/shared/handle-route-error';

const createReply = () => {
  const reply = {
    statusCode: 200,
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

  return reply as unknown as import('fastify').FastifyReply & {
    statusCode: number;
    body: unknown;
  };
};

describe('handleAuthRouteError', () => {
  it('AuthError status ve mesajını döner', () => {
    const reply = createReply();

    handleAuthRouteError(reply, new AuthError(403, 'Yetkisiz'), 'Sunucu hatası');

    expect(reply.statusCode).toBe(403);
    expect(reply.body).toEqual({ message: 'Yetkisiz' });
  });

  it('duplicate key hatasını 409 olarak döner', () => {
    const reply = createReply();

    handleAuthRouteError(reply, { code: 11000 }, 'Kayıt hatası', {
      duplicateKeyMessage: 'Bu e-posta adresi zaten kayıtlı',
    });

    expect(reply.statusCode).toBe(409);
    expect(reply.body).toEqual({ message: 'Bu e-posta adresi zaten kayıtlı' });
  });

  it('bilinmeyen hatalarda fallback mesaj döner', () => {
    const reply = createReply();

    handleAuthRouteError(reply, new Error('boom'), 'Giriş sırasında bir hata oluştu');

    expect(reply.statusCode).toBe(500);
    expect(reply.body).toEqual({ message: 'Giriş sırasında bir hata oluştu' });
  });
});
