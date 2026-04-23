import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, emailSender } from '../../calculator/config/email.js';

const createTransporter = () => createTransport(getEmailConfig());

/**
 * @param {{ to: string; filename: string; buffer: Buffer }} params
 */
export async function sendScanReportEmail({ to, filename, buffer }) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${emailSender.name}" <${emailSender.email}>`,
    to,
    subject: 'Scan report (XLSX)',
    text: 'Your scan report is attached as an Excel file.',
    html: '<p>Your scan report is attached as an Excel file.</p>',
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
