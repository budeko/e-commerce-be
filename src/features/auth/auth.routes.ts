import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import registerRoutes from './credentials/register/register.routes';
import loginRoutes from './credentials/login/login.routes';
import logoutRoutes from './credentials/logout/logout.routes';
import changePasswordRoutes from './credentials/change-password/change-password.routes';
import verifyEmailRoutes from './verification/verify-email/verify-email.routes';
import resendVerificationRoutes from './verification/resend-verification/resend-verification.routes';
import forgotPasswordRoutes from './recovery/forgot-password/forgot-password.routes';
import resetPasswordRoutes from './recovery/reset-password/reset-password.routes';
import meRoutes from './account/me/me.routes';
import profileRoutes from './account/profile/profile.routes';
import adminRoutes from './admin/admin.routes';

const PUBLIC_AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: '15 minutes',
};

const ADMIN_RATE_LIMIT = {
  max: 60,
  timeWindow: '1 minute',
};

export default async function (fastify: FastifyInstance) {
  await fastify.register(async (publicAuth) => {
    await publicAuth.register(rateLimit, PUBLIC_AUTH_RATE_LIMIT);

    await publicAuth.register(registerRoutes, { prefix: '/register' });
    await publicAuth.register(loginRoutes, { prefix: '/login' });
    await publicAuth.register(verifyEmailRoutes, { prefix: '/verify-email' });
    await publicAuth.register(forgotPasswordRoutes, { prefix: '/forgot-password' });
    await publicAuth.register(resetPasswordRoutes, { prefix: '/reset-password' });
    await publicAuth.register(resendVerificationRoutes, { prefix: '/resend-verification' });
  });

  await fastify.register(meRoutes, { prefix: '/me' });
  await fastify.register(profileRoutes, { prefix: '/profile' });
  await fastify.register(changePasswordRoutes, { prefix: '/change-password' });
  await fastify.register(logoutRoutes, { prefix: '/logout' });

  await fastify.register(async (adminScope) => {
    await adminScope.register(rateLimit, ADMIN_RATE_LIMIT);
    await adminScope.register(adminRoutes, { prefix: '/admin' });
  });
}
