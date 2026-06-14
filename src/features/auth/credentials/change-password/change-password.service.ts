import type { AuthTokenPayload } from '@/lib/security/access-token';
import { hashPassword, comparePassword } from '@/lib/common/password';
import { User } from '@/db';
import { AuthError } from '@/features/auth/core/errors';
import type { ChangePasswordInput } from '@/features/auth/credentials/change-password/change-password.schema';

export const changePassword = async (
  auth: AuthTokenPayload,
  data: ChangePasswordInput
) => {
  const user = await User.findById(auth.userId);

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
  }

  const currentValid = await comparePassword(data.currentPassword, user.password);

  if (!currentValid) {
    throw new AuthError(401, 'Mevcut şifre hatalı');
  }

  const hashedPassword = await hashPassword(data.newPassword);
  await User.findByIdAndUpdate(auth.userId, {
    password: hashedPassword,
    passwordChangedAt: new Date(),
  });
};
