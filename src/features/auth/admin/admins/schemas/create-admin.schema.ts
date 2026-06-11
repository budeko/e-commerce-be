import { z } from 'zod';
import { ADMIN_ROLES } from '../../../../../db/auth/admin.model';
import { adminProfileFieldsSchema } from '../../schemas/admin-profile-fields.schema';
import { emailSchema } from '../../../register/schemas/email.schema';
import { passwordSchema } from '../../../register/schemas/password.schema';

export const createAdminSchema = adminProfileFieldsSchema.extend({
  email: emailSchema,
  password: passwordSchema,
  adminRole: z.enum(ADMIN_ROLES, {
    message: 'Admin rolü owner veya helper olmalı',
  }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
