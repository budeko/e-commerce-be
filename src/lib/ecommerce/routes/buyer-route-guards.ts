import { requireAuth } from '@/features/auth/shared/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/shared/guard/require-email-verified';
import { requireActiveBuyer } from '@/lib/ecommerce/guard/require-active-buyer';
import { validateParams } from '@/lib/common/http/validate-params';
import type { ZodTypeAny } from 'zod';

export const buyerOnly = {
  preHandler: [requireAuth, requireEmailVerified, requireActiveBuyer],
};

export const buyerWithParams = (paramSchema: ZodTypeAny) => ({
  preHandler: [requireAuth, requireEmailVerified, requireActiveBuyer, validateParams(paramSchema)],
});
