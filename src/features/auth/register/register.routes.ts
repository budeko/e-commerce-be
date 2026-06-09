import { FastifyInstance, FastifyReply } from 'fastify';
import { validateBody } from '../../../lib/validation/validate-body';
import { baseSchema, type RegisterInput } from './schemas';
import { RegisterError, isDuplicateKeyError } from './register.errors';
import { registerBuyer, registerSeller } from './register.service';

const handleRegisterError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof RegisterError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (isDuplicateKeyError(error)) {
    return reply.status(409).send({ message: 'Bu e-posta adresi zaten kayıtlı' });
  }

  return reply.status(500).send({ message: 'Kayıt sırasında bir hata oluştu' });
};

export default async function (fastify: FastifyInstance) {
  fastify.post(
    '/buyer',
    { preHandler: validateBody(baseSchema) },
    async (req, reply) => {
      try {
        const user = await registerBuyer(req.body as RegisterInput);
        return reply.status(201).send({
          message: 'Alıcı başarıyla oluşturuldu',
          userId: user._id,
        });
      } catch (error) {
        return handleRegisterError(reply, error);
      }
    }
  );

  fastify.post(
    '/seller',
    { preHandler: validateBody(baseSchema) },
    async (req, reply) => {
      try {
        const user = await registerSeller(req.body as RegisterInput);
        return reply.status(201).send({
          message: 'Satıcı başarıyla oluşturuldu',
          userId: user._id,
        });
      } catch (error) {
        return handleRegisterError(reply, error);
      }
    }
  );
}
