import { z } from 'zod';
import { emailSchema } from './email.schema';
import { passwordSchema } from './password.schema';

export const baseSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof baseSchema>;
