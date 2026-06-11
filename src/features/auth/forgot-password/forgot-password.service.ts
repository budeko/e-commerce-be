import { createLogger } from '../../../lib/common/logger';
import {
  assertEmailCooldown,
  EmailCooldownError,
  markPasswordResetEmailSent,
} from '../../../lib/auth/email-cooldown';
import { signPasswordResetToken } from '../../../lib/auth/email-token';
import { sendPasswordResetEmail } from '../../../lib/auth/email/send-mail';
import { createAuthOtp, invalidateAuthOtp } from '../../../lib/auth/otp';
import { User } from '../../../db';
import { RegisterError } from '../register/register.errors';

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
      throw new RegisterError(error.statusCode, error.message);
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
    throw new RegisterError(
      503,
      'Şifre sıfırlama e-postası gönderilemedi, lütfen tekrar deneyin'
    );
  }
};
