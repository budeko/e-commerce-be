import { Seller } from '@/db';
import type { SellerApprovalStatus } from '@/db';
import type { SellerPermissionKey } from '@/features/auth/seller/access/permission-keys';
import { SELLER_SYSTEM_OWNER_ROLE_SLUG } from '@/db/auth/models/seller-role.model';
import { SellerMember } from '@/db/auth/models/seller-member.model';
import { SellerRole } from '@/db/auth/models/seller-role.model';
import { ensureSellerMember } from '@/features/auth/seller/access/system-roles';

export type SellerAccessContext = {
  userId: string;
  companyId: string;
  companyName: string | null;
  sellerType: 'bireysel' | 'kurumsal' | null;
  approvalStatus: SellerApprovalStatus;
  roleId: string;
  roleSlug: string;
  roleName: string;
  permissions: ReadonlySet<SellerPermissionKey>;
  isOwner: boolean;
  member: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
};

export const getSellerContext = async (userId: string): Promise<SellerAccessContext | null> => {
  const member = await ensureSellerMember(userId);

  if (!member) {
    return null;
  }

  const [seller, role] = await Promise.all([
    Seller.findById(member.sellerId).lean(),
    SellerRole.findById(member.roleId).lean(),
  ]);

  if (!seller || !role) {
    return null;
  }

  if (String(role.sellerId) !== String(member.sellerId)) {
    return null;
  }

  const isOwner = member.isOwner || role.slug === SELLER_SYSTEM_OWNER_ROLE_SLUG;

  return {
    userId,
    companyId: String(member.sellerId),
    companyName: seller.companyName ?? null,
    sellerType: (seller.sellerType as SellerAccessContext['sellerType']) ?? null,
    approvalStatus: seller.approvalStatus,
    roleId: String(role._id),
    roleSlug: role.slug,
    roleName: role.name,
    permissions: new Set(role.permissions as SellerPermissionKey[]),
    isOwner,
    member: {
      firstName: member.firstName ?? null,
      lastName: member.lastName ?? null,
      phone: member.phone ?? null,
    },
  };
};
