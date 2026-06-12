import { FastifyReply } from 'fastify';
import { HttpError } from '../../../lib/common/errors';
import { isDuplicateKeyError } from './errors';

type HandleAuthRouteErrorOptions = {
  duplicateKeyMessage?: string;
};

export const handleAuthRouteError = (
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string,
  options?: HandleAuthRouteErrorOptions
) => {
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (options?.duplicateKeyMessage && isDuplicateKeyError(error)) {
    return reply.status(409).send({ message: options.duplicateKeyMessage });
  }

  return reply.status(500).send({ message: fallbackMessage });
};
