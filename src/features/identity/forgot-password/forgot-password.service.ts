import { createLogger } from '@/internal/common/logging';
import {
  assertEmailCooldown,
  EmailCooldownError,
  markPasswordResetEmailSent,
} from '@/internal/auth/mail/cooldown';
import { signPasswordResetToken } from '@/internal/auth/tokens/email-token';
import { sendPasswordResetEmail } from '@/integrations/resend/send';
import { createAuthOtp, invalidateAuthOtp } from '@/internal/auth/otp/otp';
import { createUserId } from '@/internal/common/ids';
import { findUserByEmail, updateUserById } from '@/repositories/auth/user.repository';

const log = createLogger({ module: 'forgot-password' });

export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const userId = user._id.toString();

  try {
    assertEmailCooldown(user.passwordResetEmailSentAt);
  } catch (error) {
    if (error instanceof EmailCooldownError) {
      return;
    }

    throw error;
  }

  const jti = createUserId();
  const token = signPasswordResetToken(userId, jti);
  const code = await createAuthOtp(userId, 'password_reset');

  try {
    await updateUserById(userId, {
      $set: { activePasswordResetJti: jti },
    });
    await sendPasswordResetEmail(user.email, token, code);
    await markPasswordResetEmailSent(userId);
  } catch (error) {
    log.error({ err: error, userId, email: user.email }, 'Şifre sıfırlama e-postası gönderilemedi');
    await invalidateAuthOtp(userId, 'password_reset');
  }
};
