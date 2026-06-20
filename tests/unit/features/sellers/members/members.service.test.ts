import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SELLER_PERMISSIONS } from '@/internal/auth/access/seller/permission-keys';
import type { SellerAccessContext } from '@/internal/auth/queries/seller-context';
import { AuthError } from '@/internal/auth/errors';

const mockSellerMemberFind = vi.fn();
const mockSellerMemberFindOne = vi.fn();
const mockUserFind = vi.fn();
const mockUserFindById = vi.fn();
const mockGetSellerRoleSummariesByIds = vi.fn();

vi.mock('@/integrations/mongo', () => ({
  SellerMember: {
    find: (...args: unknown[]) => mockSellerMemberFind(...args),
    findOne: (...args: unknown[]) => mockSellerMemberFindOne(...args),
  },
  User: {
    find: (...args: unknown[]) => mockUserFind(...args),
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
}));

vi.mock('@/features/sellers/roles/roles.service', () => ({
  getSellerRoleSummariesByIds: (...args: unknown[]) => mockGetSellerRoleSummariesByIds(...args),
}));

import { getSellerMemberByUserId, listSellerMembers } from '@/features/sellers/members/members.service';

const companyId = '660e8400-e29b-41d4-a716-446655440000';
const memberId = '550e8400-e29b-41d4-a716-446655440000';
const roleId = '770e8400-e29b-41d4-a716-446655440000';

const ownerCtx: SellerAccessContext = {
  userId: memberId,
  companyId,
  companyName: 'Test A.Ş.',
  sellerType: 'kurumsal',
  approvalStatus: 'approved',
  roleId,
  roleSlug: 'owner',
  roleName: 'Owner',
  permissions: new Set(Object.values(SELLER_PERMISSIONS)),
  isOwner: true,
  teamManagementEnabled: true,
  member: { firstName: null, lastName: null, phone: null },
};

const limitedCtx: SellerAccessContext = {
  ...ownerCtx,
  permissions: new Set([SELLER_PERMISSIONS.PRODUCTS_READ]),
  isOwner: false,
};

describe('listSellerMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('yetkisiz satıcı için AuthError fırlatır', async () => {
    await expect(listSellerMembers(limitedCtx)).rejects.toThrow(AuthError);
    await expect(listSellerMembers(limitedCtx)).rejects.toThrow(/Ekip listesini görüntüleme yetkin yok/);
  });

  it('yetkili satıcı ekip üyelerini listeler', async () => {
    mockSellerMemberFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: memberId,
            sellerId: companyId,
            roleId,
            isOwner: true,
            firstName: 'Ali',
            lastName: 'Veli',
            phone: null,
            createdAt: new Date('2024-01-01'),
          },
        ]),
      }),
    });
    mockUserFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: memberId,
            email: 'ali@test.com',
            isEmailVerified: true,
            createdAt: new Date('2024-01-01'),
          },
        ]),
      }),
    });
    mockGetSellerRoleSummariesByIds.mockResolvedValue(
      new Map([[roleId, { roleId, name: 'Owner', slug: 'owner' }]])
    );

    const members = await listSellerMembers(ownerCtx);

    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      userId: memberId,
      email: 'ali@test.com',
      companyId,
      isOwner: true,
      profile: { firstName: 'Ali', lastName: 'Veli', phone: null },
    });
    expect(mockSellerMemberFind).toHaveBeenCalledWith({ sellerId: companyId });
  });
});

describe('getSellerMemberByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('yetkisiz satıcı için AuthError fırlatır', async () => {
    await expect(getSellerMemberByUserId(limitedCtx, '660e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
      AuthError
    );
  });

  it('yetkili satıcı çalışan detayını döner', async () => {
    mockSellerMemberFindOne.mockResolvedValue({
      _id: memberId,
      sellerId: companyId,
      roleId,
      isOwner: true,
      firstName: 'Ali',
      lastName: 'Veli',
      phone: null,
    });
    mockUserFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: memberId,
        email: 'ali@test.com',
        role: 'seller',
        isEmailVerified: true,
      }),
    });
    mockGetSellerRoleSummariesByIds.mockResolvedValue(
      new Map([[roleId, { roleId, name: 'Owner', slug: 'owner' }]])
    );

    const member = await getSellerMemberByUserId(ownerCtx, memberId);

    expect(member).toMatchObject({
      userId: memberId,
      email: 'ali@test.com',
      isOwner: true,
    });
  });
});
