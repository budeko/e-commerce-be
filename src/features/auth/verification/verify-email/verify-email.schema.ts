import { z } from 'zod';
import { safeString } from '@/internal/validation/common-schemas';
import { emailSchema } from '@/features/auth/core/schemas/email.schema';
import { otpCodeSchema } from '@/features/auth/core/schemas/otp-code.schema';

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
