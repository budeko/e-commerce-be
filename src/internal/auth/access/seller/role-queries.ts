import { SellerMember, SellerRole, SELLER_SYSTEM_OWNER_ROLE_SLUG } from '@/integrations/mongo';
import { AuthError } from '@/internal/auth/errors';

export const assertAssignableSellerRoleId = async (companyId: string, roleId: string) => {
  const role = await SellerRole.findOne({ _id: roleId, sellerId: companyId }).lean();

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  if (role.isSystem && role.slug === SELLER_SYSTEM_OWNER_ROLE_SLUG) {
    throw new AuthError(403, 'Owner rolü atanamaz');
  }

  return role;
};

export const countOwnerSellerMembers = async (companyId: string) =>
  SellerMember.countDocuments({ sellerId: companyId, isOwner: true });

export const isOwnerSellerRoleId = async (companyId: string, roleId: string) => {
  const role = await SellerRole.findOne({ _id: roleId, sellerId: companyId })
    .select('slug isSystem')
    .lean();

  return role?.slug === SELLER_SYSTEM_OWNER_ROLE_SLUG;
};

export type SellerRoleSummary = {
  roleId: string;
  name: string;
  slug: string;
};

export const getSellerRoleSummariesByIds = async (
  companyId: string,
  roleIds: string[]
): Promise<Map<string, SellerRoleSummary>> => {
  const uniqueIds = [...new Set(roleIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const roles = await SellerRole.find({
    _id: { $in: uniqueIds },
    sellerId: companyId,
  })
    .select('name slug')
    .lean();

  return new Map(
    roles.map((role) => [
      String(role._id),
      {
        roleId: String(role._id),
        name: role.name,
        slug: role.slug,
      },
    ])
  );
};
