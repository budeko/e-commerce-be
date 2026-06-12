import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserFindById = vi.fn();
const mockUserFindByIdAndDelete = vi.fn();
const mockAuthOtpDeleteMany = vi.fn();
const mockBuyerDeleteOne = vi.fn();
const mockSellerDeleteOne = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
    findByIdAndDelete: (...args: unknown[]) => mockUserFindByIdAndDelete(...args),
  },
  AuthOtp: {
    deleteMany: (...args: unknown[]) => mockAuthOtpDeleteMany(...args),
  },
  Buyer: {
    deleteOne: (...args: unknown[]) => mockBuyerDeleteOne(...args),
  },
  Seller: {
    deleteOne: (...args: unknown[]) => mockSellerDeleteOne(...args),
  },
}));

import { deleteUnverifiedUser, getVerificationExpiresAt } from '@/features/auth/credentials/register/helpers/unverified-user';

const userId = '507f1f77bcf86cd799439011';

describe('unverified-user helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthOtpDeleteMany.mockResolvedValue(undefined);
    mockBuyerDeleteOne.mockResolvedValue(undefined);
    mockSellerDeleteOne.mockResolvedValue(undefined);
    mockUserFindByIdAndDelete.mockResolvedValue(undefined);
  });

  it('getVerificationExpiresAt gelecekte bir tarih döner', () => {
    const expiresAt = getVerificationExpiresAt();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('doğrulanmış kullanıcıyı silmez', async () => {
    mockUserFindById.mockResolvedValue({ isEmailVerified: true });

    await deleteUnverifiedUser(userId);

    expect(mockUserFindByIdAndDelete).not.toHaveBeenCalled();
  });

  it('doğrulanmamış kullanıcıyı ve ilişkili kayıtları siler', async () => {
    mockUserFindById.mockResolvedValue({ isEmailVerified: false });

    await deleteUnverifiedUser(userId);

    expect(mockAuthOtpDeleteMany).toHaveBeenCalledWith({ userId });
    expect(mockBuyerDeleteOne).toHaveBeenCalledWith({ userId });
    expect(mockSellerDeleteOne).toHaveBeenCalledWith({ userId });
    expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith(userId);
  });

  it('kullanıcı yoksa işlem yapmaz', async () => {
    mockUserFindById.mockResolvedValue(null);

    await deleteUnverifiedUser(userId);

    expect(mockUserFindByIdAndDelete).not.toHaveBeenCalled();
  });
});
