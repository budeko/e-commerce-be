import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/core/guard/require-email-verified';
import { requireActiveBuyer } from '@/features/ecommerce/core/guard/require-active-buyer';
import { validateParams } from '@/plugins/http/validate-params';
import type { ZodTypeAny } from 'zod';

export const buyerOnly = {
  preHandler: [requireAuth, requireEmailVerified, requireActiveBuyer],
};

export const buyerWithParams = (paramSchema: ZodTypeAny) => ({
  preHandler: [requireAuth, requireEmailVerified, requireActiveBuyer, validateParams(paramSchema)],
});
