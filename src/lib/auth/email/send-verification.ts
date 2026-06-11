import { signEmailVerificationToken } from '../email-token';
import { createAuthOtp } from '../otp';
import { sendVerificationEmail } from './send-mail';

export const sendUserVerificationEmail = async (userId: string, email: string) => {
  const token = signEmailVerificationToken(userId);
  const code = await createAuthOtp(userId, 'email_verify');
  await sendVerificationEmail(email, token, code);
};
