import { createLogger } from '../../../../../lib/common/logger';
import { sendUserVerificationEmail } from '../../../shared/mail/send-verification';
import {
  assertRegisterEmailCooldown,
  EmailCooldownError,
  markRegisterEmailCooldown,
  markVerificationEmailSent,
} from '../../../shared/mail/cooldown';
import {
  deleteUnverifiedUser,
  getVerificationExpiresAt,
} from '../helpers/unverified-user';
import { invalidateAuthOtp } from '../../../shared/otp/otp';
import { hashPassword } from '../../../../../lib/common/password';
import { User, Buyer, Seller } from '../../../../../db';
import { AuthError } from '../../../shared/errors';
import type { RegisterInput } from '../../../schemas/credentials/register.schema';

const log = createLogger({ module: 'register' });

const resolveEmailForRegister = async (email: string) => {
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (!existing) {
    return;
  }

  if (existing.isEmailVerified) {
    throw new AuthError(409, 'Bu e-posta adresi zaten kayıtlı');
  }

  await deleteUnverifiedUser(existing._id.toString());
};

const createUserWithProfile = async (
  email: string,
  password: string,
  role: 'buyer' | 'seller'
) => {
  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    role,
    isActive: false,
    isEmailVerified: false,
    verificationExpiresAt: getVerificationExpiresAt(),
  });

  try {
    if (role === 'buyer') {
      await Buyer.create({ userId: user._id });
    } else {
      await Seller.create({ userId: user._id });
    }
  } catch {
    await deleteUnverifiedUser(user._id.toString());
    throw new AuthError(500, 'Kayıt tamamlanamadı, lütfen tekrar deneyin');
  }

  try {
    await sendUserVerificationEmail(user._id.toString(), email);
    await markRegisterEmailCooldown(email);
    await markVerificationEmailSent(user._id.toString());
  } catch (error) {
    log.error({ err: error, userId: user._id.toString(), email }, 'Doğrulama e-postası gönderilemedi');
    await markRegisterEmailCooldown(email);
    await invalidateAuthOtp(user._id.toString(), 'email_verify');
    await deleteUnverifiedUser(user._id.toString());
    throw new AuthError(
      503,
      'Doğrulama e-postası gönderilemedi, lütfen tekrar deneyin'
    );
  }

  return { user };
};

export const register = async (data: RegisterInput) => {
  const { email, password, role } = data;
  const normalizedEmail = email.toLowerCase();

  try {
    await assertRegisterEmailCooldown(normalizedEmail);
  } catch (error) {
    if (error instanceof EmailCooldownError) {
      throw new AuthError(error.statusCode, error.message);
    }

    throw error;
  }

  await resolveEmailForRegister(normalizedEmail);
  return createUserWithProfile(normalizedEmail, password, role);
};
