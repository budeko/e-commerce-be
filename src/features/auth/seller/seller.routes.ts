import { FastifyInstance } from 'fastify';
import membersRoutes from '@/features/auth/seller/members/members.routes';
import rolesRoutes from '@/features/auth/seller/roles/roles.routes';

export default async function (fastify: FastifyInstance) {
  await fastify.register(membersRoutes, { prefix: '/members' });
  await fastify.register(rolesRoutes, { prefix: '/roles' });
}
