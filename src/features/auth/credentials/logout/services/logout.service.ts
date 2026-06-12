import { revokeToken } from '../../../shared/session/revoke-token';
import { revokeAllSessions } from '../../../shared/session/invalidate-all';

export const logout = async (token: string) => {
  await revokeToken(token);
};

export const logoutAllSessions = async (userId: string) => {
  await revokeAllSessions(userId);
};
