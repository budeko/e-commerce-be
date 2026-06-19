import {
  canCreateAdmin,
  canDeleteAdmin,
  canUpdateAdminRoleId,
  canViewAdmin,
} from '@/features/auth/admin/access/permissions';
import { PERMISSIONS } from '@/features/auth/admin/access/permission-keys';
import { assertPermission } from '@/features/auth/admin/access/permissions';
import {
  assertAssignableRoleId,
  countOwnerAdmins,
  getRoleSummariesByIds,
  isOwnerRoleId,
} from '@/features/auth/admin/roles/roles.service';
import { formatAdminResponse } from '@/features/auth/core/responses/admin.response';
import { hashPassword } from '@/internal/security';
import { createUserId } from '@/internal/ids';
import { Admin, User } from '@/integrations/mongo';
import { AuthError, isDuplicateKeyError } from '@/features/auth/core/errors';
import type { AdminAccessContext } from '@/features/auth/core/queries/admin-context';
import type { CreateAdminInput } from '@/features/auth/admin/admins/create-admin.schema';
import type { UpdateAdminInput } from '@/features/auth/admin/admins/update-admin.schema';

const findAdminRecord = async (targetUserId: string) => {
  const targetAdmin = await Admin.findById(targetUserId);

  if (!targetAdmin) {
    throw new AuthError(404, 'Admin bulunamadı');
  }

  const targetUser = await User.findById(targetUserId).select('email role isEmailVerified createdAt');

  if (!targetUser || targetUser.role !== 'admin') {
    throw new AuthError(404, 'Admin bulunamadı');
  }

  return { targetAdmin, targetUser };
};

export const getAdminByUserId = async (
  ctx: AdminAccessContext,
  actorUserId: string,
  targetUserId: string
) => {
  if (!canViewAdmin(ctx, actorUserId, targetUserId)) {
    throw new AuthError(403, 'Bu admin profilini görüntüleme yetkin yok');
  }

  const { targetAdmin, targetUser } = await findAdminRecord(targetUserId);
  const rolesById = await getRoleSummariesByIds([String(targetAdmin.roleId)]);

  return formatAdminResponse(targetAdmin, targetUser, rolesById.get(String(targetAdmin.roleId)));
};

export const updateAdmin = async (
  ctx: AdminAccessContext,
  actorUserId: string,
  targetUserId: string,
  data: UpdateAdminInput
) => {
  if (!canUpdateAdminRoleId(ctx, actorUserId, targetUserId)) {
    throw new AuthError(403, 'Bu admin rolünü güncelleme yetkin yok');
  }

  await assertAssignableRoleId(data.roleId);

  const { targetAdmin, targetUser } = await findAdminRecord(targetUserId);

  if (String(targetAdmin.roleId) === data.roleId) {
    const rolesById = await getRoleSummariesByIds([data.roleId]);
    return formatAdminResponse(targetAdmin, targetUser, rolesById.get(data.roleId));
  }

  const currentlyOwner = await isOwnerRoleId(String(targetAdmin.roleId));

  if (currentlyOwner) {
    const ownerCount = await countOwnerAdmins();

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son owner rolü değiştirilemez');
    }
  }

  targetAdmin.roleId = data.roleId;
  await targetAdmin.save();

  const rolesById = await getRoleSummariesByIds([data.roleId]);

  return formatAdminResponse(targetAdmin, targetUser, rolesById.get(data.roleId));
};

export const listAdmins = async (ctx: AdminAccessContext) => {
  assertPermission(ctx, PERMISSIONS.ADMINS_READ, 'Admin listesini görüntüleme yetkin yok');

  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const userIds = admins.map((admin) => admin._id);
  const roleIds = admins.map((admin) => String(admin.roleId));
  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();
  const rolesById = await getRoleSummariesByIds(roleIds);

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return admins.map((admin) => {
    const user = usersById.get(String(admin._id));
    return formatAdminResponse(admin, user, rolesById.get(String(admin.roleId)));
  });
};

export const createAdmin = async (ctx: AdminAccessContext, data: CreateAdminInput) => {
  if (!canCreateAdmin(ctx)) {
    throw new AuthError(403, 'Admin oluşturma yetkisi sadece owner\'da');
  }

  await assertAssignableRoleId(data.roleId);

  const existing = await User.findOne({ email: data.email.toLowerCase() });

  if (existing) {
    throw new AuthError(409, 'Bu e-posta adresi zaten kayıtlı');
  }

  const hashedPassword = await hashPassword(data.password);
  const userId = createUserId();

  try {
    const user = await User.create({
      _id: userId,
      email: data.email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    const admin = await Admin.create({
      _id: userId,
      roleId: data.roleId,
      createdBy: ctx.userId,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    });

    const rolesById = await getRoleSummariesByIds([data.roleId]);

    return formatAdminResponse(admin, user, rolesById.get(data.roleId));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AuthError(409, 'Bu e-posta adresi zaten kayıtlı');
    }

    throw error;
  }
};

export const deleteAdmin = async (ctx: AdminAccessContext, targetUserId: string) => {
  if (!canDeleteAdmin(ctx)) {
    throw new AuthError(403, 'Admin silme yetkisi sadece owner\'da');
  }

  const targetAdmin = await Admin.findById(targetUserId);

  if (!targetAdmin) {
    throw new AuthError(404, 'Admin bulunamadı');
  }

  const targetUser = await User.findById(targetUserId).select('role');

  if (!targetUser || targetUser.role !== 'admin') {
    throw new AuthError(404, 'Admin bulunamadı');
  }

  if (await isOwnerRoleId(String(targetAdmin.roleId))) {
    const ownerCount = await countOwnerAdmins();

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son owner silinemez');
    }
  }

  await Admin.findByIdAndDelete(targetUserId);
  await User.findByIdAndDelete(targetUserId);

  return { userId: targetUserId };
};
