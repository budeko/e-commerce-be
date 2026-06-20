import dotenv from 'dotenv';

// Test dosyası import edilirken isE2EEnabled() çalışır — .env burada yüklenmeli.
dotenv.config();

/** E2E koşusu için minimum env — gerçek MongoDB gerekir. */
export const ensureE2EEnv = (): void => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'e2e-test-jwt-secret-with-32-chars-minimum';
  process.env.PLATFORM_COMMISSION_RATE ??= '0.10';
  process.env.FRONTEND_URL ??= 'http://localhost:3000';
  process.env.API_BASE_URL ??= 'http://127.0.0.1:8080';
  process.env.SMTP_PASS ??= 're_e2e_fake_key';
  process.env.SMTP_FROM ??= 'e2e@test.local';
  process.env.IYZIPAY_API_KEY ??= 'sandbox-e2e-key';
  process.env.IYZIPAY_SECRET_KEY ??= 'sandbox-e2e-secret';
};

export const getE2EMongoUri = (): string | undefined =>
  process.env.E2E_MONGO_URI?.trim() || process.env.MONGO_URI?.trim();

export const isE2EEnabled = (): boolean => Boolean(getE2EMongoUri());
