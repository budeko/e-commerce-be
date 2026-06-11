import { z } from 'zod';
import { safeString } from '../../../../lib/common/validation/common-schemas';
import { passwordSchema } from '../../register/schemas/password.schema';
import { emailSchema } from '../../register/schemas/email.schema';

const otpCodeSchema = z
  .string({ error: 'Doğrulama kodu zorunlu' })
  .trim()
  .regex(/^\d{6}$/, 'Doğrulama kodu 6 haneli olmalı');

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
