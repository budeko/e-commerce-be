import { createLogger } from '@/lib/common/logger';
import {
  assertEmailCooldown,
  EmailCooldownError,
  markPasswordResetEmailSent,
} from '@/features/auth/shared/mail/cooldown';
import { signPasswordResetToken } from '@/lib/auth/token/email-token';
import { sendPasswordResetEmail } from '@/lib/auth/mail/send';
import { createAuthOtp, invalidateAuthOtp } from '@/features/auth/shared/otp/otp';
import { User } from '@/db';
import { AuthError } from '@/features/auth/shared/errors';

const log = createLogger({ module: 'forgot-password' });

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return;
  }

  const userId = user._id.toString();

  try {
    assertEmailCooldown(user.passwordResetEmailSentAt);
  } catch (error) {
    if (error instanceof EmailCooldownError) {
      throw new AuthError(error.statusCode, error.message);
    }

    throw error;
  }

  const token = signPasswordResetToken(userId);
  const code = await createAuthOtp(userId, 'password_reset');

  try {
    await sendPasswordResetEmail(user.email, token, code);
    await markPasswordResetEmailSent(userId);
  } catch (error) {
    log.error({ err: error, userId, email: user.email }, 'Şifre sıfırlama e-postası gönderilemedi');
    await invalidateAuthOtp(userId, 'password_reset');
    throw new AuthError(
      503,
      'Şifre sıfırlama e-postası gönderilemedi, lütfen tekrar deneyin'
    );
  }
};
