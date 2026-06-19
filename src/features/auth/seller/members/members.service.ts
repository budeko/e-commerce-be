import {
  canDeleteSellerMembers,
  canUpdateSellerMemberProfile,
  canUpdateSellerMemberRole,
  canViewSellerMember,
  assertSellerPermission,
} from '@/internal/auth/access/seller/permissions';
import { SELLER_PERMISSIONS } from '@/internal/auth/access/seller/permission-keys';
import {
  assertAssignableSellerRoleId,
  countOwnerSellerMembers,
  getSellerRoleSummariesByIds,
  isOwnerSellerRoleId,
} from '@/features/auth/seller/roles/roles.service';
import { SellerMember } from '@/integrations/mongo/models/auth/seller-member.model';
import { User } from '@/integrations/mongo';
import { hashPassword } from '@/internal/security';
import { createUserId } from '@/internal/ids';
import { AuthError, isDuplicateKeyError } from '@/internal/auth/errors';
import type { SellerAccessContext } from '@/internal/auth/queries/seller-context';
import type { CreateSellerMemberInput } from '@/features/auth/seller/members/create-member.schema';
import type {
  UpdateSellerMemberProfileInput,
  UpdateSellerMemberRoleInput,
} from '@/features/auth/seller/members/create-member.schema';

const formatMemberResponse = (
  member: {
    _id: unknown;
    sellerId: string;
    roleId: string;
    isOwner: boolean;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    createdBy?: unknown;
    createdAt?: Date;
  },
  user?: { email?: string; isEmailVerified?: boolean; createdAt?: Date } | null,
  role?: { roleId: string; name: string; slug: string }
) => ({
  userId: member._id,
  email: user?.email,
  isEmailVerified: user?.isEmailVerified,
  companyId: member.sellerId,
  roleId: member.roleId,
  role: role ?? null,
  isOwner: member.isOwner,
  createdAt: user?.createdAt ?? member.createdAt,
  createdBy: member.createdBy ?? null,
  profile: {
    firstName: member.firstName ?? null,
    lastName: member.lastName ?? null,
    phone: member.phone ?? null,
  },
});

const findMemberRecord = async (companyId: string, targetUserId: string) => {
  const member = await SellerMember.findOne({ _id: targetUserId, sellerId: companyId });

  if (!member) {
    throw new AuthError(404, 'Çalışan bulunamadı');
  }

  const user = await User.findById(targetUserId).select('email role isEmailVerified createdAt');

  if (!user || user.role !== 'seller') {
    throw new AuthError(404, 'Çalışan bulunamadı');
  }

  return { member, user };
};

export const getSellerMemberByUserId = async (
  ctx: SellerAccessContext,
  targetUserId: string
) => {
  if (!canViewSellerMember(ctx, ctx.userId, targetUserId)) {
    throw new AuthError(403, 'Bu çalışanı görüntüleme yetkin yok');
  }

  const { member, user } = await findMemberRecord(ctx.companyId, targetUserId);
  const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, [String(member.roleId)]);

  return formatMemberResponse(member, user, rolesById.get(String(member.roleId)));
};

export const listSellerMembers = async (ctx: SellerAccessContext) => {
  assertSellerPermission(ctx, SELLER_PERMISSIONS.MEMBERS_READ, 'Ekip listesini görüntüleme yetkin yok');

  const members = await SellerMember.find({ sellerId: ctx.companyId })
    .sort({ isOwner: -1, createdAt: -1 })
    .lean();

  const userIds = members.map((member) => member._id);
  const roleIds = members.map((member) => String(member.roleId));

  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();

  const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, roleIds);
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return members.map((member) => {
    const user = usersById.get(String(member._id));
    return formatMemberResponse(member, user, rolesById.get(String(member.roleId)));
  });
};

