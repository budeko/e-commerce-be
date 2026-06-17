import type { AuthTokenPayload } from '@/features/auth/core/security/access-token';
import { User, Buyer, Seller } from '@/db';
import { AuthError } from '@/features/auth/core/errors';
import { buildAuthUserFields } from '@/features/auth/core/responses/user.response';
import { updateBuyerProfile } from '@/features/auth/account/profile/buyer.service';
import { updateSellerProfile } from '@/features/auth/account/profile/seller.service';
import type { BuyerProfileUpdateInput, SellerProfileUpdateInput } from '@/features/auth/account/profile/profile.schema';

export const getProfile = async (auth: AuthTokenPayload) => {
  const user = await User.findById(auth.userId).select('email role isActive isEmailVerified');

  if (!user) {
    throw new AuthError(404, 'Kullanıcı bulunamadı');
  }

  if (auth.role === 'admin' || user.role === 'admin') {
    throw new AuthError(403, 'Bu endpoint buyer ve seller içindir');
  }

  const statusFields = await buildAuthUserFields(user);

  if (auth.role === 'buyer') {
    const profile = await Buyer.findById(auth.userId).lean();

    if (!profile) {
      throw new AuthError(404, 'Alıcı profili bulunamadı');
    }

    return {
      email: user.email,
      ...statusFields,
      profile,
    };
  }

  if (auth.role === 'seller') {
    const profile = await Seller.findById(
      'companyId' in statusFields ? statusFields.companyId : auth.userId
    ).lean();

    if (!profile) {
      throw new AuthError(404, 'Satıcı profili bulunamadı');
    }

    return {
      email: user.email,
      ...statusFields,
      rejectionReason: profile.rejectionReason ?? null,
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
