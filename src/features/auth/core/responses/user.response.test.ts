import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSellerFindById = vi.fn();
const mockGetAdminRole = vi.fn();

vi.mock('@/db', () => ({
  Seller: {
    findById: (...args: unknown[]) => mockSellerFindById(...args),
  },
}));

vi.mock('../queries/admin-role', () => ({
  getAdminRole: (...args: unknown[]) => mockGetAdminRole(...args),
}));

import { buildAuthUserFields } from '@/features/auth/core/responses/user.response';

const userId = '550e8400-e29b-41d4-a716-446655440000';

describe('buildAuthUserFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buyer için isActive döner', async () => {
    const result = await buildAuthUserFields({
      _id: userId,
      role: 'buyer',
      isActive: true,
      isEmailVerified: true,
    });

    expect(result).toEqual({
      userId,
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });
  });

  it('seller için approvalStatus döner', async () => {
    mockSellerFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ approvalStatus: 'approved' }),
      }),
    });

    const result = await buildAuthUserFields({
      _id: userId,
      role: 'seller',
      isEmailVerified: true,
    });

    expect(result).toEqual({
      userId,
      role: 'seller',
      isEmailVerified: true,
      approvalStatus: 'approved',
    });
  });

  it('seller kaydı yoksa draft döner', async () => {
    mockSellerFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });

    const result = await buildAuthUserFields({
      _id: userId,
      role: 'seller',
      isEmailVerified: false,
    });

    expect(result).toMatchObject({ approvalStatus: 'draft' });
  });

  it('admin için adminRole döner', async () => {
    mockGetAdminRole.mockResolvedValue('owner');

    const result = await buildAuthUserFields({
      _id: userId,
      role: 'admin',
      isEmailVerified: true,
    });

    expect(result).toEqual({
      userId,
      role: 'admin',
      isEmailVerified: true,
      adminRole: 'owner',
    });
  });

  it('admin profili yoksa 403 döner', async () => {
    mockGetAdminRole.mockResolvedValue(null);

    await expect(
      buildAuthUserFields({
        _id: userId,
        role: 'admin',
        isEmailVerified: true,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Admin profili bulunamadı',
    });
  });
});
