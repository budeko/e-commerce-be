import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { handleRouteError } from '@/plugins/http/handle-route-error';
import { getMe } from '@/features/auth/account/me/me.service';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const result = await getMe(req.auth!);
      return reply.status(200).send(result);
    } catch (error) {
      return handleRouteError(reply, error, 'Kullanıcı bilgisi alınırken bir hata oluştu');
    }
  });
}
