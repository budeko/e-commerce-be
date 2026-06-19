import { FastifyInstance } from 'fastify';
import membersRoutes from '@/features/sellers/members/members.routes';
import rolesRoutes from '@/features/sellers/roles/roles.routes';

export default async function sellersRoutes(fastify: FastifyInstance) {
  await fastify.register(membersRoutes, { prefix: '/members' });
  await fastify.register(rolesRoutes, { prefix: '/roles' });
}
