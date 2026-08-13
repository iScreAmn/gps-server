import {
  addNewsletterSubscriber,
  unsubscribeNewsletterEmail,
  getActiveNewsletterEmails,
} from '../../db/index.js';
import {
  sendNewsletterSubscriberToTelegram,
  sendNewsletterBroadcastSummaryToTelegram,
} from '../../chat/services/telegramService.js';
import { sendNewsletterBroadcast } from '../services/newsletterEmailService.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Subscribe an email to the newsletter
 * POST /api/newsletter/subscribe
 */
export const subscribe = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const result = await addNewsletterSubscriber(email);

    if (!result.alreadySubscribed) {
      sendNewsletterSubscriberToTelegram(email, new Date()).catch((err) =>
        console.error('Telegram notify failed:', err.message)
      );
    }

    return res.json({
      success: true,
      message: result.alreadySubscribed
        ? 'You are already subscribed.'
        : 'Thank you! You are now subscribed.',
    });
  } catch (error) {
    console.error('Error in newsletter subscribe:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Unsubscribe an email from the newsletter (link clicked from an email)
 * GET /api/newsletter/unsubscribe?email=...
 */
export const unsubscribe = async (req, res) => {
  const email = String(req.query?.email || '').trim().toLowerCase();

  if (!email || !emailRegex.test(email)) {
    return res.status(400).send('<p>Invalid unsubscribe link.</p>');
  }

  try {
    await unsubscribeNewsletterEmail(email);
    return res.send(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>You've been unsubscribed</h2>
        <p>${email} will no longer receive newsletter emails from GPS.</p>
      </body></html>
    `);
  } catch (error) {
    console.error('Error in newsletter unsubscribe:', error);
    return res.status(500).send('<p>Something went wrong. Please try again later.</p>');
  }
};

/**
 * Broadcast a news/product update to all active subscribers
 * POST /api/newsletter/broadcast
 * Header: x-admin-key
 */
export const broadcast = async (req, res) => {
  try {
    const adminKey = process.env.NEWSLETTER_ADMIN_KEY;
    if (!adminKey) {
      return res.status(500).json({ success: false, message: 'NEWSLETTER_ADMIN_KEY not configured on server' });
    }
    if (req.headers['x-admin-key'] !== adminKey) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { type, title, description, url } = req.body || {};
    if (!title || !['article', 'product'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '"title" and "type" ("article" | "product") are required',
      });
    }

    const emails = await getActiveNewsletterEmails();
    const unsubscribeBaseUrl = `${req.protocol}://${req.get('host')}/api/newsletter/unsubscribe`;

    const { sent, failed } = await sendNewsletterBroadcast({
      type,
      title,
      description,
      url,
      emails,
      unsubscribeBaseUrl,
    });

    sendNewsletterBroadcastSummaryToTelegram({
      subject: title,
      recipientCount: sent,
      failedCount: failed,
    }).catch((err) => console.error('Telegram summary failed:', err.message));

    return res.json({ success: true, sent, failed, totalSubscribers: emails.length });
  } catch (error) {
    console.error('Error in newsletter broadcast:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
