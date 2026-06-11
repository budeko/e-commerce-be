import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { registerSchema, type RegisterInput } from '../../schemas/credentials/register.schema';
import { AuthError, isDuplicateKeyError } from '../../shared/errors';
import { buildAuthUserFields } from '../../shared/responses/user.response';
import { register } from './services/register.service';

const handleAuthError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (isDuplicateKeyError(error)) {
    return reply.status(409).send({ message: 'Bu e-posta adresi zaten kayıtlı' });
  }

  return reply.status(500).send({ message: 'Kayıt sırasında bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(registerSchema) }, async (req, reply) => {
    try {
      const { user } = await register(req.body as RegisterInput);
      const statusFields = await buildAuthUserFields(user);

      return reply.status(201).send({
        message: 'Kayıt başarılı. E-posta adresini doğrula.',
        ...statusFields,
        isEmailVerified: user.isEmailVerified,
      });
    } catch (error) {
      return handleAuthError(reply, error);
    }
  });
}
