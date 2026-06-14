import { revokeToken } from '@/features/auth/core/session/revoke-token';
import { revokeAllSessions } from '@/features/auth/core/session/invalidate-all';

export const logout = async (token: string) => {
  await revokeToken(token);
};

export const logoutAllSessions = async (userId: string) => {
  await revokeAllSessions(userId);
};
