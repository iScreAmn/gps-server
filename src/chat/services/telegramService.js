import TelegramBot from 'node-telegram-bot-api';

let bot = null;
let isInitialized = false;

// Store user sessions: userId -> { chatId, userName, lastMessageId }
const userSessions = new Map();
// telegram message_id -> userId (for reply routing)
const messageIdToUser = new Map();
// Store pending messages callback
let onMessageCallback = null;

/**
 * Initialize Telegram Bot
 */
export const initTelegramBot = () => {
  if (isInitialized) return;
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_bot_token_here') {
    console.error('WARNING: TELEGRAM_BOT_TOKEN not found in .env file!');
    console.error('Telegram bot will not work. Please configure TELEGRAM_BOT_TOKEN in .env');
    console.error('See TELEGRAM_SETUP.md for instructions');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    isInitialized = true;
    
    console.log('Telegram bot initialized successfully');
    
    // Handle incoming messages from admin
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      // Skip if it's a command
      if (text?.startsWith('/')) {
        if (text === '/start') {
          await bot.sendMessage(chatId, '👋 Бот активирован! Вы будете получать сообщения из чата поддержки на сайте.');
        }
        return;
      }
      
      // Check if this is a reply to a user message
      if (msg.reply_to_message) {
        const originalId = msg.reply_to_message.message_id;
        const userId = messageIdToUser.get(originalId);

        if (userId) {
          if (onMessageCallback) {
            onMessageCallback(userId, {
              text: text,
              at: new Date(),
              userName: msg.from.first_name || 'Поддержка'
            });
          }

          console.log(`Received reply for user ${userId}: ${text}`);
        }
      }
    });

    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.message);
      if (error.code === 'ETELEGRAM' && error.response?.statusCode === 401) {
        console.error('Invalid bot token. Please check TELEGRAM_BOT_TOKEN in .env');
      } else if (error.code === 'ETELEGRAM' && error.response?.statusCode === 404) {
        console.error('Bot not found. Please check TELEGRAM_BOT_TOKEN in .env');
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error.message);
  }
};

/**
 * Send message to Telegram
 * @param {string} userId - User session ID
 * @param {string} userName - User name
 * @param {string} message - Message text
 * @param {Date} timestamp - Message timestamp
 * @returns {Promise<boolean>}
 */
export const sendToTelegram = async (userId, userName, message, timestamp) => {
  if (!bot || !isInitialized) {
    console.error('Telegram bot not initialized');
    return false;
  }

  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId || chatId === 'your_chat_id_here') {
    console.error('TELEGRAM_ADMIN_CHAT_ID not configured in .env');
    return false;
  }

  try {
    const formattedTime = new Intl.DateTimeFormat('ka-GE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(timestamp);

    const text = `💡 Сообщение из чата поддержи GPS\n\n👤 Имя: ${userName || 'Неизвестный'}\n💬 Сообщение: ${message}\n\nОтправлено: ${formattedTime}`;

    const sentMessage = await bot.sendMessage(chatId, text);

    messageIdToUser.set(sentMessage.message_id, userId);

    userSessions.set(userId, {
      chatId: sentMessage.chat.id,
      userName: userName || 'Неизвестный',
      lastMessageId: sentMessage.message_id
    });

    console.log(`Message sent to Telegram for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to send message to Telegram:', error.message);
    return false;
  }
};

/**
 * Set callback for receiving messages from Telegram
 * @param {Function} callback - Callback function (userId, message)
 */
export const onTelegramMessage = (callback) => {
  onMessageCallback = callback;
};

/**
 * Get user session
 * @param {string} userId
 * @returns {Object|null}
 */
export const getUserSession = (userId) => {
  return userSessions.get(userId) || null;
};

export default { initTelegramBot, sendToTelegram, onTelegramMessage, getUserSession };
