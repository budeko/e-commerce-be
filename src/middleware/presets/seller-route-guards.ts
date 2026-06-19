import { requireAuth } from '@/middleware/auth/require-auth';
import { requireEmailVerified } from '@/middleware/auth/require-email-verified';
import {
  requireKurumsalSeller,
  requireSellerContext,
} from '@/middleware/ecommerce/require-approved-seller';

export const sellerTeamBase = {
  preHandler: [requireAuth, requireEmailVerified, requireSellerContext, requireKurumsalSeller],
};
