import { Admin, AdminRole } from '@/integrations/mongo';
import type { PermissionKey } from '@/internal/auth/access/admin/permission-keys';
import { SYSTEM_OWNER_ROLE_SLUG } from '@/integrations/mongo/models/auth/admin-role.model';

export type AdminAccessContext = {
  userId: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  permissions: ReadonlySet<PermissionKey>;
  isOwner: boolean;
};

export const getAdminContext = async (userId: string): Promise<AdminAccessContext | null> => {
  const admin = await Admin.findById(userId).select('roleId').lean();

  if (!admin?.roleId) {
    return null;
  }

  const role = await AdminRole.findById(admin.roleId).lean();

  if (!role) {
    return null;
  }

  const isOwner = role.slug === SYSTEM_OWNER_ROLE_SLUG;

  return {
    userId,
    roleId: String(role._id),
    roleSlug: role.slug,
    roleName: role.name,
    permissions: new Set(role.permissions as PermissionKey[]),
    isOwner,
  };
};
