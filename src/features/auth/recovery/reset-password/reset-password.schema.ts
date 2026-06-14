import { z } from 'zod';
import { safeString } from '@/lib/common/validation/common-schemas';
import { passwordSchema } from '@/features/auth/core/schemas/password.schema';
import { emailSchema } from '@/features/auth/core/schemas/email.schema';
import { otpCodeSchema } from '@/features/auth/core/schemas/otp-code.schema';

export const resetPasswordByTokenSchema = z.object({
  token: safeString({ min: 1, max: 2048, label: 'Sıfırlama tokeni' }),
  newPassword: passwordSchema,
});

export const resetPasswordByCodeSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  newPassword: passwordSchema,
});

export const resetPasswordSchema = z.union([
  resetPasswordByTokenSchema,
  resetPasswordByCodeSchema,
]);

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
