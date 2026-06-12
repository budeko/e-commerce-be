import { z } from 'zod';
import { emailSchema } from '@/features/auth/schemas/fields/email.schema';

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
