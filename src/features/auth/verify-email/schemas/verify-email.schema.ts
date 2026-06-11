import { z } from 'zod';
import { safeString } from '../../../../lib/common/validation/common-schemas';
import { emailSchema } from '../../register/schemas/email.schema';

const otpCodeSchema = z
  .string({ error: 'Doğrulama kodu zorunlu' })
  .trim()
  .regex(/^\d{6}$/, 'Doğrulama kodu 6 haneli olmalı');

export const verifyEmailByTokenSchema = z.object({
  token: safeString({ min: 1, max: 2048, label: 'Doğrulama tokeni' }),
});

export const verifyEmailByCodeSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const verifyEmailSchema = z.union([
  verifyEmailByTokenSchema,
  verifyEmailByCodeSchema,
]);

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
