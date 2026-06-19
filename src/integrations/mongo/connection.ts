import mongoose from 'mongoose';
import { env } from '@/config/env';

export const connectDB = async () => {
  try {
    const mongoUri = env.mongoUri;

    if (!mongoUri) {
      throw new Error(
        'MongoDB bağlantı adresi bulunamadı. Railway Variables\'a MONGO_URI ekle (veya MONGO_URL / MONGODB_URI / DATABASE_URL).'
      );
    }

    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Veritabanı bağlantı hatası', error);
    process.exit(1);
  }
};
