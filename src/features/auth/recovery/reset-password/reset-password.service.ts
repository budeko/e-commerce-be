import jwt from 'jsonwebtoken';
import { verifyPasswordResetToken } from '@/features/auth/core/security/email-token';
import { invalidateAuthOtp, OtpError, verifyAuthOtp } from '@/features/auth/core/otp/otp';
import { hashPassword } from '@/lib/common/password';
import { User } from '@/db';
import { AuthError } from '@/features/auth/core/errors';
import type { ResetPasswordInput } from '@/features/auth/recovery/reset-password/reset-password.schema';

const updateUserPassword = async (userId: string, newPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
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
      throw new AuthError(410, 'Sıfırlama bağlantısının süresi doldu');
    }

    throw new AuthError(400, 'Geçersiz sıfırlama tokeni');
  }

  await updateUserPassword(userId, newPassword);
};

const resetPasswordByCode = async (email: string, code: string, newPassword: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
  }

  try {
    await verifyAuthOtp(user._id.toString(), 'password_reset', code);
  } catch (error) {
    if (error instanceof OtpError) {
      throw new AuthError(error.statusCode, error.message);
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
