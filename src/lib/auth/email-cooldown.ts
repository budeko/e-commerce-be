import { AuthEmailCooldown, User } from '../../db';
import { RegisterError } from '../../features/auth/register/register.errors';

export const EMAIL_COOLDOWN_MS = 60_000;

export class EmailCooldownError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const getEmailCooldownRemainingSeconds = (
  lastSentAt: Date | null | undefined
): number => {
  if (!lastSentAt) {
    return 0;
  }

  const remainingMs = EMAIL_COOLDOWN_MS - (Date.now() - lastSentAt.getTime());
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

export const assertEmailCooldown = (lastSentAt: Date | null | undefined) => {
  const remainingSeconds = getEmailCooldownRemainingSeconds(lastSentAt);

  if (remainingSeconds > 0) {
    throw new EmailCooldownError(
      429,
      `E-posta az önce gönderildi. ${remainingSeconds} saniye sonra tekrar deneyin`
    );
  }
};

export const markVerificationEmailSent = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { verificationEmailSentAt: new Date() });
};

export const markPasswordResetEmailSent = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { passwordResetEmailSentAt: new Date() });
};

const throwIfEmailCooldown = (lastSentAt: Date | null | undefined) => {
  try {
    assertEmailCooldown(lastSentAt);
  } catch (error) {
    if (error instanceof EmailCooldownError) {
      throw new RegisterError(error.statusCode, error.message);
    }

    throw error;
  }
};

export const assertRegisterEmailCooldown = async (email: string) => {
  const normalized = email.toLowerCase();
  const record = await AuthEmailCooldown.findOne({ email: normalized, purpose: 'register' });
  throwIfEmailCooldown(record?.sentAt);

  const user = await User.findOne({ email: normalized }).select(
    'isEmailVerified verificationEmailSentAt'
  );

  if (user && !user.isEmailVerified) {
    throwIfEmailCooldown(user.verificationEmailSentAt);
  }
};

export const markRegisterEmailCooldown = async (email: string) => {
  await AuthEmailCooldown.findOneAndUpdate(
    { email: email.toLowerCase(), purpose: 'register' },
    { sentAt: new Date() },
    { upsert: true }
  );
};
