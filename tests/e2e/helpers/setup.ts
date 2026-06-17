import mongoose from 'mongoose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app/app';
import { ensureE2EEnv, getE2EMongoUri } from './env';

export type E2EContext = {
  app: FastifyInstance;
};

export const createE2EContext = async (): Promise<E2EContext> => {
  ensureE2EEnv();

  const mongoUri = getE2EMongoUri();

  if (!mongoUri) {
    throw new Error('E2E_MONGO_URI veya MONGO_URI tanımlı olmalı');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const app = await buildApp();

  return { app };
};

export const destroyE2EContext = async (app: FastifyInstance): Promise<void> => {
  await app.close();

  if (mongoose.connection.readyState !== 0 && mongoose.connection.db) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
};
