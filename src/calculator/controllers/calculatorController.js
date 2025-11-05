import { sendCalculatorEmail } from '../services/emailService.js';

/**
 * Submit calculator form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitCalculator = async (req, res) => {
  try {
    const { 
      printer_type, 
      brand, 
      job_type, 
      contact_method, 
      contact_value,
      language 
    } = req.body;

    // Validation - required fields
    if (!printer_type || !brand || !job_type || !contact_value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['printer_type', 'brand', 'job_type', 'contact_value']
      });
    }

    // Validate contact value based on method
    if (contact_method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact_value)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    } else {
      // Validate phone (WhatsApp/Telegram)
      const phoneRegex = /^\+995\d{9}$/;
      const cleanPhone = contact_value.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone format. Expected: +995XXXXXXXXX'
        });
      }
    }

    // Prepare email data
    const emailData = {
      printer_type,
      brand,
      job_type,
      contact_method,
      contact_value,
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

    // Send email
    await sendCalculatorEmail(emailData);

    // Log successful submission
    console.log('Calculator submission successful:', {
      printer_type,
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
        printer_type,
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

