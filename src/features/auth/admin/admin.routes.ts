import { FastifyInstance } from 'fastify';
import adminsRoutes from '@/features/auth/admin/admins/admins.routes';
import profileRoutes from '@/features/auth/admin/profile/profile.routes';
import sellersRoutes from '@/features/auth/admin/sellers/sellers.routes';

export default async function (fastify: FastifyInstance) {
  await fastify.register(profileRoutes, { prefix: '/profile' });
  await fastify.register(adminsRoutes, { prefix: '/admins' });
  await fastify.register(sellersRoutes, { prefix: '/sellers' });
}
