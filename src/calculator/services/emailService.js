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
    deviceType: 'Device Type',
    brand: 'Brand',
    jobType: 'Job Type',
    contactMethod: 'Contact Method',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    date: 'Date Submitted',
    footer: 'Automatic notification from Calculator',
    company: 'Georgian Polygraph Services',
    selectionChain: 'Selection Chain'
  },
  ka: {
    title: 'ახალი განაცხადი კალკულატორიდან',
    deviceType: 'მოწყობილობის ტიპი',
    brand: 'ბრენდი',
    jobType: 'სამუშაოს ტიპი',
    contactMethod: 'კონტაქტის მეთოდი',
    name: 'სახელი',
    phone: 'ტელეფონი',
    email: 'ელ. ფოსტა',
    date: 'გაგზავნის თარიღი',
    footer: 'ავტომატური შეტყობინება საიტის კალკულატორიდან',
    company: 'ჯორჯიან პოლიგრაფ სერვისის',
    selectionChain: 'არჩევის ჯაჭვი'
  }
};

/**
 * Device type labels in both languages
 */
const deviceTypeLabels = {
  printer: { en: 'Printer', ka: 'პრინტერი' },
  cutter: { en: 'Cutter', ka: 'საჭრელი' },
  binder: { en: 'Binder', ka: 'ამკინძავი' },
  laminator: { en: 'Laminator', ka: 'ლამინატორი' }
};

/**
 * Job type labels in both languages
 */
const jobTypeLabels = {
  advertising: { en: 'Advertising', ka: 'სარეკლამო' },
  photoStudio: { en: 'Photo Studio', ka: 'ფოტო სტუდია' },
  typography: { en: 'Typography', ka: 'სტამბა' }
};

/**
 * Brand labels (brands remain identical in both languages)
 */
const brandLabels = {
  develop: { en: 'Develop', ka: 'Develop' },
  nocai: { en: 'Nocai', ka: 'Nocai' },
  audley: { en: 'Audley', ka: 'Audley' },
  koenigBauer: { en: 'Koenig & Bauer', ka: 'Koenig & Bauer' },
  iecho: { en: 'IECHO', ka: 'IECHO' },
  teneth: { en: 'Teneth', ka: 'Teneth' },
  ideal: { en: 'Ideal', ka: 'Ideal' },
  duplo: { en: 'Duplo', ka: 'Duplo' },
  rapid: { en: 'Rapid', ka: 'Rapid' },
  recoSystems: { en: 'Reco Systems', ka: 'Reco Systems' },
  matrix: { en: 'Matrix', ka: 'Matrix' }
};

const getLabel = (labels, key, language = 'en') => {
  if (!labels[key]) {
    return key;
  }
  return labels[key][language] || labels[key].en || key;
};

/**
 * Generate HTML email template
 * @param {Object} data - Email data
 * @returns {String} HTML string
 */
const generateEmailHTML = (data) => {
  const currentLanguage = translations[data.language] ? data.language : 'en';
  const t = translations[currentLanguage];
  const enLabels = translations.en;
  const kaLabels = translations.ka;

  const deviceTypeCurrent = getLabel(deviceTypeLabels, data.device_type, currentLanguage);
  const brandCurrent = getLabel(brandLabels, data.brand, currentLanguage);
  const jobTypeCurrent = getLabel(jobTypeLabels, data.job_type, currentLanguage);

  const deviceTypeEn = getLabel(deviceTypeLabels, data.device_type, 'en');
  const deviceTypeKa = getLabel(deviceTypeLabels, data.device_type, 'ka');
  const brandEn = getLabel(brandLabels, data.brand, 'en');
  const brandKa = getLabel(brandLabels, data.brand, 'ka');
  const jobTypeEn = getLabel(jobTypeLabels, data.job_type, 'en');
  const jobTypeKa = getLabel(jobTypeLabels, data.job_type, 'ka');

  const selectionChainEn = `${enLabels.deviceType}: ${deviceTypeEn} → ${enLabels.brand}: ${brandEn} → ${enLabels.jobType}: ${jobTypeEn}`;
  const selectionChainKa = `${kaLabels.deviceType}: ${deviceTypeKa} → ${kaLabels.brand}: ${brandKa} → ${kaLabels.jobType}: ${jobTypeKa}`;

  return `
    <!DOCTYPE html>
    <html lang="${currentLanguage}">
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
          font-size: 18px;
          font-weight: 600;
        }
        .value .line {
          display: block;
          margin-bottom: 6px;
        }
        .value .line:last-of-type {
          margin-bottom: 0;
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
            font-size: 16px;
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
          <div class="field" style="background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(76, 175, 80, 0.1)); border-left-color: #4CAF50;">
            <div class="label" style="color: #4CAF50;">📋 ${t.selectionChain}</div>
            <div class="value" style="color: #2e7d32; font-size: 18px; line-height: 1.8;">
              <span class="line">${selectionChainEn}</span>
              <span class="line">${selectionChainKa}</span>
            </div>
          </div>
          <div class="field">
            <div class="label">📦 ${t.deviceType}</div>
            <div class="value">${deviceTypeCurrent}</div>
          </div>
          <div class="field">
            <div class="label">🏢 ${t.brand}</div>
            <div class="value">${brandCurrent}</div>
          </div>
          <div class="field">
            <div class="label">💼 ${t.jobType}</div>
            <div class="value">${jobTypeCurrent}</div>
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
  const currentLanguage = translations[data.language] ? data.language : 'en';
  const t = translations[currentLanguage];
  const enLabels = translations.en;
  const kaLabels = translations.ka;

  const deviceTypeCurrent = getLabel(deviceTypeLabels, data.device_type, currentLanguage);
  const brandCurrent = getLabel(brandLabels, data.brand, currentLanguage);
  const jobTypeCurrent = getLabel(jobTypeLabels, data.job_type, currentLanguage);

  const deviceTypeEn = getLabel(deviceTypeLabels, data.device_type, 'en');
  const deviceTypeKa = getLabel(deviceTypeLabels, data.device_type, 'ka');
  const brandEn = getLabel(brandLabels, data.brand, 'en');
  const brandKa = getLabel(brandLabels, data.brand, 'ka');
  const jobTypeEn = getLabel(jobTypeLabels, data.job_type, 'en');
  const jobTypeKa = getLabel(jobTypeLabels, data.job_type, 'ka');

  return `
${t.title}
${'='.repeat(50)}

${enLabels.selectionChain}:
${enLabels.deviceType}: ${deviceTypeEn} -> ${enLabels.brand}: ${brandEn} -> ${enLabels.jobType}: ${jobTypeEn}

${kaLabels.selectionChain}:
${kaLabels.deviceType}: ${deviceTypeKa} -> ${kaLabels.brand}: ${brandKa} -> ${kaLabels.jobType}: ${jobTypeKa}

${'='.repeat(50)}

${t.deviceType}: ${deviceTypeCurrent}
${t.brand}: ${brandCurrent}
${t.jobType}: ${jobTypeCurrent}
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
  
  const subjectDeviceLabel = getLabel(deviceTypeLabels, data.device_type, 'en');
  const subjectBrandLabel = getLabel(brandLabels, data.brand, 'en');

  const mailOptions = {
    from: `"${emailSender.name}" <${emailSender.email}>`,
    to: getAdminEmail(),
    subject: `Новая заявка: ${subjectDeviceLabel} - ${subjectBrandLabel}`,
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

