import { revokeToken } from '../../../lib/auth/revoked-token';
import { revokeAllSessions } from '../../../lib/auth/session-invalidation';

export const logout = async (token: string) => {
  await revokeToken(token);
};

export const logoutAllSessions = async (userId: string) => {
  await revokeAllSessions(userId);
};
