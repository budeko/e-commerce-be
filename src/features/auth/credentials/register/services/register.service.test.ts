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

vi.mock('../../../../../db', () => ({
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

vi.mock('../../../shared/mail/cooldown', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth/shared/mail/cooldown')>(
    '../../../shared/mail/cooldown'
  );
  return {
    ...actual,
    assertRegisterEmailCooldown: (...args: unknown[]) => mockAssertRegisterEmailCooldown(...args),
    markRegisterEmailCooldown: (...args: unknown[]) => mockMarkRegisterEmailCooldown(...args),
    markVerificationEmailSent: (...args: unknown[]) => mockMarkVerificationEmailSent(...args),
  };
});

vi.mock('../../../shared/otp/otp', () => ({
  invalidateAuthOtp: (...args: unknown[]) => mockInvalidateAuthOtp(...args),
}));

vi.mock('../helpers/unverified-user', () => ({
  deleteUnverifiedUser: (...args: unknown[]) => mockDeleteUnverifiedUser(...args),
  getVerificationExpiresAt: () => new Date(Date.now() + 86_400_000),
}));

vi.mock('../../../shared/mail/send-verification', () => ({
  sendUserVerificationEmail: (...args: unknown[]) => mockSendVerification(...args),
}));

vi.mock('../../../../../lib/common/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

import { register } from '@/features/auth/credentials/register/services/register.service';

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuyerCreate.mockResolvedValue({});
    mockAssertRegisterEmailCooldown.mockResolvedValue(undefined);
    mockMarkRegisterEmailCooldown.mockResolvedValue(undefined);
    mockSendVerification.mockResolvedValue(undefined);
    mockMarkVerificationEmailSent.mockResolvedValue(undefined);
    mockInvalidateAuthOtp.mockResolvedValue(undefined);
  });

  it('doğrulanmamış eski kaydı silip yeniden kayıt oluşturur', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      isEmailVerified: false,
    });
    mockCreate.mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      email: 'user@example.com',
      role: 'buyer',
      isEmailVerified: false,
    });

    const result = await register({
      email: 'user@example.com',
      password: 'SecurePass1',
      role: 'buyer',
    });

    expect(mockDeleteUnverifiedUser).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockMarkRegisterEmailCooldown).toHaveBeenCalledWith('user@example.com');
    expect(result.user.isEmailVerified).toBe(false);
  });

  it('cooldown aktifken 429 döner', async () => {
    const { EmailCooldownError } = await import('@/features/auth/shared/mail/cooldown');

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
      _id: '507f1f77bcf86cd799439012',
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

    expect(mockDeleteUnverifiedUser).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
  });

  it('doğrulanmış e-postada 409 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
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
