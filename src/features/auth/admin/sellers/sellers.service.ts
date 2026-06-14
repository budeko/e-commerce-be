import { canManageSellerApproval, canReadSellers } from '@/features/auth/admin/access/permissions';
import {
  sendSellerApprovedEmail,
  sendSellerRejectedEmail,
} from '@/features/auth/admin/mail/send-seller-notifications';
import { createLogger } from '@/lib/common/logger';
import { Seller, User, type SellerApprovalStatus } from '@/db';
import { AuthError } from '@/features/auth/core/errors';
import type { AdminAccessContext } from '@/features/auth/core/queries/admin-context';

const assertCanManageSellerApproval = (ctx: AdminAccessContext) => {
  if (!canManageSellerApproval(ctx)) {
    throw new AuthError(403, 'Satıcı onaylama yetkin yok');
  }
};

const assertCanReadSellers = (ctx: AdminAccessContext) => {
  if (!canReadSellers(ctx)) {
    throw new AuthError(403, 'Satıcı listesini görüntüleme yetkin yok');
  }
};

const log = createLogger({ module: 'sellers-admin' });

export const listSellers = async (ctx: AdminAccessContext, status?: SellerApprovalStatus) => {
  assertCanReadSellers(ctx);

  const filter = status ? { approvalStatus: status } : {};

  const sellers = await Seller.find(filter)
    .sort({ _id: -1 })
    .lean();

  const userIds = sellers.map((seller) => seller._id);
  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return sellers.map((seller) => {
    const user = usersById.get(String(seller._id));

    return {
      userId: seller._id,
      email: user?.email,
      isEmailVerified: user?.isEmailVerified,
      createdAt: user?.createdAt,
      approvalStatus: seller.approvalStatus,
      rejectionReason: seller.rejectionReason,
      sellerType: seller.sellerType,
      companyName: seller.companyName,
      taxNumber: seller.taxNumber,
      country: seller.country,
      city: seller.city,
    };
  });
};

export const getSellerByUserId = async (ctx: AdminAccessContext, userId: string) => {
  assertCanReadSellers(ctx);

  const user = await User.findById(userId).select('email role isEmailVerified createdAt').lean();

  if (!user || user.role !== 'seller') {
    throw new AuthError(404, 'Satıcı bulunamadı');
  }

  const profile = await Seller.findById(userId).lean();

  if (!profile) {
    throw new AuthError(404, 'Satıcı profili bulunamadı');
  }

  return {
    userId: user._id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    approvalStatus: profile.approvalStatus,
    rejectionReason: profile.rejectionReason,
    profile,
  };
};

export const rejectSeller = async (
  ctx: AdminAccessContext,
  userId: string,
  reason: string
) => {
  assertCanManageSellerApproval(ctx);

  const user = await User.findById(userId).select('role email').lean();

  if (!user || user.role !== 'seller') {
    throw new AuthError(404, 'Satıcı bulunamadı');
  }

  const seller = await Seller.findById(userId);

  if (!seller) {
    throw new AuthError(404, 'Satıcı profili bulunamadı');
  }

  if (seller.approvalStatus !== 'pending') {
    throw new AuthError(400, 'Sadece onay bekleyen satıcılar reddedilebilir');
  }

  seller.approvalStatus = 'rejected';
  seller.rejectionReason = reason;
  await seller.save();

  try {
    await sendSellerRejectedEmail(user.email, reason, seller.companyName);
  } catch (error) {
    log.error({ err: error, userId }, 'Satıcı red bildirimi gönderilemedi');
  }

  return {
    userId: seller._id,
    approvalStatus: seller.approvalStatus,
    rejectionReason: seller.rejectionReason,
  };
};

export const approveSeller = async (ctx: AdminAccessContext, userId: string) => {
  assertCanManageSellerApproval(ctx);

  const user = await User.findById(userId).select('role email').lean();

  if (!user || user.role !== 'seller') {
    throw new AuthError(404, 'Satıcı bulunamadı');
  }

  const seller = await Seller.findById(userId);

  if (!seller) {
    throw new AuthError(404, 'Satıcı profili bulunamadı');
  }

  if (seller.approvalStatus !== 'pending') {
    throw new AuthError(400, 'Sadece onay bekleyen satıcılar onaylanabilir');
  }

  seller.approvalStatus = 'approved';
  seller.rejectionReason = null;
  await seller.save();

  try {
    await sendSellerApprovedEmail(user.email, seller.companyName);
  } catch (error) {
    log.error({ err: error, userId }, 'Satıcı onay bildirimi gönderilemedi');
  }

  return {
    userId: seller._id,
    approvalStatus: seller.approvalStatus,
  };
};
