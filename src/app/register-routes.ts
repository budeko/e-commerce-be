import type { FastifyInstance } from 'fastify';
import authRoutes from '@/features/auth/auth.routes';
import ecommerceRoutes from '@/features/ecommerce/ecommerce.routes';

export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(ecommerceRoutes);
};
