export const DEFAULT_PORT = 8080;

export const DEFAULT_LOG_LEVEL = 'info' as const;

export const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

export const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
] as const;

export const SUPABASE_DEFAULT_BUCKET = 'seller-documents';

export const IYZICO_SANDBOX_URI = 'https://sandbox-api.iyzipay.com';

export const IYZICO_PRODUCTION_URI = 'https://api.iyzipay.com';

export const GLOBAL_RATE_LIMIT = {
  max: 100,
  timeWindow: '1 minute' as const,
};

export const AUTH_PUBLIC_RATE_LIMIT = {
  max: 10,
  timeWindow: '15 minutes' as const,
};

export const AUTH_ADMIN_RATE_LIMIT = {
  max: 60,
  timeWindow: '1 minute' as const,
};

export const AUTH_SELLER_RATE_LIMIT = {
  max: 60,
  timeWindow: '1 minute' as const,
};

/** Global multipart — profil belgeleri (5MB) ve ürün görselleri (10 dosya) üst sınırı. */
export const MULTIPART_LIMITS = {
  fileSize: 5 * 1024 * 1024,
  files: 10,
} as const;

export const CORS_ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
] as const;
