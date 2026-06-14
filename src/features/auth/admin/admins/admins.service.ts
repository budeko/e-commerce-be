import {
  canAssignAdminRole,
  canCreateAdminRole,
  canDeleteAdmin,
  canListAdmins,
  canUpdateAdminRole,
  canViewAdmin,
} from '@/features/auth/admin/access/permissions';
import { formatAdminResponse } from '@/features/auth/core/responses/admin.response';
import { hashPassword } from '@/lib/common/password';
import { createUserId } from '@/lib/common/user-id';
import { Admin, User, type AdminRole } from '@/db';
import { AuthError, isDuplicateKeyError } from '@/features/auth/core/errors';
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
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string
) => {
  if (!canViewAdmin(actorRole, actorUserId, targetUserId)) {
    throw new AuthError(403, 'Bu admin profilini görüntüleme yetkin yok');
  }

  const { targetAdmin, targetUser } = await findAdminRecord(targetUserId);
  return formatAdminResponse(targetAdmin, targetUser);
};

export const updateAdmin = async (
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string,
  data: UpdateAdminInput
) => {
  if (!canUpdateAdminRole(actorRole, actorUserId, targetUserId)) {
    throw new AuthError(403, 'Bu admin profilini güncelleme yetkin yok');
  }

  if (!canAssignAdminRole(actorRole, data.adminRole)) {
    throw new AuthError(403, 'Bu admin rolünü atama yetkin yok');
  }

  const { targetAdmin, targetUser } = await findAdminRecord(targetUserId);

  if (targetAdmin.adminRole === data.adminRole) {
    return formatAdminResponse(targetAdmin, targetUser);
  }

  if (targetAdmin.adminRole === 'owner' && data.adminRole === 'helper') {
    const ownerCount = await Admin.countDocuments({ adminRole: 'owner' });

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son owner helper yapılamaz');
    }
  }

  targetAdmin.adminRole = data.adminRole;
  await targetAdmin.save();

  return formatAdminResponse(targetAdmin, targetUser);
};

export const listAdmins = async (actorRole: AdminRole) => {
  if (!canListAdmins(actorRole)) {
    throw new AuthError(403, 'Admin listesini görüntüleme yetkin yok');
  }

  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const userIds = admins.map((admin) => admin._id);
  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return admins.map((admin) => {
    const user = usersById.get(String(admin._id));
    return formatAdminResponse(admin, user);
  });
};

export const createAdmin = async (
  creatorUserId: string,
  creatorRole: AdminRole,
  data: CreateAdminInput
) => {
  if (!canCreateAdminRole(creatorRole, data.adminRole)) {
    throw new AuthError(403, 'Bu admin rolünü oluşturma yetkin yok');
  }

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
      adminRole: data.adminRole,
      createdBy: creatorUserId,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    });

    return formatAdminResponse(admin, user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AuthError(409, 'Bu e-posta adresi zaten kayıtlı');
    }

    throw error;
  }
};

export const deleteAdmin = async (actorRole: AdminRole, targetUserId: string) => {
  if (!canDeleteAdmin(actorRole)) {
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

  if (targetAdmin.adminRole === 'owner') {
    const ownerCount = await Admin.countDocuments({ adminRole: 'owner' });

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son owner silinemez');
    }
  }

  await Admin.findByIdAndDelete(targetUserId);
  await User.findByIdAndDelete(targetUserId);

  return { userId: targetUserId };
};
