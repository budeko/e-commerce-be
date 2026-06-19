import { describe, expect, it } from 'vitest';
import { buyerOnly } from '@/middleware/presets/buyer-route-guards';
import { requireAuth } from '@/middleware/auth/require-auth';
import { requireEmailVerified } from '@/middleware/auth/require-email-verified';
import { requireActiveBuyer } from '@/middleware/ecommerce/require-active-buyer';

describe('buyerOnly', () => {
  it('buyer guard zincirini korur', () => {
    expect(buyerOnly.preHandler).toEqual([
      requireAuth,
      requireEmailVerified,
      requireActiveBuyer,
    ]);
  });
});
