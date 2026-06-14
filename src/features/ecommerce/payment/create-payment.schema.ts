import { z } from 'zod';
import { uuidSchema } from '@/lib/common/validation/common-schemas';

export const createPaymentSchema = z.object({
  orderId: uuidSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
