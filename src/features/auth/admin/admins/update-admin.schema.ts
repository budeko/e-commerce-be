import { z } from 'zod';
import { uuidSchema } from '@/lib/common/validation/common-schemas';

export const updateAdminSchema = z.object({
  roleId: uuidSchema,
});

export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
