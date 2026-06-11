const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; padding: 32px;">
          <tr>
            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

const codeBox = (code: string) => `
  <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">Doğrulama kodun</p>
    <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: ui-monospace, monospace;">${code}</p>
  </div>
`;

const actionButton = (url: string, label: string) => `
  <p style="text-align: center; margin: 28px 0;">
    <a href="${url}" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">${label}</a>
  </p>
`;

const footerNote = (text: string) => `
  <p style="margin: 24px 0 0; font-size: 13px; color: #71717a;">${text}</p>
`;

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const reasonBox = (reason: string) => `
  <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 4px; font-size: 13px; color: #71717a;">Red sebebi</p>
    <p style="margin: 0; font-size: 15px; color: #18181b;">${escapeHtml(reason)}</p>
  </div>
`;

export const buildVerificationEmailHtml = (verifyUrl: string, code: string) =>
  baseLayout(`
    <h1 style="margin: 0 0 16px; font-size: 22px;">E-posta adresini doğrula</h1>
    <p style="margin: 0;">Hesabını oluşturduğun için teşekkürler. E-posta adresini doğrulamak için aşağıdaki kodu kullan veya bağlantıya tıkla.</p>
    ${codeBox(code)}
    ${actionButton(verifyUrl, 'E-postamı doğrula')}
    <p style="margin: 0; font-size: 14px; color: #52525b;">Bağlantı çalışmazsa tarayıcına şunu yapıştır:</p>
    <p style="margin: 8px 0 0; font-size: 13px; word-break: break-all; color: #71717a;">${verifyUrl}</p>
    ${footerNote('Bu kod ve bağlantı 24 saat geçerlidir. Bu işlemi sen yapmadıysan bu e-postayı yok say.')}
  `);

export const buildPasswordResetEmailHtml = (resetUrl: string, code: string) =>
  baseLayout(`
    <h1 style="margin: 0 0 16px; font-size: 22px;">Şifre sıfırlama</h1>
    <p style="margin: 0;">Şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki kodu kullan veya bağlantıya tıkla.</p>
    ${codeBox(code)}
    ${actionButton(resetUrl, 'Şifremi sıfırla')}
    <p style="margin: 0; font-size: 14px; color: #52525b;">Bağlantı çalışmazsa tarayıcına şunu yapıştır:</p>
    <p style="margin: 8px 0 0; font-size: 13px; word-break: break-all; color: #71717a;">${resetUrl}</p>
    ${footerNote('Bu kod ve bağlantı 1 saat geçerlidir. Bu talebi sen yapmadıysan bu e-postayı yok say.')}
  `);

export const buildSellerApprovedEmailHtml = (dashboardUrl: string, companyName?: string) =>
  baseLayout(`
    <h1 style="margin: 0 0 16px; font-size: 22px;">Satıcı hesabın onaylandı</h1>
    <p style="margin: 0;">${companyName ? `<strong>${escapeHtml(companyName)}</strong> satıcı başvurun onaylandı.` : 'Satıcı başvurun onaylandı.'} Artık ürün ekleyebilir ve satış yapabilirsin.</p>
    ${actionButton(dashboardUrl, 'Satıcı paneline git')}
    ${footerNote('Soruların varsa destek ekibimizle iletişime geçebilirsin.')}
  `);

export const buildSellerRejectedEmailHtml = (
  profileUrl: string,
  reason: string,
  companyName?: string
) =>
  baseLayout(`
    <h1 style="margin: 0 0 16px; font-size: 22px;">Satıcı başvurun reddedildi</h1>
    <p style="margin: 0;">${companyName ? `<strong>${escapeHtml(companyName)}</strong> satıcı başvurun incelendi ancak şu an onaylanamadı.` : 'Satıcı başvurun incelendi ancak şu an onaylanamadı.'}</p>
    ${reasonBox(reason)}
    <p style="margin: 0;">Profilindeki eksik veya hatalı bilgileri düzelterek tekrar başvurabilirsin.</p>
    ${actionButton(profileUrl, 'Profilimi güncelle')}
    ${footerNote('Soruların varsa destek ekibimizle iletişime geçebilirsin.')}
  `);
