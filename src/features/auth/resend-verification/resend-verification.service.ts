import { createLogger } from '../../../lib/common/logger';
import {
  assertEmailCooldown,
  EmailCooldownError,
  markVerificationEmailSent,
} from '../../../lib/auth/email-cooldown';
import { sendUserVerificationEmail } from '../../../lib/auth/email/send-verification';
import { invalidateAuthOtp } from '../../../lib/auth/otp';
import { User } from '../../../db';
import { RegisterError } from '../register/register.errors';

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
      throw new RegisterError(error.statusCode, error.message);
    }

    throw error;
  }

  try {
    await sendUserVerificationEmail(userId, user.email);
    await markVerificationEmailSent(userId);
  } catch (error) {
    log.error({ err: error, userId, email }, 'Doğrulama e-postası gönderilemedi');
    await invalidateAuthOtp(userId, 'email_verify');
    throw new RegisterError(
      503,
      'Doğrulama e-postası gönderilemedi, lütfen tekrar deneyin'
    );
  }
};
