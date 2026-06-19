import type { PermissionKey } from '@/internal/auth/access/admin/permission-keys';
import { PERMISSIONS } from '@/internal/auth/access/admin/permission-keys';
import type { AdminAccessContext } from '@/internal/auth/queries/admin-context';
import { AuthError } from '@/internal/auth/errors';

export const hasPermission = (ctx: AdminAccessContext, permission: PermissionKey) =>
  ctx.isOwner || ctx.permissions.has(permission);

export const assertPermission = (
  ctx: AdminAccessContext,
  permission: PermissionKey,
  message: string
) => {
  if (!hasPermission(ctx, permission)) {
    throw new AuthError(403, message);
  }
};

export const assertIsOwner = (ctx: AdminAccessContext, message: string) => {
  if (!ctx.isOwner) {
    throw new AuthError(403, message);
  }
};

export const canViewAdmin = (
  ctx: AdminAccessContext,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return true;
  }

  return hasPermission(ctx, PERMISSIONS.ADMINS_READ);
};

export const canUpdateAdminProfile = (
  ctx: AdminAccessContext,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return true;
  }

  return hasPermission(ctx, PERMISSIONS.ADMINS_WRITE);
};

export const canUpdateAdminRoleId = (
  ctx: AdminAccessContext,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return false;
  }

  return ctx.isOwner;
};

export const canCreateAdmin = (ctx: AdminAccessContext) => ctx.isOwner;

export const canDeleteAdmin = (ctx: AdminAccessContext) => ctx.isOwner;

export const canManageSellerApproval = (ctx: AdminAccessContext) =>
  hasPermission(ctx, PERMISSIONS.SELLERS_APPROVE);

export const canReadSellers = (ctx: AdminAccessContext) =>
  hasPermission(ctx, PERMISSIONS.SELLERS_READ);

export const canReadCategories = (ctx: AdminAccessContext) =>
  hasPermission(ctx, PERMISSIONS.CATEGORIES_READ);

export const canWriteCategories = (ctx: AdminAccessContext) =>
  hasPermission(ctx, PERMISSIONS.CATEGORIES_WRITE);

export const canReadAdminRoles = (ctx: AdminAccessContext) =>
  hasPermission(ctx, PERMISSIONS.ADMIN_ROLES_READ);

export const canWriteAdminRoles = (ctx: AdminAccessContext) => ctx.isOwner;

export const canDeleteAdminRoles = (ctx: AdminAccessContext) => ctx.isOwner;
