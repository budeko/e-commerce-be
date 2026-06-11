import jwt from 'jsonwebtoken';
import { verifyPasswordResetToken } from '../../../lib/auth/email-token';
import { invalidateAuthOtp, OtpError, verifyAuthOtp } from '../../../lib/auth/otp';
import { hashPassword } from '../../../lib/common/password';
import { User } from '../../../db';
import { RegisterError } from '../register/register.errors';
import type { ResetPasswordInput } from './schemas/reset-password.schema';

const updateUserPassword = async (userId: string, newPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new RegisterError(404, 'Kullanıcı bulunamadı');
  }

  const hashedPassword = await hashPassword(newPassword);
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    passwordChangedAt: new Date(),
  });
  await invalidateAuthOtp(userId, 'password_reset');
};

const resetPasswordByToken = async (token: string, newPassword: string) => {
  let userId: string;

  try {
    userId = verifyPasswordResetToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new RegisterError(410, 'Sıfırlama bağlantısının süresi doldu');
    }

    throw new RegisterError(400, 'Geçersiz sıfırlama tokeni');
  }

  await updateUserPassword(userId, newPassword);
};

const resetPasswordByCode = async (email: string, code: string, newPassword: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new RegisterError(404, 'Kullanıcı bulunamadı');
  }

  try {
    await verifyAuthOtp(user._id.toString(), 'password_reset', code);
  } catch (error) {
    if (error instanceof OtpError) {
      throw new RegisterError(error.statusCode, error.message);
    }

    throw error;
  }

  await updateUserPassword(user._id.toString(), newPassword);
};

export const resetPassword = async (input: ResetPasswordInput) => {
  if ('token' in input) {
    await resetPasswordByToken(input.token, input.newPassword);
    return;
  }

  await resetPasswordByCode(input.email, input.code, input.newPassword);
};
