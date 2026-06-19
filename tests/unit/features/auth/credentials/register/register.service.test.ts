import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindOne = vi.fn();
const mockCreate = vi.fn();
const mockBuyerCreate = vi.fn();
const mockSellerCreate = vi.fn();
const mockDeleteUnverifiedUser = vi.fn();
const mockSendVerification = vi.fn();
const mockAssertRegisterEmailCooldown = vi.fn();
const mockMarkRegisterEmailCooldown = vi.fn();
const mockMarkVerificationEmailSent = vi.fn();
const mockInvalidateAuthOtp = vi.fn();

vi.mock('@/db', () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  },
  Buyer: {
    create: (...args: unknown[]) => mockBuyerCreate(...args),
  },
  Seller: {
    create: (...args: unknown[]) => mockSellerCreate(...args),
  },
}));

vi.mock('@/features/auth/core/mail/cooldown', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth/core/mail/cooldown')>(
    '@/features/auth/core/mail/cooldown'
  );
  return {
    ...actual,
    assertRegisterEmailCooldown: (...args: unknown[]) => mockAssertRegisterEmailCooldown(...args),
    markRegisterEmailCooldown: (...args: unknown[]) => mockMarkRegisterEmailCooldown(...args),
    markVerificationEmailSent: (...args: unknown[]) => mockMarkVerificationEmailSent(...args),
  };
});

vi.mock('@/features/auth/core/otp/otp', () => ({
  invalidateAuthOtp: (...args: unknown[]) => mockInvalidateAuthOtp(...args),
}));

vi.mock('@/features/auth/core/register/unverified-user', () => ({
  deleteUnverifiedUser: (...args: unknown[]) => mockDeleteUnverifiedUser(...args),
  getVerificationExpiresAt: () => new Date(Date.now() + 86_400_000),
}));

vi.mock('@/features/auth/core/mail/send-verification', () => ({
  sendUserVerificationEmail: (...args: unknown[]) => mockSendVerification(...args),
}));

const mockCreateUserId = vi.fn();

vi.mock('@/internal/ids', () => ({
  createUserId: () => mockCreateUserId(),
}));

vi.mock('@/internal/security', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

import { register } from '@/features/auth/credentials/register/register.service';

const existingUserId = '550e8400-e29b-41d4-a716-446655440000';
const newUserId = '550e8400-e29b-41d4-a716-446655440001';

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUserId.mockReturnValue(newUserId);
    mockBuyerCreate.mockResolvedValue({});
    mockAssertRegisterEmailCooldown.mockResolvedValue(undefined);
    mockMarkRegisterEmailCooldown.mockResolvedValue(undefined);
    mockSendVerification.mockResolvedValue(undefined);
    mockMarkVerificationEmailSent.mockResolvedValue(undefined);
    mockInvalidateAuthOtp.mockResolvedValue(undefined);
  });

  it('doğrulanmamış eski kaydı silip yeniden kayıt oluşturur', async () => {
    mockFindOne.mockResolvedValue({
      _id: existingUserId,
      isEmailVerified: false,
    });
    mockCreate.mockResolvedValue({
      _id: newUserId,
      email: 'user@example.com',
      role: 'buyer',
      isEmailVerified: false,
    });

    const result = await register({
      email: 'user@example.com',
      password: 'SecurePass1',
      role: 'buyer',
    });

    expect(mockDeleteUnverifiedUser).toHaveBeenCalledWith(existingUserId);
    expect(mockMarkRegisterEmailCooldown).toHaveBeenCalledWith('user@example.com');
    expect(result.user.isEmailVerified).toBe(false);
  });

  it('cooldown aktifken 429 döner', async () => {
    const { EmailCooldownError } = await import('@/features/auth/core/mail/cooldown');

    mockAssertRegisterEmailCooldown.mockRejectedValue(
      new EmailCooldownError(429, 'E-posta gönderimleri arasında bekleme süresi var')
    );

    await expect(
      register({
        email: 'user@example.com',
        password: 'SecurePass1',
        role: 'buyer',
      })
    ).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('mail gönderilemezse kaydı siler ve 503 döner', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      _id: newUserId,
      email: 'user@example.com',
      role: 'buyer',
      isEmailVerified: false,
    });
    mockSendVerification.mockRejectedValue(new Error('Resend hatası'));

    await expect(
      register({
        email: 'user@example.com',
        password: 'SecurePass1',
        role: 'buyer',
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      message: 'Doğrulama e-postası gönderilemedi, lütfen tekrar deneyin',
    });

    expect(mockDeleteUnverifiedUser).toHaveBeenCalledWith(newUserId);
  });

  it('doğrulanmış e-postada 409 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: existingUserId,
      isEmailVerified: true,
    });

    await expect(
      register({
        email: 'user@example.com',
        password: 'SecurePass1',
        role: 'buyer',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
