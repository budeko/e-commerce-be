import { FastifyInstance } from 'fastify';
import { validateBody } from '@/lib/common/http/validate-body';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { buildAuthUserFields } from '@/features/auth/shared/responses/user.response';
import { login } from '@/features/auth/credentials/login/services/login.service';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/credentials/login.schema';

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
      return handleRouteError(reply, error, 'Giriş sırasında bir hata oluştu');
    }
  });
}
