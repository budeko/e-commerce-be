import {
  ASSIGNABLE_SELLER_PERMISSIONS,
  SELLER_OWNER_ONLY_PERMISSIONS,
  SELLER_PERMISSION_LABELS,
  type SellerPermissionKey,
} from '@/internal/auth/access/seller/permission-keys';
import {
  assertSellerOwner,
  canDeleteSellerRoles,
  canReadSellerRoles,
  canWriteSellerRoles,
} from '@/internal/auth/access/seller/permissions';
import {
  SellerMember,
  SellerRole,
  SELLER_SYSTEM_OWNER_ROLE_SLUG,
} from '@/integrations/mongo';
import { AuthError, isDuplicateKeyError } from '@/internal/auth/errors';
import type { SellerAccessContext } from '@/internal/auth/queries/seller-context';
import { createUserId } from '@/internal/common/ids';
import type {
  CreateSellerRoleInput,
  UpdateSellerRoleInput,
} from '@/features/sellers/roles/create-role.schema';

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

export const listSellerPermissionRegistry = () =>
  ASSIGNABLE_SELLER_PERMISSIONS.map((key) => ({
    key,
    label: SELLER_PERMISSION_LABELS[key],
    ownerOnly: SELLER_OWNER_ONLY_PERMISSIONS.includes(key),
  }));

export const listSellerRoles = async (ctx: SellerAccessContext) => {
  if (!canReadSellerRoles(ctx)) {
    throw new AuthError(403, 'Rol listesini görüntüleme yetkin yok');
  }

  const roles = await SellerRole.find({ sellerId: ctx.companyId })
    .sort({ isSystem: -1, name: 1 })
    .lean();

  return roles.map(formatRoleResponse);
};

export const getSellerRoleById = async (ctx: SellerAccessContext, roleId: string) => {
  if (!canReadSellerRoles(ctx)) {
    throw new AuthError(403, 'Rol görüntüleme yetkin yok');
  }

  const role = await SellerRole.findOne({ _id: roleId, sellerId: ctx.companyId }).lean();

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  return formatRoleResponse(role);
};

export const createSellerRole = async (ctx: SellerAccessContext, data: CreateSellerRoleInput) => {
  if (!canWriteSellerRoles(ctx)) {
    throw new AuthError(403, 'Rol oluşturma yetkisi sadece şirket sahibinde');
  }

  if (data.slug === SELLER_SYSTEM_OWNER_ROLE_SLUG) {
    throw new AuthError(400, 'Bu slug sistem rolü için ayrılmış');
  }

  const existingSlug = await SellerRole.findOne({
    sellerId: ctx.companyId,
    slug: data.slug,
  }).lean();

  if (existingSlug) {
    throw new AuthError(409, 'Bu slug zaten kullanılıyor');
  }

  try {
    const role = await SellerRole.create({
      _id: createUserId(),
      sellerId: ctx.companyId,
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

export const updateSellerRole = async (
  ctx: SellerAccessContext,
  roleId: string,
  data: UpdateSellerRoleInput
) => {
  if (!canWriteSellerRoles(ctx)) {
    throw new AuthError(403, 'Rol güncelleme yetkisi sadece şirket sahibinde');
  }

  const role = await SellerRole.findOne({ _id: roleId, sellerId: ctx.companyId });

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

export const deleteSellerRole = async (ctx: SellerAccessContext, roleId: string) => {
  if (!canDeleteSellerRoles(ctx)) {
    throw new AuthError(403, 'Rol silme yetkisi sadece şirket sahibinde');
  }

  const role = await SellerRole.findOne({ _id: roleId, sellerId: ctx.companyId });

  if (!role) {
    throw new AuthError(404, 'Rol bulunamadı');
  }

  if (role.isSystem) {
    throw new AuthError(400, 'Sistem rolü silinemez');
  }

  const assignedCount = await SellerMember.countDocuments({ roleId });

  if (assignedCount > 0) {
    throw new AuthError(400, 'Bu role atanmış çalışanlar var, rol silinemez');
  }

  await SellerRole.findByIdAndDelete(roleId);

  return { roleId };
};

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

export const listAssignableSellerRoles = async (ctx: SellerAccessContext) => {
  assertSellerOwner(ctx, 'Rol listesini görüntüleme yetkisi sadece şirket sahibinde');

  const roles = await SellerRole.find({
    sellerId: ctx.companyId,
    slug: { $ne: SELLER_SYSTEM_OWNER_ROLE_SLUG },
  })
    .sort({ name: 1 })
    .select('name slug description permissions isSystem')
    .lean();

  return roles.map(formatRoleResponse);
};
