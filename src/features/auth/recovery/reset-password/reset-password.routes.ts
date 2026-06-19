import { FastifyInstance } from 'fastify';
import { validateBody } from '@/plugins/http/validate-body';
import { handleRouteError } from '@/plugins/http/handle-route-error';
import { resetPassword } from '@/features/auth/recovery/reset-password/reset-password.service';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/recovery/reset-password/reset-password.schema';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(resetPasswordSchema) }, async (req, reply) => {
    try {
      await resetPassword(req.body as ResetPasswordInput);

      return reply.status(200).send({
        message: 'Şifre başarıyla sıfırlandı',
      });
    } catch (error) {
      return handleRouteError(reply, error, 'Şifre sıfırlanırken bir hata oluştu');
    }
  });
}
