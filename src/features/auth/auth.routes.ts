import { FastifyInstance } from 'fastify';
import registerRoutes from './register/register.routes';
import loginRoutes from './login/login.routes';

export default async function (fastify: FastifyInstance) {
  await fastify.register(registerRoutes, { prefix: '/register' });
  await fastify.register(loginRoutes, { prefix: '/login' });
}
