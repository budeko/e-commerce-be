import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import registerRoutes from '@/features/auth/credentials/register/register.routes';
import loginRoutes from '@/features/auth/credentials/login/login.routes';
import logoutRoutes from '@/features/auth/credentials/logout/logout.routes';
import changePasswordRoutes from '@/features/auth/credentials/change-password/change-password.routes';
import verifyEmailRoutes from '@/features/auth/verification/verify-email/verify-email.routes';
import resendVerificationRoutes from '@/features/auth/verification/resend-verification/resend-verification.routes';
import forgotPasswordRoutes from '@/features/auth/recovery/forgot-password/forgot-password.routes';
import resetPasswordRoutes from '@/features/auth/recovery/reset-password/reset-password.routes';
import meRoutes from '@/features/auth/account/me/me.routes';
import profileRoutes from '@/features/auth/account/profile/profile.routes';
import adminRoutes from '@/features/auth/admin/admin.routes';
import sellerRoutes from '@/features/auth/seller/seller.routes';

const PUBLIC_AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: '15 minutes',
};

const ADMIN_RATE_LIMIT = {
  max: 60,
  timeWindow: '1 minute',
};

const SELLER_TEAM_RATE_LIMIT = {
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

  await fastify.register(async (sellerScope) => {
    await sellerScope.register(rateLimit, SELLER_TEAM_RATE_LIMIT);
    await sellerScope.register(sellerRoutes, { prefix: '/seller' });
  });
}
