import { sendScanReportEmail } from '../services/sendScanReportEmail.js';

const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const MIN_ATTACHMENT_BYTES = 64;

function sanitizeFilename(name) {
  const raw = typeof name === 'string' && name.trim() ? name.trim() : 'scans_report.xlsx';
  const base = raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.toLowerCase().endsWith('.xlsx') ? base : `${base}.xlsx`;
}

/**
 * POST /api/scanner/send-report
 * Body: { to, attachmentBase64, filename? }
 */
export const sendScanReport = async (req, res) => {
  try {
    const { to, attachmentBase64, filename } = req.body || {};

    if (!to || !attachmentBase64) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, attachmentBase64',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(to).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient email',
      });
    }

    let buffer;
    try {
      buffer = Buffer.from(String(attachmentBase64), 'base64');
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid attachment encoding',
      });
    }

    if (!buffer.length || buffer.length < MIN_ATTACHMENT_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'Attachment is missing or too small',
      });
    }

    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'Attachment too large',
      });
    }

    const safeName = sanitizeFilename(filename);

    await sendScanReportEmail({
      to: String(to).trim(),
      filename: safeName,
      buffer,
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent',
    });
  } catch (error) {
    console.error('sendScanReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
