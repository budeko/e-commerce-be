import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdminFindById = vi.fn();
const mockUserFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

vi.mock('../../../../../db', () => ({
  Admin: {
    findById: (...args: unknown[]) => mockAdminFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
}));

import { updateAdminProfile } from '@/features/auth/admin/profile/services/profile.service';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';
const helperId = '550e8400-e29b-41d4-a716-446655440001';

const helperAdmin = {
  _id: helperId,
  adminRole: 'helper',
  firstName: null,
  lastName: null,
  phone: null,
};

const helperUser = {
  email: 'helper@example.com',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
};

describe('updateAdminProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFindById.mockResolvedValue(helperAdmin);
    mockUserFindById.mockReturnValue(chainFindById(helperUser));
    mockFindByIdAndUpdate.mockResolvedValue({
      ...helperAdmin,
      firstName: 'Ali',
      lastName: 'Veli',
    });
  });

  it('helper kendi profilini güncelleyebilir', async () => {
    const result = await updateAdminProfile('helper', helperId, helperId, {
      firstName: 'Ali',
      lastName: 'Veli',
    });

    expect(result.profile.firstName).toBe('Ali');
    expect(mockFindByIdAndUpdate).toHaveBeenCalled();
  });

  it('owner başka admin profilini güncelleyebilir', async () => {
    await updateAdminProfile('owner', ownerId, helperId, { firstName: 'Ali' });

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      helperId,
      { $set: { firstName: 'Ali' } },
      { returnDocument: 'after' }
    );
  });

  it('helper başka admin profilini güncelleyemez', async () => {
    await expect(
      updateAdminProfile('helper', helperId, ownerId, { firstName: 'Ali' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
