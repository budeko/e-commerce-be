export {
  signAuthToken,
  verifyAuthToken,
  type AuthTokenPayload,
  type UserRole,
} from '@/plugins/jwt/access-token';
export {
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '@/plugins/jwt/email-token';
export { isTokenRevoked, revokeToken } from '@/plugins/jwt/session/revoke-token';
export {
  isTokenIssuedBefore,
  revokeAllSessions,
  PASSWORD_CHANGED_MESSAGE,
  SESSIONS_REVOKED_MESSAGE,
} from '@/plugins/jwt/session/invalidate-all';
