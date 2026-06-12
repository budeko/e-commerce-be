import { z } from 'zod';
import { emailSchema } from '@/features/auth/schemas/fields/email.schema';

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
