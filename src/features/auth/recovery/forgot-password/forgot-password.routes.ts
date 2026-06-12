import { FastifyInstance } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { forgotPassword } from './services/forgot-password.service';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../schemas/recovery/forgot-password.schema';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(forgotPasswordSchema) }, async (req, reply) => {
    try {
      await forgotPassword((req.body as ForgotPasswordInput).email);

      return reply.status(200).send({
        message: 'E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi',
      });
    } catch (error) {
      return handleAuthRouteError(reply, error, 'İşlem sırasında bir hata oluştu');
    }
  });
}
