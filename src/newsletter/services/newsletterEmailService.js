import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, emailSender } from '../../calculator/config/email.js';

const createTransporter = () => createTransport(getEmailConfig());

const typeLabels = {
  article: { en: '📰 News', ka: '📰 სიახლე', icon: '📰' },
  product: { en: '🆕 New Product', ka: '🆕 ახალი პროდუქტი', icon: '🆕' },
};

const generateHTML = ({ type, title, description, url, unsubscribeUrl }) => {
  const label = typeLabels[type] || typeLabels.article;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .email-header {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(239, 68, 68, 0.85));
          color: white;
          padding: 36px 30px;
          text-align: center;
        }
        .email-header .badge {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255,255,255,0.2);
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 14px;
        }
        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .email-content { padding: 30px; }
        .email-content p { color: #444; font-size: 16px; margin-bottom: 24px; white-space: pre-line; }
        .cta-button {
          display: inline-block;
          background: #dc2626;
          color: #fff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
        }
        .email-footer {
          text-align: center;
          padding: 22px;
          background: #f8f9fa;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }
        .email-footer a { color: #888; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <span class="badge">${label.icon} ${label.en} / ${label.ka}</span>
          <h1>${title}</h1>
        </div>
        <div class="email-content">
          ${description ? `<p>${description}</p>` : ''}
          ${url ? `<a class="cta-button" href="${url}">Смотреть на сайте / ნახეთ საიტზე →</a>` : ''}
        </div>
        <div class="email-footer">
          <strong>Georgian Polygraph Services</strong>
          <p style="margin-top: 6px;">
            Вы получили это письмо, потому что подписались на новости на нашем сайте.
          </p>
          <p style="margin-top: 6px;">
            <a href="${unsubscribeUrl}">Отписаться от рассылки</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a broadcast email to a list of subscribers individually (so each gets
 * a personalized unsubscribe link), throttled to respect SMTP rate limits.
 * @returns {Promise<{sent: number, failed: number}>}
 */
export const sendNewsletterBroadcast = async ({ type, title, description, url, emails, unsubscribeBaseUrl }) => {
  if (!emails.length) return { sent: 0, failed: 0 };

  const transporter = createTransporter();
  const subjectLabel = (typeLabels[type] || typeLabels.article).en;

  let sent = 0;
  let failed = 0;

  for (const batch of chunk(emails, 5)) {
    const results = await Promise.allSettled(
      batch.map((email) =>
        transporter.sendMail({
          from: `"${emailSender.name}" <${emailSender.email}>`,
          to: email,
          subject: `${subjectLabel}: ${title}`,
          html: generateHTML({
            type,
            title,
            description,
            url,
            unsubscribeUrl: `${unsubscribeBaseUrl}?email=${encodeURIComponent(email)}`,
          }),
        })
      )
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') sent += 1;
      else {
        failed += 1;
        console.error('Newsletter send failed:', result.reason?.message);
      }
    });

    await sleep(400);
  }

  return { sent, failed };
};
