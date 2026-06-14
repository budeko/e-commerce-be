import { z } from 'zod';
import { emailSchema } from '@/features/auth/core/schemas/email.schema';

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
