import TelegramBot from 'node-telegram-bot-api';
import { findUserByTelegramMessageId, insertAgentMessage } from '../../db/index.js';

let bot = null;
let isInitialized = false;

const isVercel = process.env.VERCEL === '1';

const handleIncomingMessage = async (msg) => {
  const text = msg.text;

  if (text?.startsWith('/')) {
    if (text === '/start' && bot) {
      try {
        await bot.sendMessage(
          msg.chat.id,
          '👋 Бот активирован! Вы будете получать сообщения из чата поддержки на сайте.'
        );
      } catch {}
    }
    return;
  }

  if (!msg.reply_to_message) return;

  const telegramMsgId = msg.reply_to_message.message_id;
  try {
    const userId = await findUserByTelegramMessageId(telegramMsgId);
    if (!userId) {
      console.log(`No user found for telegram message_id ${telegramMsgId}`);
      return;
    }

    await insertAgentMessage({ userId, text: text || '', at: new Date() });
    console.log(`Reply saved for user ${userId}: ${text}`);
  } catch (err) {
    console.error('Failed to process incoming Telegram message:', err.message);
  }
};

export const initTelegramBot = async () => {
  if (isInitialized) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_bot_token_here') {
    console.error('WARNING: TELEGRAM_BOT_TOKEN not found in .env file!');
    return;
  }

  try {
    if (isVercel) {
      bot = new TelegramBot(token);
      bot.on('message', handleIncomingMessage);

      const baseUrl = process.env.TELEGRAM_WEBHOOK_URL;
      if (baseUrl) {
        const hookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
        const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
        await bot.setWebHook(hookUrl, secret ? { secret_token: secret } : {});
        console.log('Telegram webhook set:', hookUrl);
      } else {
        console.warn('TELEGRAM_WEBHOOK_URL not set — replies from Telegram will not work');
      }
    } else {
      bot = new TelegramBot(token);
      try { await bot.deleteWebHook(); } catch {}
      bot = new TelegramBot(token, { polling: true });
      bot.on('message', handleIncomingMessage);
      bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error.message);
      });
    }

    isInitialized = true;
    console.log(`Telegram bot initialized (${isVercel ? 'webhook' : 'polling'} mode)`);
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error.message);
  }
};

export const processWebhookUpdate = (body) => {
  if (!bot) return;
  bot.processUpdate(body);
};

export const sendToTelegram = async (userId, userName, message, timestamp) => {
  if (!bot || !isInitialized) {
    console.error('Telegram bot not initialized');
    return { success: false };
  }

  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId || chatId === 'your_chat_id_here') {
    console.error('TELEGRAM_ADMIN_CHAT_ID not configured in .env');
    return { success: false };
  }

  try {
    const formattedTime = new Intl.DateTimeFormat('ka-GE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(timestamp);

    const text = `💡 Сообщение из чата поддержи GPS\n\n👤 Имя: ${userName || 'Неизвестный'}\n💬 Сообщение: ${message}\n\nОтправлено: ${formattedTime}`;
    const sentMessage = await bot.sendMessage(chatId, text);

    console.log(`Message sent to Telegram for user ${userId}`);
    return { success: true, telegramMessageId: sentMessage.message_id };
  } catch (error) {
    console.error('Failed to send message to Telegram:', error.message);
    return { success: false };
  }
};

export const sendImageToTelegram = async (
  userId,
  userName,
  buffer,
  mime,
  caption,
  timestamp
) => {
  if (!bot || !isInitialized) {
    console.error('Telegram bot not initialized');
    return { success: false };
  }

  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId || chatId === 'your_chat_id_here') {
    console.error('TELEGRAM_ADMIN_CHAT_ID not configured in .env');
    return { success: false };
  }

  try {
    const formattedTime = new Intl.DateTimeFormat('ka-GE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(timestamp);

    const header =
      `💡 Изображение из чата поддержи GPS\n\n` +
      `👤 Имя: ${userName || 'Неизвестный'}` +
      (caption ? `\n💬 Сообщение: ${caption}` : '') +
      `\n\nОтправлено: ${formattedTime}`;

    const ext =
      mime === 'image/png'
        ? 'png'
        : mime === 'image/webp'
          ? 'webp'
          : mime === 'image/gif'
            ? 'gif'
            : 'jpg';

    const sentMessage = await bot.sendPhoto(
      chatId,
      buffer,
      { caption: header },
      { filename: `image.${ext}`, contentType: mime }
    );

    console.log(`Image sent to Telegram for user ${userId}`);
    return { success: true, telegramMessageId: sentMessage.message_id };
  } catch (error) {
    console.error('Failed to send image to Telegram:', error.message);
    return { success: false };
  }
};
