import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app/app';

const mockVerifyEmail = vi.fn();

vi.mock('@/features/auth/verification/verify-email/verify-email.service', () => ({
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
}));

vi.mock('@/internal/auth/responses/user.response', () => ({
  buildAuthUserFields: vi.fn().mockResolvedValue({
    role: 'buyer',
    isActive: false,
    companyId: null,
    isOwner: null,
    approvalStatus: null,
  }),
}));

describe('verify-email routes integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /auth/verify-email geçersiz body ile 400 döner', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: 'Geçersiz istek verisi' });
  });

  it('POST /auth/verify-email token ile doğrular', async () => {
    mockVerifyEmail.mockResolvedValue({
      user: {
        _id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'buyer@test.com',
        role: 'buyer',
        isEmailVerified: true,
      },
      token: 'access-token-123',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token: 'verify-token-123' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'E-posta doğrulandı',
      isEmailVerified: true,
      token: 'access-token-123',
    });
  });
});
