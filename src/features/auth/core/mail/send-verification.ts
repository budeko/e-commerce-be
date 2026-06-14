import { signEmailVerificationToken } from '@/lib/security/email-token';
import { createAuthOtp } from '@/features/auth/core/otp/otp';
import { sendVerificationEmail } from '@/lib/integrations/resend/send';

export const sendUserVerificationEmail = async (userId: string, email: string) => {
  const token = signEmailVerificationToken(userId);
  const code = await createAuthOtp(userId, 'email_verify');
  await sendVerificationEmail(email, token, code);
};
