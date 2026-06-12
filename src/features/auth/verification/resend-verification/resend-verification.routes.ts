import { FastifyInstance } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { resendVerificationEmail } from './services/resend-verification.service';
import {
  resendVerificationSchema,
  type ResendVerificationInput,
} from '../../schemas/verification/resend-verification.schema';

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(resendVerificationSchema) }, async (req, reply) => {
    try {
      await resendVerificationEmail((req.body as ResendVerificationInput).email);

      return reply.status(200).send({
        message: 'E-posta kayıtlı ve doğrulanmamışsa doğrulama maili gönderildi',
      });
    } catch (error) {
      return handleAuthRouteError(reply, error, 'E-posta gönderilirken bir hata oluştu');
    }
  });
}
