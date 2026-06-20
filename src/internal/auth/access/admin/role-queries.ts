import { Admin, AdminRole, SYSTEM_OWNER_ROLE_SLUG } from '@/integrations/mongo';
import { AuthError } from '@/internal/auth/errors';

export const assertAssignableRoleId = async (roleId: string) => {
  const role = await AdminRole.findById(roleId).lean();

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  if (role.isSystem && role.slug === SYSTEM_OWNER_ROLE_SLUG) {
    throw new AuthError(403, 'Owner rolü atanamaz');
  }

  return role;
};

export const countOwnerAdmins = async () => {
  const ownerRole = await AdminRole.findOne({ slug: SYSTEM_OWNER_ROLE_SLUG }).select('_id').lean();

  if (!ownerRole) {
    return 0;
  }

  return Admin.countDocuments({ roleId: String(ownerRole._id) });
};

export const isOwnerRoleId = async (roleId: string) => {
  const role = await AdminRole.findById(roleId).select('slug isSystem').lean();
  return role?.slug === SYSTEM_OWNER_ROLE_SLUG;
};

export type RoleSummary = {
  roleId: string;
  name: string;
  slug: string;
};

export const getRoleSummariesByIds = async (roleIds: string[]): Promise<Map<string, RoleSummary>> => {
  const uniqueIds = [...new Set(roleIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const roles = await AdminRole.find({ _id: { $in: uniqueIds } })
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
