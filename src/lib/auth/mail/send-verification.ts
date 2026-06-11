import { signEmailVerificationToken } from '../token/email-token';
import { createAuthOtp } from '../otp/otp';
import { sendVerificationEmail } from './send';

export const sendUserVerificationEmail = async (userId: string, email: string) => {
  const token = signEmailVerificationToken(userId);
  const code = await createAuthOtp(userId, 'email_verify');
  await sendVerificationEmail(email, token, code);
};
