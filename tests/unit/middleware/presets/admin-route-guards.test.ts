import { describe, expect, it } from 'vitest';
import { adminOnly } from '@/middleware/presets/admin-route-guards';
import { requireAuth } from '@/middleware/auth/require-auth';
import { requireAdmin } from '@/middleware/auth/require-admin';

describe('adminOnly', () => {
  it('requireAuth ve requireAdmin sırasını korur', () => {
    expect(adminOnly.preHandler).toEqual([requireAuth, requireAdmin]);
  });
});
