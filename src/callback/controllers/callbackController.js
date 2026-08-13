import { sendCallbackRequestToTelegram } from '../../chat/services/telegramService.js';

const MAX_FIELD_LENGTH = 200;
const phoneRegex = /^[\d\s+()-]{6,25}$/;

const clean = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FIELD_LENGTH);

/**
 * Callback request from the site form ("Нужна помощь" / "Заказать звонок")
 * POST /api/callback/submit
 * Body: { name, phone, agreed, page?, pageUrl?, language? }
 */
export const submitCallback = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const phone = clean(req.body?.phone);
    const agreed = req.body?.agreed === true || req.body?.agreed === 'true';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!phone || !phoneRegex.test(phone) || (phone.match(/\d/g) || []).length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    if (!agreed) {
      return res
        .status(400)
        .json({ success: false, message: 'Personal data processing consent is required' });
    }

    const result = await sendCallbackRequestToTelegram({
      name,
      phone,
      page: clean(req.body?.page),
      language: clean(req.body?.language),
      timestamp: new Date(),
    });

    if (!result.success) {
      return res
        .status(502)
        .json({ success: false, message: 'Failed to deliver the request. Please try again.' });
    }

    return res.json({ success: true, message: 'Callback request sent' });
  } catch (error) {
    console.error('Error in callback submit:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
