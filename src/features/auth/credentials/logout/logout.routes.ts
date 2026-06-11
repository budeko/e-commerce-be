import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../../../../lib/auth/guard/require-auth';
import { AuthError } from '../../shared/errors';
import { logout, logoutAllSessions } from './services/logout.service';

const handleLogoutError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Çıkış sırasında bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: requireAuth }, async (req, reply) => {
    try {
      await logout(req.authToken!);

      return reply.status(200).send({
        message: 'Çıkış başarılı',
      });
    } catch (error) {
      return handleLogoutError(reply, error);
    }
  });

  fastify.post('/all', { preHandler: requireAuth }, async (req, reply) => {
    try {
      await logoutAllSessions(req.auth!.userId);

      return reply.status(200).send({
        message: 'Tüm oturumlar sonlandırıldı',
      });
    } catch (error) {
      return handleLogoutError(reply, error);
    }
  });
}
