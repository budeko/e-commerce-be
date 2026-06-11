import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindOne = vi.fn();
const mockCreateAuthOtp = vi.fn();
const mockInvalidateAuthOtp = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockAssertEmailCooldown = vi.fn();
const mockMarkPasswordResetEmailSent = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}));

vi.mock('../../../../../lib/auth/otp/otp', () => ({
  createAuthOtp: (...args: unknown[]) => mockCreateAuthOtp(...args),
  invalidateAuthOtp: (...args: unknown[]) => mockInvalidateAuthOtp(...args),
}));

vi.mock('../../../../../lib/auth/token/email-token', () => ({
  signPasswordResetToken: vi.fn().mockReturnValue('reset-token'),
}));

vi.mock('../../../../../lib/auth/mail/send', () => ({
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
}));

vi.mock('../../../../../lib/auth/mail/cooldown', async () => {
  const actual = await vi.importActual<typeof import('../../../../../lib/auth/mail/cooldown')>(
    '../../../../../lib/auth/mail/cooldown'
  );

  return {
    ...actual,
    assertEmailCooldown: (...args: unknown[]) => mockAssertEmailCooldown(...args),
    markPasswordResetEmailSent: (...args: unknown[]) => mockMarkPasswordResetEmailSent(...args),
  };
});

import { EmailCooldownError } from '../../../../../lib/auth/mail/cooldown';
import { forgotPassword } from './forgot-password.service';

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAuthOtp.mockResolvedValue('482913');
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    mockInvalidateAuthOtp.mockResolvedValue(undefined);
    mockMarkPasswordResetEmailSent.mockResolvedValue(undefined);
    mockAssertEmailCooldown.mockImplementation(() => {});
  });

  it('kayıtlı olmayan e-postada sessizce döner', async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(forgotPassword('ghost@example.com')).resolves.toBeUndefined();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('mail giderse OTP oluşturup mail gönderir', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
    });

    await forgotPassword('user@example.com');

    expect(mockCreateAuthOtp).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'password_reset'
    );
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      'reset-token',
      '482913'
    );
    expect(mockMarkPasswordResetEmailSent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('cooldown içinde 429 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      passwordResetEmailSentAt: new Date(),
    });
    mockAssertEmailCooldown.mockImplementation(() => {
      throw new EmailCooldownError(429, 'E-posta az önce gönderildi. 45 saniye sonra tekrar deneyin');
    });

    await expect(forgotPassword('user@example.com')).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(mockCreateAuthOtp).not.toHaveBeenCalled();
  });

  it('mail gitmezse OTP iptal eder ve 503 döner', async () => {
    mockFindOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
    });
    mockSendPasswordResetEmail.mockRejectedValue(new Error('Resend hatası'));

    await expect(forgotPassword('user@example.com')).rejects.toMatchObject({
      statusCode: 503,
      message: 'Şifre sıfırlama e-postası gönderilemedi, lütfen tekrar deneyin',
    });

    expect(mockInvalidateAuthOtp).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'password_reset'
    );
  });
});
