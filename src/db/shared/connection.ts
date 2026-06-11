import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../../lib/common/logger';

if (!process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config();
}

const getMongoUri = () =>
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

export const connectDB = async () => {
  try {
    const mongoUri = getMongoUri();

    if (!mongoUri) {
      throw new Error(
        'MongoDB bağlantı adresi bulunamadı. Railway Variables\'a MONGO_URI ekle (veya MONGO_URL / MONGODB_URI / DATABASE_URL).'
      );
    }

    await mongoose.connect(mongoUri);
    logger.info('MongoDB bağlantısı başarılı');
  } catch (error) {
    logger.error({ err: error }, 'Veritabanı bağlantı hatası');
    process.exit(1);
  }
};
