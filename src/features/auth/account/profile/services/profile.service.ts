import type { AuthTokenPayload } from '../../../../../lib/auth/token/access-token';
import { User, Buyer, Seller } from '../../../../../db';
import { AuthError } from '../../../shared/errors';
import { updateBuyerProfile } from './buyer.service';
import { updateSellerProfile } from './seller.service';
import type { BuyerProfileUpdateInput, SellerProfileUpdateInput } from '../../../schemas/profile';

export const getProfile = async (auth: AuthTokenPayload) => {
  const user = await User.findById(auth.userId).select('email role isActive isEmailVerified');

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
  }

  if (auth.role === 'buyer') {
    const profile = await Buyer.findOne({ userId: auth.userId }).lean();

    if (!profile) {
      throw new AuthError(404, 'Alıcı profili bulunamadı');
    }

    return {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      profile,
    };
  }

  if (auth.role === 'seller') {
    const profile = await Seller.findOne({ userId: auth.userId }).lean();

    if (!profile) {
      throw new AuthError(404, 'Satıcı profili bulunamadı');
    }

    return {
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      approvalStatus: profile.approvalStatus,
      rejectionReason: profile.rejectionReason,
      profile,
    };
  }

  throw new AuthError(403, 'Bu endpoint buyer ve seller içindir');
};

export const updateProfile = async (
  auth: AuthTokenPayload,
  data: BuyerProfileUpdateInput | SellerProfileUpdateInput
) => {
  if (auth.role === 'buyer') {
    return updateBuyerProfile(auth.userId, data as BuyerProfileUpdateInput);
  }

  if (auth.role === 'seller') {
    return updateSellerProfile(auth.userId, data as SellerProfileUpdateInput);
  }

  throw new AuthError(403, 'Bu endpoint buyer ve seller içindir');
};
