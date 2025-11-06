import pkg from 'nodemailer';
const { createTransport } = pkg;
import { getEmailConfig, getAdminEmail, emailSender } from '../config/email.js';

/**
 * Create nodemailer transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  const config = getEmailConfig();
  console.log('Creating transporter with config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    hasPass: !!config.auth.pass
  });
  return createTransport(config);
};

/**
 * Translation maps for email content
 */
const translations = {
  en: {
    title: 'New Calculator Submission',
    printerType: 'Printer Type',
    brand: 'Brand',
    jobType: 'Job Type',
    contactMethod: 'Contact Method',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    date: 'Date Submitted',
    footer: 'Automatic notification from Calculator',
    company: 'Georgian Polygraph Services'
  },
  ka: {
    title: 'ახალი განაცხადი კალკულატორიდან',
    printerType: 'პრინტერის ტიპი',
    brand: 'ბრენდი',
    jobType: 'სამუშაოს ტიპი',
    contactMethod: 'კონტაქტის მეთოდი',
    name: 'სახელი',
    phone: 'ტელეფონი',
    email: 'ელ. ფოსტა',
    date: 'გაგზავნის თარიღი',
    footer: 'ავტომატური შეტყობინება საიტის კალკულატორიდან',
    company: 'ჯორჯიან პოლიგრაფ სერვისის'
  }
};

/**
 * Generate HTML email template
 * @param {Object} data - Email data
 * @returns {String} HTML string
 */
const generateEmailHTML = (data) => {
  const t = translations[data.language] || translations.en;

  return `
    <!DOCTYPE html>
    <html lang="${data.language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
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
          background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }
        .email-content { 
          padding: 30px;
        }
        .field { 
          margin-bottom: 20px; 
          padding: 20px; 
          background: #f8f9fa; 
          border-radius: 8px;
          border-left: 4px solid #2196F3;
          transition: transform 0.2s;
        }
        .field:hover {
          transform: translateX(2px);
        }
        .field.highlight {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(129, 199, 132, 0.1));
          border-left-color: #4CAF50;
        }
        .label { 
          font-weight: 600; 
          color: #2196F3; 
          margin-bottom: 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field.highlight .label {
          color: #4CAF50;
        }
        .value { 
          color: #333; 
          font-size: 18px;
          font-weight: 500;
        }
        .field.highlight .value {
          color: #2e7d32;
          font-size: 20px;
          font-weight: 600;
        }
        .email-footer { 
          text-align: center; 
          padding: 25px;
          background: #f8f9fa;
          color: #666; 
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
        }
        .email-footer strong {
          color: #333;
          display: block;
          margin-bottom: 5px;
          font-size: 16px;
        }
        .metadata {
          margin-top: 20px;
          padding: 15px;
          background: #e3f2fd;
          border-radius: 8px;
          font-size: 12px;
          color: #1565c0;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .email-header {
            padding: 30px 20px;
          }
          .email-header h1 {
            font-size: 24px;
          }
          .email-content {
            padding: 20px;
          }
          .field {
            padding: 15px;
          }
          .value {
            font-size: 16px;
          }
          .field.highlight .value {
            font-size: 18px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <span class="icon">📋</span>
          <h1>${t.title}</h1>
        </div>
        <div class="email-content">
          <div class="field">
            <div class="label">📦 ${t.printerType}</div>
            <div class="value">${data.printer_type}</div>
          </div>
          <div class="field">
            <div class="label">🏢 ${t.brand}</div>
            <div class="value">${data.brand}</div>
          </div>
          <div class="field">
            <div class="label">💼 ${t.jobType}</div>
            <div class="value">${data.job_type}</div>
          </div>
          <div class="field">
            <div class="label">📞 ${t.contactMethod}</div>
            <div class="value">${data.contact_method}</div>
          </div>
          <div class="field highlight">
            <div class="label">👤 ${t.name}</div>
            <div class="value">${data.name}</div>
          </div>
          <div class="field highlight">
            <div class="label">📱 ${t.phone}</div>
            <div class="value">${data.phone}</div>
          </div>
          <div class="field highlight">
            <div class="label">✉️ ${t.email}</div>
            <div class="value">${data.email}</div>
          </div>
          <div class="field">
            <div class="label">📅 ${t.date}</div>
            <div class="value">${data.submitted_at}</div>
          </div>
          ${data.ip || data.userAgent ? `
          <div class="metadata">
            <strong>📍 Metadata</strong>
            ${data.ip ? `<div>IP: ${data.ip}</div>` : ''}
            ${data.userAgent ? `<div>User Agent: ${data.userAgent}</div>` : ''}
          </div>
          ` : ''}
        </div>
        <div class="email-footer">
          <strong>${t.company}</strong>
          <p>${t.footer}</p>
          <p style="margin-top: 10px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Georgian Polygraph Services. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text email
 * @param {Object} data - Email data
 * @returns {String} Plain text string
 */
const generatePlainText = (data) => {
  const t = translations[data.language] || translations.en;
  
  return `
${t.title}
${'='.repeat(50)}

${t.printerType}: ${data.printer_type}
${t.brand}: ${data.brand}
${t.jobType}: ${data.job_type}
${t.contactMethod}: ${data.contact_method}

${t.name}: ${data.name}
${t.phone}: ${data.phone}
${t.email}: ${data.email}

${t.date}: ${data.submitted_at}

${'='.repeat(50)}
${t.company}
${t.footer}
  `.trim();
};

/**
 * Send calculator submission email
 * @param {Object} data - Email data
 * @returns {Promise} Email sending promise
 */
export const sendCalculatorEmail = async (data) => {
  const transporter = createTransporter();
  const config = getEmailConfig();
  
  // Debug: verify transporter configuration
  console.log('Email Config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass?.length
  });
  
  const mailOptions = {
    from: `"${emailSender.name}" <${emailSender.email}>`,
    to: getAdminEmail(),
    subject: `Новая заявка: ${data.printer_type} - ${data.brand}`,
    html: generateEmailHTML(data),
    text: generatePlainText(data),
    replyTo: data.email ? `"${data.name}" <${data.email}>` : undefined
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

/**
 * Verify email configuration
 * @returns {Promise<Boolean>} True if configuration is valid
 */
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    return false;
  }
};

