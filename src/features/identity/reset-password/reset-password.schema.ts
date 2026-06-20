import { z } from 'zod';
import { safeString } from '@/internal/common/validation/common-schemas';
import { passwordSchema } from '@/internal/auth/schemas/password.schema';
import { emailSchema } from '@/internal/auth/schemas/email.schema';
import { otpCodeSchema } from '@/internal/auth/schemas/otp-code.schema';

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
