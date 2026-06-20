import { FastifyInstance } from 'fastify';
import { validateBody } from '@/middleware/validation/validate-body';
import { handleRouteError } from '@/internal/common/errors/handle-route-error';
import { registerSchema, type RegisterInput } from '@/features/identity/register/register.schema';
import { register } from '@/features/identity/register/register.service';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(registerSchema) }, async (req, reply) => {
    try {
      const result = await register(req.body as RegisterInput);
      return reply.status(201).send(result);
    } catch (error) {
      return handleRouteError(reply, error, 'Kayıt sırasında bir hata oluştu', {
        duplicateKeyMessage: 'Bu e-posta adresi zaten kayıtlı',
      });
    }
  });
}
