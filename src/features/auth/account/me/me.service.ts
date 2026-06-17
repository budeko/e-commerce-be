import type { AuthTokenPayload } from '@/features/auth/core/security/access-token';
import { buildAuthUserFields } from '@/features/auth/core/responses/user.response';
import { User } from '@/db';
import { AuthError } from '@/features/auth/core/errors';

export const getMe = async (auth: AuthTokenPayload) => {
  const user = await User.findById(auth.userId).select(
    'email role isActive isEmailVerified'
  );

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
  }

  const statusFields = await buildAuthUserFields(user);

  return {
    email: user.email,
    ...statusFields,
  };
};
