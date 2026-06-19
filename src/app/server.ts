import { connectDB } from '@/integrations/mongo';
import { buildApp } from '@/app/app';
import { env, validateEnvAtStartup } from '@/config/env';
import { logger } from '@/internal/logging';

export const getPort = (): number => env.port;

export const start = async (): Promise<void> => {
  try {
    validateEnvAtStartup();
    await connectDB();
    logger.info('MongoDB bağlantısı başarılı');

    const app = await buildApp();
    const port = getPort();

    await app.listen({ port, host: '0.0.0.0' });
    logger.info({ port, host: '0.0.0.0' }, 'Sunucu çalışıyor');
  } catch (err) {
    logger.error({ err }, 'Başlatma hatası');
    process.exit(1);
  }
};

if (require.main === module) {
  void start();
}
