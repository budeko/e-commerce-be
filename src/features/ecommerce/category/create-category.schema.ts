import { z } from 'zod';
import { safeString } from '@/lib/common/validation/common-schemas';
import { slugSchema } from '@/lib/common/validation/slug-schema';

const categoryNameSchema = safeString({
  min: 1,
  max: 200,
  label: 'Kategori adı',
});

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  slug: slugSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
