import { requireAuth } from '@/middleware/auth/require-auth';
import { requireAdmin } from '@/middleware/auth/require-admin';

export const adminOnly = {
  preHandler: [requireAuth, requireAdmin],
};
