import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '@/internal/auth/access/admin/permission-keys';
import type { AdminAccessContext } from '@/internal/auth/queries/admin-context';

const mockAdminFindById = vi.fn();
const mockUserFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockGetRoleSummariesByIds = vi.fn();

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

vi.mock('@/integrations/mongo', () => ({
  Admin: {
    findById: (...args: unknown[]) => mockAdminFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
}));

vi.mock('@/features/admin/roles/roles.service', () => ({
  getRoleSummariesByIds: (...args: unknown[]) => mockGetRoleSummariesByIds(...args),
}));

import { updateAdminProfile } from '@/features/admin/profile/profile.service';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';
const limitedId = '550e8400-e29b-41d4-a716-446655440001';
const limitedRoleId = '660e8400-e29b-41d4-a716-446655440001';

const ownerCtx: AdminAccessContext = {
  userId: ownerId,
  roleId: '660e8400-e29b-41d4-a716-446655440000',
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
  permissions: new Set([PERMISSIONS.SELLERS_READ]),
  isOwner: false,
};

const limitedAdmin = {
  _id: limitedId,
  roleId: limitedRoleId,
  firstName: null,
  lastName: null,
  phone: null,
};

const limitedUser = {
  email: 'limited@example.com',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
};

describe('updateAdminProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue(limitedAdmin);
    mockUserFindById.mockReturnValue(chainFindById(limitedUser));
    mockFindByIdAndUpdate.mockResolvedValue({
      ...limitedAdmin,
      firstName: 'Ali',
      lastName: 'Veli',
    });
    mockGetRoleSummariesByIds.mockResolvedValue(
      new Map([
        [
          limitedRoleId,
          { roleId: limitedRoleId, name: 'Limited', slug: 'limited' },
        ],
      ])
    );
  });

  it('admin kendi profilini güncelleyebilir', async () => {
    const result = await updateAdminProfile(limitedCtx, limitedId, limitedId, {
      firstName: 'Ali',
      lastName: 'Veli',
    });

    expect(result.profile.firstName).toBe('Ali');
    expect(mockFindByIdAndUpdate).toHaveBeenCalled();
  });

  it('owner başka admin profilini güncelleyebilir', async () => {
    await updateAdminProfile(ownerCtx, ownerId, limitedId, { firstName: 'Ali' });

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      limitedId,
      { $set: { firstName: 'Ali' } },
      { returnDocument: 'after' }
    );
  });

  it('admins.write olmadan başka admin profili güncellenemez', async () => {
    await expect(
      updateAdminProfile(limitedCtx, limitedId, ownerId, { firstName: 'Ali' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
