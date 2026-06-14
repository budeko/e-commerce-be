import { z } from 'zod';
import { adminProfileFieldsSchema } from '@/features/auth/admin/profile/admin-profile-fields.schema';
import { emailSchema } from '@/features/auth/core/schemas/email.schema';
import { passwordSchema } from '@/features/auth/core/schemas/password.schema';
import { uuidSchema } from '@/lib/common/validation/common-schemas';

export const createAdminSchema = adminProfileFieldsSchema.extend({
  email: emailSchema,
  password: passwordSchema,
  roleId: uuidSchema,
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
