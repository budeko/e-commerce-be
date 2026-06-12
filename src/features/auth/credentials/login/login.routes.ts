import { FastifyInstance } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { buildAuthUserFields } from '../../shared/responses/user.response';
import { login } from './services/login.service';
import { loginSchema, type LoginInput } from '../../schemas/credentials/login.schema';

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
      return handleAuthRouteError(reply, error, 'Giriş sırasında bir hata oluştu');
    }
  });
}
