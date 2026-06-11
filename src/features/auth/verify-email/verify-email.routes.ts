import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../lib/common/middleware/validate-body';
import { buildAuthUserFields } from '../../../lib/auth/auth-user-response';
import { RegisterError } from '../register/register.errors';
import { verifyEmail } from './verify-email.service';
import { verifyEmailSchema, type VerifyEmailInput } from './schemas/verify-email.schema';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof RegisterError) {
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
