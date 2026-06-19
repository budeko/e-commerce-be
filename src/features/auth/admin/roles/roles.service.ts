import {
  ASSIGNABLE_PERMISSIONS,
  OWNER_ONLY_PERMISSIONS,
  PERMISSION_LABELS,
  type PermissionKey,
} from '@/internal/auth/access/admin/permission-keys';
import {
  assertIsOwner,
  canDeleteAdminRoles,
  canReadAdminRoles,
  canWriteAdminRoles,
} from '@/internal/auth/access/admin/permissions';
import { Admin, AdminRole, SYSTEM_OWNER_ROLE_SLUG } from '@/integrations/mongo';
import { AuthError, isDuplicateKeyError } from '@/internal/auth/errors';
import type { AdminAccessContext } from '@/internal/auth/queries/admin-context';
import { createUserId } from '@/internal/ids';
import type { CreateAdminRoleInput } from '@/features/auth/admin/roles/create-role.schema';
import type { UpdateAdminRoleInput } from '@/features/auth/admin/roles/create-role.schema';

const formatRoleResponse = (role: {
  _id: unknown;
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  createdBy?: unknown;
  createdAt?: Date;
}) => ({
  roleId: role._id,
  name: role.name,
  slug: role.slug,
  description: role.description ?? null,
  permissions: role.permissions,
  isSystem: role.isSystem,
  createdBy: role.createdBy ?? null,
  createdAt: role.createdAt,
});

export const listPermissionRegistry = () =>
  ASSIGNABLE_PERMISSIONS.map((key) => ({
    key,
    label: PERMISSION_LABELS[key],
    ownerOnly: OWNER_ONLY_PERMISSIONS.includes(key),
  }));

export const listAdminRoles = async (ctx: AdminAccessContext) => {
  if (!canReadAdminRoles(ctx)) {
    throw new AuthError(403, 'Rol listesini görüntüleme yetkin yok');
  }

  const roles = await AdminRole.find().sort({ isSystem: -1, name: 1 }).lean();
  return roles.map(formatRoleResponse);
};

export const getAdminRoleById = async (ctx: AdminAccessContext, roleId: string) => {
  if (!canReadAdminRoles(ctx)) {
    throw new AuthError(403, 'Rol görüntüleme yetkin yok');
  }

  const role = await AdminRole.findById(roleId).lean();

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  return formatRoleResponse(role);
};

export const createAdminRole = async (
  ctx: AdminAccessContext,
  data: CreateAdminRoleInput
) => {
  if (!canWriteAdminRoles(ctx)) {
    throw new AuthError(403, 'Rol oluşturma yetkisi sadece owner\'da');
  }

  if (data.slug === SYSTEM_OWNER_ROLE_SLUG) {
    throw new AuthError(400, 'Bu slug sistem rolü için ayrılmış');
  }

  const existingSlug = await AdminRole.findOne({ slug: data.slug }).lean();

  if (existingSlug) {
    throw new AuthError(409, 'Bu slug zaten kullanılıyor');
  }

  try {
    const role = await AdminRole.create({
      _id: createUserId(),
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      permissions: data.permissions,
      isSystem: false,
      createdBy: ctx.userId,
    });

    return formatRoleResponse(role);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AuthError(409, 'Bu slug zaten kullanılıyor');
    }

    throw error;
  }
};

export const updateAdminRole = async (
  ctx: AdminAccessContext,
  roleId: string,
  data: UpdateAdminRoleInput
) => {
  if (!canWriteAdminRoles(ctx)) {
    throw new AuthError(403, 'Rol güncelleme yetkisi sadece owner\'da');
  }

  const role = await AdminRole.findById(roleId);

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  if (role.isSystem) {
    throw new AuthError(400, 'Sistem rolü düzenlenemez');
  }

  if (data.name !== undefined) {
    role.name = data.name;
  }

  if (data.description !== undefined) {
    role.description = data.description;
  }

  if (data.permissions !== undefined) {
    role.permissions = data.permissions;
  }

  await role.save();

  return formatRoleResponse(role);
};

export const deleteAdminRole = async (ctx: AdminAccessContext, roleId: string) => {
  if (!canDeleteAdminRoles(ctx)) {
    throw new AuthError(403, 'Rol silme yetkisi sadece owner\'da');
  }

  const role = await AdminRole.findById(roleId);

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  if (role.isSystem) {
    throw new AuthError(400, 'Sistem rolü silinemez');
  }

  const assignedCount = await Admin.countDocuments({ roleId });

  if (assignedCount > 0) {
    throw new AuthError(400, 'Bu role atanmış adminler var, rol silinemez');
  }

  await AdminRole.findByIdAndDelete(roleId);

  return { roleId };
};

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

export const listAssignableRoles = async (ctx: AdminAccessContext) => {
  assertIsOwner(ctx, 'Rol listesini görüntüleme yetkisi sadece owner\'da');

  const roles = await AdminRole.find({ slug: { $ne: SYSTEM_OWNER_ROLE_SLUG } })
    .sort({ name: 1 })
    .select('name slug description permissions isSystem')
    .lean();

  return roles.map(formatRoleResponse);
};
