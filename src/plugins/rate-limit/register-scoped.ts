import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import type { RateLimitPreset } from '@/plugins/rate-limit/presets';

export const registerScopedRateLimit = async (
  app: FastifyInstance,
  preset: RateLimitPreset
): Promise<void> => {
  await app.register(rateLimit, preset);
};
