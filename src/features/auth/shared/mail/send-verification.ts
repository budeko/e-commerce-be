import { signEmailVerificationToken } from '@/lib/auth/token/email-token';
import { createAuthOtp } from '@/features/auth/shared/otp/otp';
import { sendVerificationEmail } from '@/lib/auth/mail/send';

export const sendUserVerificationEmail = async (userId: string, email: string) => {
  const token = signEmailVerificationToken(userId);
  const code = await createAuthOtp(userId, 'email_verify');
  await sendVerificationEmail(email, token, code);
};
