import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';

const mockUserFindById = vi.fn();
const mockIsTokenRevoked = vi.fn();
const mockVerifyAuthToken = vi.fn();

vi.mock('../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
}));

vi.mock('../session/revoke-token', () => ({
  isTokenRevoked: (...args: unknown[]) => mockIsTokenRevoked(...args),
}));

vi.mock('../../../../lib/auth/token/access-token', () => ({
  verifyAuthToken: (...args: unknown[]) => mockVerifyAuthToken(...args),
}));

import { requireAuth } from './require-auth';

const userId = '507f1f77bcf86cd799439011';

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

  return reply as unknown as FastifyReply & { statusCode: number; body: unknown };
};

const createRequest = (token = 'valid-token') =>
  ({
    headers: { authorization: `Bearer ${token}` },
  }) as FastifyRequest;

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    mockIsTokenRevoked.mockResolvedValue(false);
    mockVerifyAuthToken.mockReturnValue({ userId, role: 'seller' });
  });

  it('token yoksa 401 döner', async () => {
    const request = { headers: {} } as FastifyRequest;
    const reply = createReply();

    await requireAuth(request, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.body).toEqual({ message: 'Giriş gerekli' });
  });

  it('DB rolü token ile uyuşmazsa 401 döner', async () => {
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        role: 'buyer',
        passwordChangedAt: null,
        sessionsRevokedAt: null,
      }),
    });

    const request = createRequest();
    const reply = createReply();

    await requireAuth(request, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.body).toEqual({ message: 'Oturum geçersiz, tekrar giriş yapın' });
  });

  it('kullanıcı silinmişse 401 döner', async () => {
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const request = createRequest();
    const reply = createReply();

    await requireAuth(request, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.body).toEqual({ message: 'Oturum geçersiz, tekrar giriş yapın' });
  });

  it('geçerli token ve rol ile auth set eder', async () => {
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        role: 'seller',
        passwordChangedAt: null,
        sessionsRevokedAt: null,
      }),
    });

    const request = createRequest();
    const reply = createReply();

    await requireAuth(request, reply);

    expect(request.auth).toEqual({ userId, role: 'seller' });
    expect(reply.body).toBeUndefined();
  });
});
