import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { AuthError } from '../../shared/errors';
import { resetPassword } from './services/reset-password.service';
import { resetPasswordSchema, type ResetPasswordInput } from '../../schemas/recovery/reset-password.schema';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Şifre sıfırlanırken bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(resetPasswordSchema) }, async (req, reply) => {
    try {
      await resetPassword(req.body as ResetPasswordInput);

      return reply.status(200).send({
        message: 'Şifre başarıyla sıfırlandı',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
