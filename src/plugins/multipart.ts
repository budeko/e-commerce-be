import multipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';
import { MULTIPART_LIMITS } from '@/config/constants';

export const registerMultipart = async (app: FastifyInstance): Promise<void> => {
  await app.register(multipart, {
    limits: {
      fileSize: MULTIPART_LIMITS.fileSize,
      files: MULTIPART_LIMITS.files,
    },
  });
};
