export type PaymentConfig = {
  apiKey: string;
  secretKey: string;
  uri: string;
  callbackUrl: string;
};

const IYZICO_SANDBOX_URI = 'https://sandbox-api.iyzipay.com';
const IYZICO_PRODUCTION_URI = 'https://api.iyzipay.com';

const resolveIyzicoUri = (explicitUri: string | undefined, apiKey: string): string => {
  if (explicitUri) {
    return explicitUri;
  }

  return apiKey.startsWith('sandbox-') ? IYZICO_SANDBOX_URI : IYZICO_PRODUCTION_URI;
};

export const getPaymentConfig = (): PaymentConfig => {
  const apiKey = process.env.IYZIPAY_API_KEY?.trim();
  const secretKey = process.env.IYZIPAY_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    throw new Error('IYZIPAY_API_KEY ve IYZIPAY_SECRET_KEY tanımlı olmalı');
  }

  const callbackUrl =
    process.env.IYZIPAY_CALLBACK_URL?.trim() ??
    (process.env.API_BASE_URL
      ? `${process.env.API_BASE_URL.replace(/\/+$/, '')}/payments/callback`
      : undefined);

  if (!callbackUrl) {
    throw new Error('IYZIPAY_CALLBACK_URL veya API_BASE_URL tanımlı olmalı');
  }

  return {
    apiKey,
    secretKey,
    uri: resolveIyzicoUri(process.env.IYZIPAY_URI?.trim(), apiKey),
    callbackUrl,
  };
};
