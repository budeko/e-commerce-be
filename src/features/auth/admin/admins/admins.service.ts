import {
  canAssignAdminRole,
  canCreateAdminRole,
  canDeleteAdmin,
  canUpdateAdminRole,
  canViewAdmin,
} from '../../../../lib/auth/admin-permissions';
import { formatAdminResponse } from '../../../../lib/auth/admin-response';
import { hashPassword } from '../../../../lib/common/password';
import { Admin, User } from '../../../../db';
import type { AdminRole } from '../../../../db/auth/admin.model';
import { RegisterError, isDuplicateKeyError } from '../../register/register.errors';
import type { CreateAdminInput } from './schemas/create-admin.schema';
import type { UpdateAdminInput } from './schemas/update-admin.schema';

const findAdminRecord = async (targetUserId: string) => {
  const targetAdmin = await Admin.findOne({ userId: targetUserId });

  if (!targetAdmin) {
    throw new RegisterError(404, 'Admin bulunamadı');
  }

  const targetUser = await User.findById(targetUserId).select('email role isEmailVerified createdAt');

  if (!targetUser || targetUser.role !== 'admin') {
    throw new RegisterError(404, 'Admin bulunamadı');
  }

  return { targetAdmin, targetUser };
};

export const getAdminByUserId = async (
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string
) => {
  if (!canViewAdmin(actorRole, actorUserId, targetUserId)) {
    throw new RegisterError(403, 'Bu admin profilini görüntüleme yetkin yok');
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
    throw new RegisterError(403, 'Bu admin profilini güncelleme yetkin yok');
  }

  if (!canAssignAdminRole(actorRole, data.adminRole)) {
    throw new RegisterError(403, 'Bu admin rolünü atama yetkin yok');
  }

  const { targetAdmin, targetUser } = await findAdminRecord(targetUserId);

  if (targetAdmin.adminRole === data.adminRole) {
    return formatAdminResponse(targetAdmin, targetUser);
  }

  if (targetAdmin.adminRole === 'owner' && data.adminRole === 'helper') {
    const ownerCount = await Admin.countDocuments({ adminRole: 'owner' });

    if (ownerCount <= 1) {
      throw new RegisterError(400, 'Son owner helper yapılamaz');
    }
  }

  targetAdmin.adminRole = data.adminRole;
  await targetAdmin.save();

  return formatAdminResponse(targetAdmin, targetUser);
};

export const listAdmins = async () => {
  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const userIds = admins.map((admin) => admin.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return admins.map((admin) => {
    const user = usersById.get(String(admin.userId));
    return formatAdminResponse(admin, user);
  });
};

export const createAdmin = async (
  creatorUserId: string,
  creatorRole: AdminRole,
  data: CreateAdminInput
) => {
  if (!canCreateAdminRole(creatorRole, data.adminRole)) {
    throw new RegisterError(403, 'Bu admin rolünü oluşturma yetkin yok');
  }

  const existing = await User.findOne({ email: data.email.toLowerCase() });

  if (existing) {
    throw new RegisterError(409, 'Bu e-posta adresi zaten kayıtlı');
  }

  const hashedPassword = await hashPassword(data.password);

  try {
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    const admin = await Admin.create({
      userId: user._id,
      adminRole: data.adminRole,
      createdBy: creatorUserId,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    });

    return formatAdminResponse(admin, user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new RegisterError(409, 'Bu e-posta adresi zaten kayıtlı');
    }

    throw error;
  }
};

export const deleteAdmin = async (actorRole: AdminRole, targetUserId: string) => {
  if (!canDeleteAdmin(actorRole)) {
    throw new RegisterError(403, 'Admin silme yetkisi sadece owner\'da');
  }

  const targetAdmin = await Admin.findOne({ userId: targetUserId });

  if (!targetAdmin) {
    throw new RegisterError(404, 'Admin bulunamadı');
  }

  const targetUser = await User.findById(targetUserId).select('role');

  if (!targetUser || targetUser.role !== 'admin') {
    throw new RegisterError(404, 'Admin bulunamadı');
  }

  if (targetAdmin.adminRole === 'owner') {
    const ownerCount = await Admin.countDocuments({ adminRole: 'owner' });

    if (ownerCount <= 1) {
      throw new RegisterError(400, 'Son owner silinemez');
    }
  }

  await Admin.deleteOne({ userId: targetUserId });
  await User.findByIdAndDelete(targetUserId);

  return { userId: targetUserId };
};
