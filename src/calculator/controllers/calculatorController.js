import {
  sendCalculatorEmail,
  getLabel,
  deviceTypeLabels,
  brandLabels,
  jobTypeLabels,
} from '../services/emailService.js';
import { isEmailEnabled } from '../config/email.js';
import { sendCalculatorRequestToTelegram } from '../../chat/services/telegramService.js';

/**
 * Submit calculator form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitCalculator = async (req, res) => {
  try {
    const { 
      device_type, 
      printer_type,
      brand, 
      job_type, 
      contact_method,
      name,
      phone,
      email: rawEmail,
      language 
    } = req.body;

    // Email необязателен: пустую строку считаем отсутствием значения
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    const normalizedDeviceType = device_type || printer_type;

    // Validation - required fields
    if (!normalizedDeviceType || !brand || !job_type || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['device_type', 'brand', 'job_type', 'name', 'phone']
      });
    }

    // Validate email (only when provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone (WhatsApp/Telegram)
    const phoneRegex = /^\+995\d{9}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Expected: +995XXXXXXXXX'
      });
    }

    // Prepare email data
    const emailData = {
      device_type: normalizedDeviceType,
      brand,
      job_type,
      contact_method,
      name,
      phone,
      email,
      language: language || 'en',
      submitted_at: new Date().toLocaleString('ru-RU', {
        timeZone: 'Asia/Tbilisi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'Unknown'
    };

    const telegramResult = await sendCalculatorRequestToTelegram({
      deviceType: getLabel(deviceTypeLabels, normalizedDeviceType, 'en'),
      brand: getLabel(brandLabels, brand, 'en'),
      jobType: getLabel(jobTypeLabels, job_type, 'en'),
      contactMethod: contact_method,
      name,
      phone,
      email,
      language: emailData.language,
      timestamp: new Date(),
    });

    if (!telegramResult.success) {
      throw new Error('Failed to deliver calculator request to Telegram');
    }

    // Email is temporarily disabled — see isEmailEnabled()
    if (isEmailEnabled()) {
      await sendCalculatorEmail(emailData);
    }

    // Log successful submission
    console.log('Calculator submission successful:', {
      device_type: normalizedDeviceType,
      brand,
      job_type,
      contact_method,
      timestamp: emailData.submitted_at
    });

    // Success response
    res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data: {
        device_type: normalizedDeviceType,
        brand,
        job_type,
        timestamp: emailData.submitted_at
      }
    });

  } catch (error) {
    console.error('Calculator submission error:', error);
    
    // Send error response
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

