import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindOne = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockSendVerification = vi.fn();
const mockInvalidateAuthOtp = vi.fn();
const mockAssertEmailCooldown = vi.fn();
const mockMarkVerificationEmailSent = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

vi.mock('../../../shared/mail/send-verification', () => ({
  sendUserVerificationEmail: (...args: unknown[]) => mockSendVerification(...args),
}));

vi.mock('../../../shared/otp/otp', () => ({
  invalidateAuthOtp: (...args: unknown[]) => mockInvalidateAuthOtp(...args),
}));

vi.mock('../../../shared/mail/cooldown', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth/shared/mail/cooldown')>(
    '../../../shared/mail/cooldown'
  );

  return {
    ...actual,
    assertEmailCooldown: (...args: unknown[]) => mockAssertEmailCooldown(...args),
    markVerificationEmailSent: (...args: unknown[]) => mockMarkVerificationEmailSent(...args),
  };
});

import { EmailCooldownError } from '@/features/auth/shared/mail/cooldown';
import { resendVerificationEmail } from '@/features/auth/verification/resend-verification/services/resend-verification.service';

describe('resendVerificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendVerification.mockResolvedValue(undefined);
    mockMarkVerificationEmailSent.mockResolvedValue(undefined);
    mockInvalidateAuthOtp.mockResolvedValue(undefined);
    mockAssertEmailCooldown.mockImplementation(() => {});
  });

  it('doğrulanmamış kullanıcıya mail gönderir', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      isEmailVerified: false,
      verificationEmailSentAt: null,
    });

    await resendVerificationEmail('user@example.com');

    expect(mockAssertEmailCooldown).toHaveBeenCalled();
    expect(mockSendVerification).toHaveBeenCalled();
    expect(mockMarkVerificationEmailSent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('cooldown içinde 429 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      isEmailVerified: false,
      verificationEmailSentAt: new Date(),
    });
    mockAssertEmailCooldown.mockImplementation(() => {
      throw new EmailCooldownError(429, 'E-posta az önce gönderildi. 50 saniye sonra tekrar deneyin');
    });

    await expect(resendVerificationEmail('user@example.com')).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(mockSendVerification).not.toHaveBeenCalled();
  });

  it('mail gitmezse OTP iptal eder ve 503 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      isEmailVerified: false,
    });
    mockSendVerification.mockRejectedValue(new Error('Resend hatası'));

    await expect(resendVerificationEmail('user@example.com')).rejects.toMatchObject({
      statusCode: 503,
      message: 'Doğrulama e-postası gönderilemedi, lütfen tekrar deneyin',
    });

    expect(mockInvalidateAuthOtp).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'email_verify'
    );
  });
});
