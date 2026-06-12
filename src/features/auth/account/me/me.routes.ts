import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../shared/guard/require-auth';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { getMe } from './services/me.service';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const result = await getMe(req.auth!);
      return reply.status(200).send(result);
    } catch (error) {
      return handleAuthRouteError(reply, error, 'Kullanıcı bilgisi alınırken bir hata oluştu');
    }
  });
}
