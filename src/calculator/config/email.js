/**
 * Email delivery is temporarily switched off — notifications go to Telegram.
 * Set EMAIL_ENABLED=true to send emails via SMTP again.
 */
export const isEmailEnabled = () => process.env.EMAIL_ENABLED === 'true';

/**
 * Email configuration for nodemailer
 * Function to get config at runtime (after .env is loaded)
 */
export const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT) || 587;
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  };
};

// Legacy export for backwards compatibility
export const emailConfig = getEmailConfig();

/**
 * Admin email configuration
 * Function to get admin email at runtime (after .env is loaded)
 */
export const getAdminEmail = () => {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error('ADMIN_EMAIL is not configured in .env file!');
  }
  return email;
};

// Legacy export for backwards compatibility
export const adminEmail = process.env.ADMIN_EMAIL;

/**
 * Email sender configuration
 */
export const emailSender = {
  name: 'GPS Calculator',
  email: process.env.SMTP_USER
};

