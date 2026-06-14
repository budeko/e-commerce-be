import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/core/guard/require-email-verified';
import { validateBody } from '@/lib/common/http/validate-body';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { changePassword } from '@/features/auth/credentials/change-password/change-password.service';
import { changePasswordSchema, type ChangePasswordInput } from '@/features/auth/credentials/change-password/change-password.schema';

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
        return handleRouteError(reply, error, 'Şifre değiştirilirken bir hata oluştu');
      }
    }
  );
}
