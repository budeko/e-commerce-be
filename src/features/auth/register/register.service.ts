import { hashPassword } from '../../../lib/password';
import { User, Buyer, Seller } from './register.model';
import { RegisterError } from './register.errors';
import type { RegisterInput } from './schemas';

const ensureEmailAvailable = async (email: string) => {
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    throw new RegisterError(409, 'Bu e-posta adresi zaten kayıtlı');
  }
};

const createUserWithProfile = async (
  email: string,
  password: string,
  role: 'buyer' | 'seller'
) => {
  const hashedPassword = await hashPassword(password);
  const user = await User.create({ email, password: hashedPassword, role });

  try {
    if (role === 'buyer') {
      await Buyer.create({ userId: user._id });
    } else {
      await Seller.create({ userId: user._id });
    }
  } catch {
    await User.findByIdAndDelete(user._id);
    throw new RegisterError(500, 'Kayıt tamamlanamadı, lütfen tekrar deneyin');
  }

  return user;
};

export const registerBuyer = async (data: RegisterInput) => {
  const { email, password } = data;

  await ensureEmailAvailable(email);
  return createUserWithProfile(email, password, 'buyer');
};

export const registerSeller = async (data: RegisterInput) => {
  const { email, password } = data;

  await ensureEmailAvailable(email);
  return createUserWithProfile(email, password, 'seller');
};
