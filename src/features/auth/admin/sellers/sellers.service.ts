import { canManageSellers } from '../../../../lib/auth/admin-permissions';
import {
  sendSellerApprovedEmail,
  sendSellerRejectedEmail,
} from '../../../../lib/auth/email/send-mail';
import { createLogger } from '../../../../lib/common/logger';
import { Seller, User } from '../../../../db';
import type { AdminRole } from '../../../../db/auth/admin.model';
import type { SellerApprovalStatus } from '../../../../db/auth/seller.model';
import { RegisterError } from '../../register/register.errors';

const assertCanManageSellers = (adminRole: AdminRole) => {
  if (!canManageSellers(adminRole)) {
    throw new RegisterError(403, 'Satıcı yönetimi için yetkin yok');
  }
};

const log = createLogger({ module: 'sellers-admin' });

export const listSellers = async (status?: SellerApprovalStatus) => {
  const filter = status ? { approvalStatus: status } : {};

  const sellers = await Seller.find(filter)
    .sort({ _id: -1 })
    .lean();

  const userIds = sellers.map((seller) => seller.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('email isEmailVerified createdAt')
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return sellers.map((seller) => {
    const user = usersById.get(String(seller.userId));

    return {
      userId: seller.userId,
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

export const getSellerByUserId = async (userId: string) => {
  const user = await User.findById(userId).select('email role isEmailVerified createdAt').lean();

  if (!user || user.role !== 'seller') {
    throw new RegisterError(404, 'Satıcı bulunamadı');
  }

  const profile = await Seller.findOne({ userId }).lean();

  if (!profile) {
    throw new RegisterError(404, 'Satıcı profili bulunamadı');
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

export const rejectSeller = async (adminRole: AdminRole, userId: string, reason: string) => {
  assertCanManageSellers(adminRole);
  const user = await User.findById(userId).select('role email').lean();

  if (!user || user.role !== 'seller') {
    throw new RegisterError(404, 'Satıcı bulunamadı');
  }

  const seller = await Seller.findOne({ userId });

  if (!seller) {
    throw new RegisterError(404, 'Satıcı profili bulunamadı');
  }

  if (seller.approvalStatus !== 'pending') {
    throw new RegisterError(400, 'Sadece onay bekleyen satıcılar reddedilebilir');
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
    userId: seller.userId,
    approvalStatus: seller.approvalStatus,
    rejectionReason: seller.rejectionReason,
  };
};

export const approveSeller = async (adminRole: AdminRole, userId: string) => {
  assertCanManageSellers(adminRole);
  const user = await User.findById(userId).select('role email').lean();

  if (!user || user.role !== 'seller') {
    throw new RegisterError(404, 'Satıcı bulunamadı');
  }

  const seller = await Seller.findOne({ userId });

  if (!seller) {
    throw new RegisterError(404, 'Satıcı profili bulunamadı');
  }

  if (seller.approvalStatus !== 'pending') {
    throw new RegisterError(400, 'Sadece onay bekleyen satıcılar onaylanabilir');
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
    userId: seller.userId,
    approvalStatus: seller.approvalStatus,
  };
};
