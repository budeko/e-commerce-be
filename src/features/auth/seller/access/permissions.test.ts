import { describe, expect, it } from 'vitest';
import { SELLER_PERMISSIONS } from '@/features/auth/seller/access/permission-keys';
import type { SellerAccessContext } from '@/features/auth/core/queries/seller-context';
import {
  canWriteProducts,
  hasSellerPermission,
} from '@/features/auth/seller/access/permissions';

const ownerCtx: SellerAccessContext = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  companyId: '660e8400-e29b-41d4-a716-446655440000',
  companyName: 'Test',
  sellerType: 'bireysel',
  approvalStatus: 'approved',
  roleId: '770e8400-e29b-41d4-a716-446655440000',
  roleSlug: 'owner',
  roleName: 'Owner',
  permissions: new Set(Object.values(SELLER_PERMISSIONS)),
  isOwner: true,
  member: { firstName: null, lastName: null, phone: null },
};

describe('hasSellerPermission', () => {
  it('owner tüm yetkilere sahiptir', () => {
    expect(hasSellerPermission(ownerCtx, SELLER_PERMISSIONS.MEMBERS_DELETE)).toBe(true);
  });

  it('custom rol sadece atanmış yetkilere sahiptir', () => {
    const limitedCtx: SellerAccessContext = {
      ...ownerCtx,
      isOwner: false,
      permissions: new Set([SELLER_PERMISSIONS.PRODUCTS_READ]),
    };

    expect(canWriteProducts(limitedCtx)).toBe(false);
    expect(hasSellerPermission(limitedCtx, SELLER_PERMISSIONS.PRODUCTS_READ)).toBe(true);
  });

  it('bireysel satıcı owner ekip yetkilerine sahip olabilir', () => {
    expect(hasSellerPermission(ownerCtx, SELLER_PERMISSIONS.MEMBERS_WRITE)).toBe(true);
    expect(ownerCtx.sellerType).toBe('bireysel');
  });
});
