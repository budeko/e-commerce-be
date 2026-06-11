import { AuthOtp, Buyer, Seller, User } from '../../../../../db';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export const getVerificationExpiresAt = () => new Date(Date.now() + VERIFICATION_TTL_MS);

export const deleteUnverifiedUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || user.isEmailVerified) {
    return;
  }

  await Promise.all([
    AuthOtp.deleteMany({ userId }),
    Buyer.deleteOne({ userId }),
    Seller.deleteOne({ userId }),
  ]);
  await User.findByIdAndDelete(userId);
};
