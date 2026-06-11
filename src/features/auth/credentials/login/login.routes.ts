import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { AuthError } from '../../shared/errors';
import { buildAuthUserFields } from '../../shared/responses/user.response';
import { login } from './services/login.service';
import { loginSchema, type LoginInput } from '../../schemas/credentials/login.schema';

const handleLoginError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Giriş sırasında bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(loginSchema) }, async (req, reply) => {
    try {
      const { user, token } = await login(req.body as LoginInput);
      const statusFields = await buildAuthUserFields(user);

      return reply.status(200).send({
        message: 'Giriş başarılı',
        ...statusFields,
        token,
      });
    } catch (error) {
      return handleLoginError(reply, error);
    }
  });
}
