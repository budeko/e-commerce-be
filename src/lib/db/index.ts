import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI tanımlanmamış! .env dosyanı kontrol et.');
    }

    await mongoose.connect(mongoUri);

    console.log("🚀 MongoDB'ye başarıyla bağlandı!");
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
};
