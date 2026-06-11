import type { AuthTokenPayload } from '../../../../../lib/auth/token/access-token';
import { buildAuthUserFields } from '../../../shared/responses/user.response';
import { User } from '../../../../../db';
import { AuthError } from '../../../shared/errors';

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
