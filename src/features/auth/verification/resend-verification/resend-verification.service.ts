import { createLogger } from '@/internal/logging';
import {
  assertEmailCooldown,
  EmailCooldownError,
  markVerificationEmailSent,
} from '@/features/auth/core/mail/cooldown';
import { sendUserVerificationEmail } from '@/features/auth/core/mail/send-verification';
import { invalidateAuthOtp } from '@/features/auth/core/otp/otp';
import { User } from '@/db';
import { AuthError } from '@/features/auth/core/errors';

const log = createLogger({ module: 'resend-verification' });

export const resendVerificationEmail = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || user.isEmailVerified) {
    return;
  }

  const userId = user._id.toString();

  try {
    assertEmailCooldown(user.verificationEmailSentAt);
  } catch (error) {
    if (error instanceof EmailCooldownError) {
      throw new AuthError(error.statusCode, error.message);
    }

    throw error;
  }

  try {
    await sendUserVerificationEmail(userId, user.email);
    await markVerificationEmailSent(userId);
  } catch (error) {
    log.error({ err: error, userId, email }, 'Doğrulama e-postası gönderilemedi');
    await invalidateAuthOtp(userId, 'email_verify');
    throw new AuthError(
      503,
      'Doğrulama e-postası gönderilemedi, lütfen tekrar deneyin'
    );
  }
};
