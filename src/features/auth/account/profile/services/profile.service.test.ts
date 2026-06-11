import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserFindById = vi.fn();
const mockBuyerFindOne = vi.fn();
const mockSellerFindOne = vi.fn();
const mockUpdateBuyerProfile = vi.fn();
const mockUpdateSellerProfile = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
  Buyer: {
    findOne: (...args: unknown[]) => mockBuyerFindOne(...args),
  },
  Seller: {
    findOne: (...args: unknown[]) => mockSellerFindOne(...args),
  },
}));

vi.mock('./buyer.service', () => ({
  updateBuyerProfile: (...args: unknown[]) => mockUpdateBuyerProfile(...args),
}));

vi.mock('./seller.service', () => ({
  updateSellerProfile: (...args: unknown[]) => mockUpdateSellerProfile(...args),
}));

import { getProfile, updateProfile } from './profile.service';

const userId = '507f1f77bcf86cd799439011';

const chainSelect = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

const chainLean = (value: unknown) => ({
  lean: vi.fn().mockResolvedValue(value),
});

describe('getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin 403 alır', async () => {
    mockUserFindById.mockReturnValue(
      chainSelect({
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      })
    );

    await expect(getProfile({ userId, role: 'admin' })).rejects.toMatchObject({
      statusCode: 403,
      message: 'Bu endpoint buyer ve seller içindir',
    });
  });

  it('buyer profilini döner', async () => {
    mockUserFindById.mockReturnValue(
      chainSelect({
        email: 'buyer@example.com',
        role: 'buyer',
        isActive: false,
        isEmailVerified: true,
      })
    );
    mockBuyerFindOne.mockReturnValue(chainLean({ userId, firstName: 'Ali' }));

    const result = await getProfile({ userId, role: 'buyer' });

    expect(result).toMatchObject({
      email: 'buyer@example.com',
      role: 'buyer',
      isActive: false,
      profile: { firstName: 'Ali' },
    });
  });

  it('seller profilinde approvalStatus döner', async () => {
    mockUserFindById.mockReturnValue(
      chainSelect({
        email: 'seller@example.com',
        role: 'seller',
        isEmailVerified: true,
      })
    );
    mockSellerFindOne.mockReturnValue(
      chainLean({
        userId,
        approvalStatus: 'pending',
        rejectionReason: null,
      })
    );

    const result = await getProfile({ userId, role: 'seller' });

    expect(result.approvalStatus).toBe('pending');
  });
});

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buyer güncellemesini buyer service\'e yönlendirir', async () => {
    mockUpdateBuyerProfile.mockResolvedValue({ profile: {}, isActive: true });

    await updateProfile({ userId, role: 'buyer' }, { firstName: 'Ali' });

    expect(mockUpdateBuyerProfile).toHaveBeenCalledWith(userId, { firstName: 'Ali' });
  });

  it('admin güncellemesinde 403 döner', async () => {
    await expect(
      updateProfile({ userId, role: 'admin' }, { firstName: 'Ali' })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Bu endpoint buyer ve seller içindir',
    });
  });
});
