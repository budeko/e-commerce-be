import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { buildAuthUserFields } from '../../shared/responses/user.response';
import { AuthError } from '../../shared/errors';
import { verifyEmail } from './services/verify-email.service';
import { verifyEmailSchema, type VerifyEmailInput } from '../../schemas/verification/verify-email.schema';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'E-posta doğrulanırken bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(verifyEmailSchema) }, async (req, reply) => {
    try {
      const { user, token } = await verifyEmail(req.body as VerifyEmailInput);
      const statusFields = await buildAuthUserFields(user);

      return reply.status(200).send({
        message: 'E-posta doğrulandı',
        ...statusFields,
        isEmailVerified: user.isEmailVerified,
        token,
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
