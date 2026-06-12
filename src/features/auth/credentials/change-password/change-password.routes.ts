import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../shared/guard/require-auth';
import { requireEmailVerified } from '../../shared/guard/require-email-verified';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { changePassword } from './services/change-password.service';
import { changePasswordSchema, type ChangePasswordInput } from '../../schemas/credentials/change-password.schema';

export default async function (fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireEmailVerified, validateBody(changePasswordSchema)] },
    async (req, reply) => {
      try {
        await changePassword(req.auth!, req.body as ChangePasswordInput);

        return reply.status(200).send({
          message: 'Şifre başarıyla değiştirildi',
        });
      } catch (error) {
        return handleAuthRouteError(reply, error, 'Şifre değiştirilirken bir hata oluştu');
      }
    }
  );
}
