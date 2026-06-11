import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../../../../lib/auth/guard/require-auth';
import { requireEmailVerified } from '../../../../lib/auth/guard/require-email-verified';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { AuthError } from '../../shared/errors';
import { changePassword } from './services/change-password.service';
import { changePasswordSchema, type ChangePasswordInput } from '../../schemas/credentials/change-password.schema';

const handleChangePasswordError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Şifre değiştirilirken bir hata oluştu' });
};

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
        return handleChangePasswordError(reply, error);
      }
    }
  );
}
