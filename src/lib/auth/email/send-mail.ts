import { resend, getFrontendUrl, getMailFrom } from './transporter';
import {
  buildPasswordResetEmailHtml,
  buildSellerApprovedEmailHtml,
  buildSellerRejectedEmailHtml,
  buildVerificationEmailHtml,
} from './templates';
import { createLogger } from '../../common/logger';

const log = createLogger({ module: 'mail' });

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendMail = async ({ to, subject, html }: SendMailInput) => {
  try {
    const { data, error } = await resend.emails.send({
      from: getMailFrom(),
      to: [to],
      subject,
      html,
    });

    if (error) {
      log.error({ err: error, to, subject }, 'Mail gönderilemedi');
      throw new Error(error.message);
    }

    log.info({ to, subject, messageId: data?.id }, 'Mail gönderildi');
  } catch (error) {
    log.error({ err: error, to, subject }, 'Mail gönderilirken hata oluştu');
    throw error;
  }
};

export const sendVerificationEmail = async (to: string, token: string, code: string) => {
  const verifyUrl = `${getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  await sendMail({
    to,
    subject: 'E-posta adresini doğrula',
    html: buildVerificationEmailHtml(verifyUrl, code),
  });
};

export const sendPasswordResetEmail = async (to: string, token: string, code: string) => {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to,
    subject: 'Şifre sıfırlama',
    html: buildPasswordResetEmailHtml(resetUrl, code),
  });
};

export const sendSellerApprovedEmail = async (
  to: string,
  companyName?: string | null
) => {
  const dashboardUrl = `${getFrontendUrl()}/seller`;

  await sendMail({
    to,
    subject: 'Satıcı hesabın onaylandı',
    html: buildSellerApprovedEmailHtml(
      dashboardUrl,
      companyName?.trim() || undefined
    ),
  });
};

export const sendSellerRejectedEmail = async (
  to: string,
  reason: string,
  companyName?: string | null
) => {
  const profileUrl = `${getFrontendUrl()}/profile`;

  await sendMail({
    to,
    subject: 'Satıcı başvurun reddedildi',
    html: buildSellerRejectedEmailHtml(
      profileUrl,
      reason,
      companyName?.trim() || undefined
    ),
  });
};
