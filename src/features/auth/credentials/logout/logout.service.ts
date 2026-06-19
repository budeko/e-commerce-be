import { revokeToken } from '@/plugins/jwt/session/revoke-token';
import { revokeAllSessions } from '@/plugins/jwt/session/invalidate-all';

export const logout = async (token: string) => {
  await revokeToken(token);
};

export const logoutAllSessions = async (userId: string) => {
  await revokeAllSessions(userId);
};
