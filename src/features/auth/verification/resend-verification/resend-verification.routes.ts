import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../../lib/common/http/validate-body';
import { AuthError } from '../../shared/errors';
import { resendVerificationEmail } from './services/resend-verification.service';
import {
  resendVerificationSchema,
  type ResendVerificationInput,
} from '../../schemas/verification/resend-verification.schema';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'E-posta gönderilirken bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post('/', { preHandler: validateBody(resendVerificationSchema) }, async (req, reply) => {
    try {
      await resendVerificationEmail((req.body as ResendVerificationInput).email);

      return reply.status(200).send({
        message: 'E-posta kayıtlı ve doğrulanmamışsa doğrulama maili gönderildi',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