export const createSellerMember = async (ctx: SellerAccessContext, data: CreateSellerMemberInput) => {
  if (!ctx.isOwner) {
    throw new AuthError(403, 'Çalışan davet etme yetkisi sadece şirket sahibinde');
  }

  if (ctx.approvalStatus !== 'approved') {
    throw new AuthError(403, 'Onaylı şirket hesabı olmadan çalışan eklenemez');
  }

  await assertAssignableSellerRoleId(ctx.companyId, data.roleId);

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
      role: 'seller',
      isActive: true,
      isEmailVerified: true,
    });

    const member = await SellerMember.create({
      _id: userId,
      sellerId: ctx.companyId,
      roleId: data.roleId,
      isOwner: false,
      createdBy: ctx.userId,
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    });

    const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, [data.roleId]);

    return formatMemberResponse(member, user, rolesById.get(data.roleId));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AuthError(409, 'Bu e-posta adresi zaten kayıtlı');
    }

    throw error;
  }
};

export const updateSellerMemberRole = async (
  ctx: SellerAccessContext,
  targetUserId: string,
  data: UpdateSellerMemberRoleInput
) => {
  if (!canUpdateSellerMemberRole(ctx, ctx.userId, targetUserId)) {
    throw new AuthError(403, 'Bu çalışanın rolünü güncelleme yetkin yok');
  }

  await assertAssignableSellerRoleId(ctx.companyId, data.roleId);

  const { member, user } = await findMemberRecord(ctx.companyId, targetUserId);

  if (String(member.roleId) === data.roleId) {
    const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, [data.roleId]);
    return formatMemberResponse(member, user, rolesById.get(data.roleId));
  }

  if (member.isOwner) {
    const ownerCount = await countOwnerSellerMembers(ctx.companyId);

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son şirket sahibinin rolü değiştirilemez');
    }
  }

  if (await isOwnerSellerRoleId(ctx.companyId, data.roleId)) {
    throw new AuthError(403, 'Owner rolü atanamaz');
  }

  member.roleId = data.roleId;
  member.isOwner = false;
  await member.save();

  const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, [data.roleId]);

  return formatMemberResponse(member, user, rolesById.get(data.roleId));
};

export const updateSellerMemberProfile = async (
  ctx: SellerAccessContext,
  targetUserId: string,
  data: UpdateSellerMemberProfileInput
) => {
  if (!canUpdateSellerMemberProfile(ctx, ctx.userId, targetUserId)) {
    throw new AuthError(403, 'Bu çalışan profilini güncelleme yetkin yok');
  }

  await findMemberRecord(ctx.companyId, targetUserId);

  const updatedMember = await SellerMember.findByIdAndUpdate(
    targetUserId,
    { $set: data },
    { returnDocument: 'after' }
  );

  if (!updatedMember) {
    throw new AuthError(404, 'Çalışan bulunamadı');
  }

  const user = await User.findById(targetUserId).select('email isEmailVerified createdAt');
  const rolesById = await getSellerRoleSummariesByIds(ctx.companyId, [String(updatedMember.roleId)]);

  return formatMemberResponse(
    updatedMember,
    user,
    rolesById.get(String(updatedMember.roleId))
  );
};

export const deleteSellerMember = async (ctx: SellerAccessContext, targetUserId: string) => {
  if (!canDeleteSellerMembers(ctx)) {
    throw new AuthError(403, 'Çalışan silme yetkisi sadece şirket sahibinde');
  }

  const member = await SellerMember.findOne({ _id: targetUserId, sellerId: ctx.companyId });

  if (!member) {
    throw new AuthError(404, 'Çalışan bulunamadı');
  }

  if (member.isOwner) {
    const ownerCount = await countOwnerSellerMembers(ctx.companyId);

    if (ownerCount <= 1) {
      throw new AuthError(400, 'Son şirket sahibi silinemez');
    }
  }

  await SellerMember.findByIdAndDelete(targetUserId);
  await User.findByIdAndDelete(targetUserId);

  return { userId: targetUserId };
};
