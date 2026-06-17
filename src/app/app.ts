import fastify, { FastifyInstance } from 'fastify';
import { env } from '@/config/env';
import { registerRoutes } from '@/app/register-routes';
import { registerCors } from '@/plugins/cors';
import { registerErrorHandler } from '@/plugins/error-handler';
import { registerFormBody } from '@/plugins/formbody';
import { registerRateLimit } from '@/plugins/rate-limit';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: {
      level: env.logLevel,
    },
  });

  registerErrorHandler(app);
  await registerCors(app);
  await registerFormBody(app);
  await registerRateLimit(app);
  await registerRoutes(app);

  return app;
};
