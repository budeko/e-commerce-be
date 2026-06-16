import { z } from 'zod';
import { safeUrlSchema } from '@/lib/common/validation/common-schemas';

export const deleteProductImageSchema = z.object({
  url: safeUrlSchema,
});

export type DeleteProductImageInput = z.infer<typeof deleteProductImageSchema>;
