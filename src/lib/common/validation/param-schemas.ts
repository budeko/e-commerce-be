import { z } from 'zod';
import { uuidSchema } from '@/lib/common/validation/common-schemas';

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});
