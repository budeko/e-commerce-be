import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/shared/guard/require-auth';
import { handleAuthRouteError } from '@/features/auth/shared/handle-route-error';
import { getMe } from '@/features/auth/account/me/services/me.service';

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
