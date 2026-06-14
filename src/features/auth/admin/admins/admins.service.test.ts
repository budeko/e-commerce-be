import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '@/features/auth/admin/access/permission-keys';
import type { AdminAccessContext } from '@/features/auth/core/queries/admin-context';

const mockAdminFindById = vi.fn();
const mockUserFindById = vi.fn();
const mockCountDocuments = vi.fn();
const mockGetRoleSummariesByIds = vi.fn();
const mockAssertAssignableRoleId = vi.fn();
const mockCountOwnerAdmins = vi.fn();
const mockIsOwnerRoleId = vi.fn();

vi.mock('@/db', () => ({
  Admin: {
    findById: (...args: unknown[]) => mockAdminFindById(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
    find: vi.fn(),
  },
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
    find: vi.fn(),
  },
}));

vi.mock('@/features/auth/admin/roles/roles.service', () => ({
  getRoleSummariesByIds: (...args: unknown[]) => mockGetRoleSummariesByIds(...args),
  assertAssignableRoleId: (...args: unknown[]) => mockAssertAssignableRoleId(...args),
  countOwnerAdmins: (...args: unknown[]) => mockCountOwnerAdmins(...args),
  isOwnerRoleId: (...args: unknown[]) => mockIsOwnerRoleId(...args),
}));

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

import { getAdminByUserId, listAdmins, updateAdmin } from '@/features/auth/admin/admins/admins.service';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';
const limitedId = '550e8400-e29b-41d4-a716-446655440001';
const ownerRoleId = '660e8400-e29b-41d4-a716-446655440000';
const limitedRoleId = '660e8400-e29b-41d4-a716-446655440001';

const ownerCtx: AdminAccessContext = {
  userId: ownerId,
  roleId: ownerRoleId,
  roleSlug: 'owner',
  roleName: 'Owner',
  permissions: new Set(Object.values(PERMISSIONS)),
  isOwner: true,
};

const limitedCtx: AdminAccessContext = {
  userId: limitedId,
  roleId: limitedRoleId,
  roleSlug: 'limited',
  roleName: 'Limited',
  permissions: new Set([PERMISSIONS.ADMINS_READ]),
  isOwner: false,
};

const limitedAdmin = {
  _id: limitedId,
  roleId: limitedRoleId,
  createdBy: ownerId,
  save: vi.fn(),
};

const limitedUser = {
  _id: limitedId,
  email: 'limited@example.com',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
};

describe('getAdminByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue(limitedAdmin);
    mockUserFindById.mockReturnValue(chainFindById(limitedUser));
    mockGetRoleSummariesByIds.mockResolvedValue(
      new Map([
        [
          limitedRoleId,
          { roleId: limitedRoleId, name: 'Limited', slug: 'limited' },
        ],
      ])
    );
  });

  it('admins.read olmadan başka admin görülemez', async () => {
    const noReadCtx: AdminAccessContext = {
      ...limitedCtx,
      permissions: new Set(),
    };

    await expect(getAdminByUserId(noReadCtx, limitedId, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('updateAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue({
      ...limitedAdmin,
      save: vi.fn().mockResolvedValue(undefined),
    });
    mockUserFindById.mockReturnValue(chainFindById(limitedUser));
    mockAssertAssignableRoleId.mockResolvedValue({
      _id: limitedRoleId,
      slug: 'limited',
    });
    mockIsOwnerRoleId.mockResolvedValue(false);
    mockCountOwnerAdmins.mockResolvedValue(2);
    mockGetRoleSummariesByIds.mockResolvedValue(
      new Map([
        [
          limitedRoleId,
          { roleId: limitedRoleId, name: 'Limited', slug: 'limited' },
        ],
      ])
    );
  });

  it('owner olmayan admin rol güncelleyemez', async () => {
    await expect(
      updateAdmin(limitedCtx, limitedId, ownerId, { roleId: limitedRoleId })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('owner başka adminin rolünü güncelleyebilir', async () => {
    const result = await updateAdmin(ownerCtx, ownerId, limitedId, { roleId: limitedRoleId });

    expect(result.roleId).toBe(limitedRoleId);
  });

  it('admin kendi rolünü güncelleyemez', async () => {
    await expect(
      updateAdmin(ownerCtx, ownerId, ownerId, { roleId: limitedRoleId })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('listAdmins', () => {
  it('admins.read olmadan admin listesi alınamaz', async () => {
    const noReadCtx: AdminAccessContext = {
      ...limitedCtx,
      permissions: new Set(),
    };

    await expect(listAdmins(noReadCtx)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Admin listesini görüntüleme yetkin yok',
    });
  });
});
