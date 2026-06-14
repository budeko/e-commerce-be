import { z } from 'zod';

export const createOrderSchema = z.object({});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
