import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, emailSender } from '../../calculator/config/email.js';

const createTransporter = () => createTransport(getEmailConfig());

const SENDER_NAME = 'GPS Scanner';
const TITLE = 'რეპორტი სკანერის აპიდან';

function formatDate(date) {
  return new Intl.DateTimeFormat('ka-GE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Tbilisi',
  }).format(date);
}

function generateHTML({ filename, sentAt }) {
  return `<!DOCTYPE html>
<html lang="ka">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${TITLE}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f3f0;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#e53935;padding:28px 32px;text-align:center;">
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:700;">${SENDER_NAME}</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.35;color:#ffffff;font-weight:700;">${TITLE}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fde7e8;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:12px;color:#8b8b8b;text-transform:uppercase;letter-spacing:0.06em;">ფაილი</div>
                      <div style="margin-top:4px;font-size:15px;font-weight:700;color:#c62828;word-break:break-all;">📎 ${filename}</div>
                      <div style="margin-top:12px;font-size:12px;color:#8b8b8b;text-transform:uppercase;letter-spacing:0.06em;">გაგზავნის დრო</div>
                      <div style="margin-top:4px;font-size:15px;color:#1a1a1a;">${formatDate(sentAt)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * @param {{ to: string; filename: string; buffer: Buffer }} params
 */
export async function sendScanReportEmail({ to, filename, buffer }) {
  const transporter = createTransporter();
  const sentAt = new Date();

  const mailOptions = {
    from: `"${SENDER_NAME}" <${emailSender.email}>`,
    to,
    subject: `${TITLE} — ${filename}`,
    text: `${TITLE}\n\nფაილი: ${filename}\nგაგზავნის დრო: ${formatDate(sentAt)}`,
    html: generateHTML({ filename, sentAt }),
    attachments: [
      {
        filename,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Scan report email sent:', info.messageId, 'to', to);
  return info;
}
