import { sendMail } from '../../../../lib/auth/mail/send';
import { getFrontendUrl } from '../../../../lib/auth/mail/transporter';
import {
  buildSellerApprovedEmailHtml,
  buildSellerRejectedEmailHtml,
} from './templates';

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
