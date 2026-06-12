import { z } from 'zod';
import { objectIdSchema } from '@/lib/common/validation/common-schemas';

export const userIdParamSchema = z.object({
  userId: objectIdSchema,
});
