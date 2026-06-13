import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdminFindById = vi.fn();
const mockUserFindById = vi.fn();
const mockCountDocuments = vi.fn();

vi.mock('../../../../../db', () => ({
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

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

import { getAdminByUserId, listAdmins, updateAdmin } from '@/features/auth/admin/admins/services/admins.service';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';
const helperId = '550e8400-e29b-41d4-a716-446655440001';

const helperAdmin = {
  _id: helperId,
  adminRole: 'helper' as const,
  createdBy: ownerId,
  save: vi.fn(),
};

const helperUser = {
  _id: helperId,
  email: 'helper@example.com',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
};

describe('getAdminByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue(helperAdmin);
    mockUserFindById.mockReturnValue(chainFindById(helperUser));
  });

  it('helper başka admini göremez', async () => {
    await expect(getAdminByUserId('helper', helperId, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('updateAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue({
      ...helperAdmin,
      save: vi.fn().mockResolvedValue(undefined),
    });
    mockUserFindById.mockReturnValue(chainFindById(helperUser));
    mockCountDocuments.mockResolvedValue(2);
  });

  it('helper başka admini güncelleyemez', async () => {
    await expect(
      updateAdmin('helper', helperId, ownerId, { adminRole: 'helper' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('owner helper rolünü güncelleyebilir', async () => {
    const result = await updateAdmin('owner', ownerId, helperId, { adminRole: 'helper' });

    expect(result.adminRole).toBe('helper');
  });

  it('admin kendi rolünü güncelleyemez', async () => {
    await expect(
      updateAdmin('owner', ownerId, ownerId, { adminRole: 'helper' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('listAdmins', () => {
  it('helper admin listesini alamaz', async () => {
    await expect(listAdmins('helper')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Admin listesini görüntüleme yetkin yok',
    });
  });
});
