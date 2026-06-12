import { FastifyInstance } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { resetPassword } from './services/reset-password.service';
import { resetPasswordSchema, type ResetPasswordInput } from '../../schemas/recovery/reset-password.schema';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(resetPasswordSchema) }, async (req, reply) => {
    try {
      await resetPassword(req.body as ResetPasswordInput);

      return reply.status(200).send({
        message: 'Şifre başarıyla sıfırlandı',
      });
    } catch (error) {
      return handleAuthRouteError(reply, error, 'Şifre sıfırlanırken bir hata oluştu');
    }
  });
}
