import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserFindById = vi.fn();
const mockUserFindByIdAndDelete = vi.fn();
const mockDeleteAuthOtpsForUser = vi.fn();
const mockBuyerFindByIdAndDelete = vi.fn();
const mockSellerFindByIdAndDelete = vi.fn();
const mockSellerMemberFindByIdAndDelete = vi.fn();
const mockSellerRoleDeleteMany = vi.fn();

vi.mock('@/db', () => ({
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
    findByIdAndDelete: (...args: unknown[]) => mockUserFindByIdAndDelete(...args),
  },
  Buyer: {
    findByIdAndDelete: (...args: unknown[]) => mockBuyerFindByIdAndDelete(...args),
  },
  SellerMember: {
    findByIdAndDelete: (...args: unknown[]) => mockSellerMemberFindByIdAndDelete(...args),
  },
  SellerRole: {
    deleteMany: (...args: unknown[]) => mockSellerRoleDeleteMany(...args),
  },
  Seller: {
    findByIdAndDelete: (...args: unknown[]) => mockSellerFindByIdAndDelete(...args),
  },
}));

vi.mock('@/features/auth/core/otp/otp', async () => {
  const actual = await vi.importActual<typeof import('@/features/auth/core/otp/otp')>(
    '@/features/auth/core/otp/otp'
  );
  return {
    ...actual,
    deleteAuthOtpsForUser: (...args: unknown[]) => mockDeleteAuthOtpsForUser(...args),
  };
});

import { deleteUnverifiedUser, getVerificationExpiresAt } from '@/features/auth/core/register/unverified-user';

const userId = '550e8400-e29b-41d4-a716-446655440000';

describe('unverified-user helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteAuthOtpsForUser.mockResolvedValue(undefined);
    mockBuyerFindByIdAndDelete.mockResolvedValue(undefined);
    mockSellerFindByIdAndDelete.mockResolvedValue(undefined);
    mockSellerMemberFindByIdAndDelete.mockResolvedValue(undefined);
    mockSellerRoleDeleteMany.mockResolvedValue(undefined);
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

    expect(mockDeleteAuthOtpsForUser).toHaveBeenCalledWith(userId);
    expect(mockBuyerFindByIdAndDelete).toHaveBeenCalledWith(userId);
    expect(mockSellerMemberFindByIdAndDelete).toHaveBeenCalledWith(userId);
    expect(mockSellerRoleDeleteMany).toHaveBeenCalledWith({ sellerId: userId });
    expect(mockSellerFindByIdAndDelete).toHaveBeenCalledWith(userId);
    expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith(userId);
  });

  it('kullanıcı yoksa işlem yapmaz', async () => {
    mockUserFindById.mockResolvedValue(null);

    await deleteUnverifiedUser(userId);

    expect(mockUserFindByIdAndDelete).not.toHaveBeenCalled();
  });
});
