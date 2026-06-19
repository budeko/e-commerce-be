import { AdminRole, SYSTEM_OWNER_ROLE_SLUG } from '@/integrations/mongo/models/auth/admin-role.model';
import { ALL_PERMISSIONS } from '@/features/auth/admin/access/permission-keys';
import { createUserId } from '@/internal/ids';

export const ensureSystemOwnerRole = async () => {
  let role = await AdminRole.findOne({ slug: SYSTEM_OWNER_ROLE_SLUG });

  if (!role) {
    role = await AdminRole.create({
      _id: createUserId(),
      name: 'Owner',
      slug: SYSTEM_OWNER_ROLE_SLUG,
      description: 'Sistem sahibi — tüm yetkiler',
      permissions: ALL_PERMISSIONS,
      isSystem: true,
      createdBy: null,
    });

    return role;
  }

  const missingPermissions = ALL_PERMISSIONS.filter(
    (permission) => !role!.permissions.includes(permission)
  );

  if (missingPermissions.length > 0) {
    role.permissions = ALL_PERMISSIONS;
    await role.save();
  }

  return role;
};
