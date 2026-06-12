import { getAdminRole } from '@/features/auth/shared/queries/admin-role';
import { Seller, type AdminRole, type SellerApprovalStatus } from '@/db';
import { AuthError } from '@/features/auth/shared/errors';

type AuthUserLike = {
  _id: unknown;
  role: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
};

export type BuyerAuthFields = {
  userId: unknown;
  role: string;
  isEmailVerified?: boolean;
  isActive: boolean;
};

export type SellerAuthFields = {
  userId: unknown;
  role: string;
  isEmailVerified?: boolean;
  approvalStatus: SellerApprovalStatus;
};

export type AdminAuthFields = {
  userId: unknown;
  role: string;
  isEmailVerified?: boolean;
  adminRole: AdminRole;
};

const getSellerApprovalStatus = async (userId: string): Promise<SellerApprovalStatus> => {
  const seller = await Seller.findOne({ userId }).select('approvalStatus').lean();
  return seller?.approvalStatus ?? 'draft';
};

export const buildAuthUserFields = async (
  user: AuthUserLike
): Promise<BuyerAuthFields | SellerAuthFields | AdminAuthFields> => {
  const base = {
    userId: user._id,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  if (user.role === 'seller') {
    return {
      ...base,
      approvalStatus: await getSellerApprovalStatus(String(user._id)),
    };
  }

  if (user.role === 'buyer') {
    return {
      ...base,
      isActive: user.isActive ?? false,
    };
  }

  const adminRole = await getAdminRole(String(user._id));

  if (!adminRole) {
    throw new AuthError(403, 'Admin profili bulunamadı');
  }

  return {
    ...base,
    adminRole,
  };
};
