import { describe, expect, it } from 'vitest';
import { registerSchema } from '@/features/auth/schemas/credentials/register.schema';
import { loginSchema } from '@/features/auth/schemas/credentials/login.schema';
import { changePasswordSchema } from '@/features/auth/schemas/credentials/change-password.schema';
import { resendVerificationSchema } from '@/features/auth/schemas/verification/resend-verification.schema';
import { forgotPasswordSchema } from '@/features/auth/schemas/recovery/forgot-password.schema';
import { buyerProfileUpdateSchema } from '@/features/auth/schemas/profile/buyer-profile-update.schema';
import { createAdminSchema } from '@/features/auth/schemas/admin/create-admin.schema';
import { passwordSchema } from '@/features/auth/schemas/fields/password.schema';
import { emailSchema } from '@/features/auth/schemas/fields/email.schema';
import { otpCodeSchema } from '@/features/auth/schemas/fields/otp-code.schema';

describe('registerSchema', () => {
  it('geçerli kayıt gövdesini kabul eder', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass1',
      role: 'buyer',
    });
    expect(result.success).toBe(true);
  });

  it('geçersiz rolü reddeder', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass1',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });

  it('fazladan alanı reddeder', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass1',
      role: 'buyer',
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('rememberMe default false', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });
});

describe('changePasswordSchema', () => {
  it('aynı şifreyi reddeder', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'SecurePass1',
      newPassword: 'SecurePass1',
    });
    expect(result.success).toBe(false);
  });
});

describe('resendVerificationSchema', () => {
  it('email zorunludur', () => {
    const result = resendVerificationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('geçerli email kabul edilir', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });
});

describe('buyerProfileUpdateSchema', () => {
  it('boş gövde reddedilir', () => {
    const result = buyerProfileUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('en az bir alan kabul edilir', () => {
    const result = buyerProfileUpdateSchema.safeParse({ firstName: 'Ali' });
    expect(result.success).toBe(true);
  });
});

describe('createAdminSchema', () => {
  it('owner admin oluşturmayı kabul eder', () => {
    const result = createAdminSchema.safeParse({
      email: 'admin@example.com',
      password: 'SecurePass1',
      adminRole: 'owner',
    });
    expect(result.success).toBe(true);
  });
});

describe('field schemas', () => {
  it('passwordSchema zayıf şifreyi reddeder', () => {
    expect(passwordSchema.safeParse('password').success).toBe(false);
  });

  it('emailSchema geçersiz email reddeder', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });

  it('otpCodeSchema 6 hane ister', () => {
    expect(otpCodeSchema.safeParse('12345').success).toBe(false);
    expect(otpCodeSchema.safeParse('123456').success).toBe(true);
  });
});
