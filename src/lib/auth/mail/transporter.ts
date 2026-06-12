import { Resend } from 'resend';

const getResendApiKey = () => {
  const apiKey = process.env.SMTP_PASS;

  if (!apiKey) {
    throw new Error('SMTP_PASS (Resend API anahtarı) tanımlanmamış');
  }

  return apiKey;
};

let resendClient: Resend | null = null;

export const getResend = (): Resend => {
  if (!resendClient) {
    resendClient = new Resend(getResendApiKey());
  }

  return resendClient;
};

export const getMailFrom = () => {
  const from = process.env.SMTP_FROM;

  if (!from) {
    throw new Error('SMTP_FROM tanımlanmamış');
  }

  return from;
};

export const getFrontendUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL tanımlanmamış');
  }

  return frontendUrl;
};
