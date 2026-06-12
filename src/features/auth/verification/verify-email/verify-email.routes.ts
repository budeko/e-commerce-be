import { FastifyInstance } from 'fastify';
import { validateBody } from '@/lib/common/http/validate-body';
import { handleAuthRouteError } from '@/features/auth/shared/handle-route-error';
import { buildAuthUserFields } from '@/features/auth/shared/responses/user.response';
import { verifyEmail } from '@/features/auth/verification/verify-email/services/verify-email.service';
import { verifyEmailSchema, type VerifyEmailInput } from '@/features/auth/schemas/verification/verify-email.schema';

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
      return handleAuthRouteError(reply, error, 'E-posta doğrulanırken bir hata oluştu');
    }
  });
}
