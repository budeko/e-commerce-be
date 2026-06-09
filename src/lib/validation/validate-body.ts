import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema } from 'zod';

export const validateBody = <T extends ZodSchema>(schema: T) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Geçersiz istek verisi',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    request.body = parsed.data;
  };
};
