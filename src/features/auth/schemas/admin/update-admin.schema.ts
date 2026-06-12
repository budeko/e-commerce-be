import { z } from 'zod';
import { ADMIN_ROLES } from '@/db';

export const updateAdminSchema = z.object({
  adminRole: z.enum(ADMIN_ROLES, { error: 'Geçerli bir admin rolü seçin' }),
});

export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
