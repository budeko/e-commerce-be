import { createUserId } from '@/internal/common/ids';
import {
  signEmailVerificationToken,
} from '@/internal/auth/tokens/email-token';
import { createAuthOtp } from '@/internal/auth/otp/otp';
import { sendVerificationEmail } from '@/integrations/resend/send';
import { updateUserById } from '@/repositories/auth/user.repository';

export const sendUserVerificationEmail = async (userId: string, email: string) => {
  const jti = createUserId();
  const token = signEmailVerificationToken(userId, jti);
  const code = await createAuthOtp(userId, 'email_verify');

  await updateUserById(userId, {
    $set: { activeEmailVerifyJti: jti },
  });

  await sendVerificationEmail(email, token, code);

  return jti;
};
