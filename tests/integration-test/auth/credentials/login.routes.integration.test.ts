import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app/app';

const mockLogin = vi.fn();

vi.mock('@/features/auth/credentials/login/login.service', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

vi.mock('@/features/auth/core/responses/user.response', () => ({
  buildAuthUserFields: vi.fn().mockResolvedValue({
    role: 'buyer',
    isActive: true,
    companyId: null,
    isOwner: null,
    approvalStatus: null,
  }),
}));

describe('login routes integration', () => {
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

  it('POST /auth/login geçersiz body ile 400 döner', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: 'Geçersiz istek verisi' });
  });

  it('POST /auth/login başarılı giriş token döner', async () => {
    mockLogin.mockResolvedValue({
      user: {
        _id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'buyer@test.com',
        role: 'buyer',
      },
      token: 'access-token-123',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'buyer@test.com', password: 'Test1234!' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Giriş başarılı',
      role: 'buyer',
      token: 'access-token-123',
    });
  });
});
