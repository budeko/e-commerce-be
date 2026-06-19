import { FastifyInstance } from 'fastify';
import adminsRoutes from '@/features/admin/admins/admins.routes';
import profileRoutes from '@/features/admin/profile/profile.routes';
import rolesRoutes from '@/features/admin/roles/roles.routes';
import sellersRoutes from '@/features/admin/sellers/sellers.routes';

export default async function adminRoutes(fastify: FastifyInstance) {
  await fastify.register(profileRoutes, { prefix: '/profile' });
  await fastify.register(adminsRoutes, { prefix: '/admins' });
  await fastify.register(rolesRoutes, { prefix: '/roles' });
  await fastify.register(sellersRoutes, { prefix: '/sellers' });
}
