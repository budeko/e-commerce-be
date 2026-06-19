import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app/app';

const mockRegister = vi.fn();

vi.mock('@/features/identity/register/register.service', () => ({
  register: (...args: unknown[]) => mockRegister(...args),
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

describe('register routes integration', () => {
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

  it('POST /auth/register geçersiz body ile 400 döner', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: 'Geçersiz istek verisi' });
  });

  it('POST /auth/register başarılı kayıt oluşturur', async () => {
    mockRegister.mockResolvedValue({
      user: {
        _id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'buyer@test.com',
        role: 'buyer',
        isEmailVerified: false,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'buyer@test.com',
        password: 'Test1234!',
        role: 'buyer',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      message: 'Kayıt başarılı. E-posta adresini doğrula.',
      role: 'buyer',
      isEmailVerified: false,
    });
  });
});
