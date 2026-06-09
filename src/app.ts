import fastify from 'fastify';
import { connectDB } from './lib/db';
import authRoutes from './features/auth/auth.routes';

const app = fastify();

const start = async () => {
  try {
    await connectDB();
    console.log('✅ Veritabanı bağlantısı başarılı!');

    await app.register(authRoutes, { prefix: '/auth' });

    await app.listen({ port: 3000 });
    console.log('🚀 Sunucu http://localhost:3000 adresinde çalışıyor');
  } catch (err) {
    console.error('❌ Başlatma hatası:', err);
    process.exit(1);
  }
};

start();
