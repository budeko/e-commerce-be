import { z } from 'zod';
import { ADMIN_ROLES } from '@/db';
import { adminProfileFieldsSchema } from '@/features/auth/admin/profile/admin-profile-fields.schema';
import { emailSchema } from '@/features/auth/core/schemas/email.schema';
import { passwordSchema } from '@/features/auth/core/schemas/password.schema';

export const createAdminSchema = adminProfileFieldsSchema.extend({
  email: emailSchema,
  password: passwordSchema,
  adminRole: z.enum(ADMIN_ROLES, {
    message: 'Admin rolü owner veya helper olmalı',
  }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
