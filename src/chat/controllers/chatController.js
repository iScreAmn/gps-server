import { sendToTelegram, sendImageToTelegram } from '../services/telegramService.js';
import {
  insertUserMessage,
  insertUserImage,
  insertAgentMessage,
  getHistory,
} from '../../db/index.js';

// In-memory queue for polling delivery (persistent storage is in Postgres).
const pendingMessages = new Map();

/**
 * Send message to Telegram
 * POST /api/chat/send
 */
export const sendMessage = async (req, res) => {
  try {
    const { userId, userName, message, timestamp } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId and message are required'
      });
    }

    const messageTime = timestamp ? new Date(timestamp) : new Date();

    try {
      await insertUserMessage({ userId, userName, text: message, at: messageTime });
    } catch (dbErr) {
      console.error('DB insert (user message) failed:', dbErr.message);
    }

    const success = await sendToTelegram(userId, userName, message, messageTime);

    if (success) {
      return res.json({
        success: true,
        message: 'Message sent to Telegram successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send message to Telegram'
      });
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Send an image (optionally with caption) to Telegram
 * POST /api/chat/send-image
 * Body: { userId, userName, imageDataUrl, caption?, timestamp? }
 */
export const sendImage = async (req, res) => {
  try {
    const { userId, userName, imageDataUrl, caption, timestamp } = req.body;

    if (!userId || !imageDataUrl) {
      return res.status(400).json({
        success: false,
        message: 'userId and imageDataUrl are required',
      });
    }

    const match = String(imageDataUrl).match(
      /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/
    );
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'imageDataUrl must be a base64 image data URL',
      });
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const messageTime = timestamp ? new Date(timestamp) : new Date();

    try {
      await insertUserImage({ userId, userName, buffer, mime, caption, at: messageTime });
    } catch (dbErr) {
      console.error('DB insert (user image) failed:', dbErr.message);
    }

    const success = await sendImageToTelegram(
      userId,
      userName,
      buffer,
      mime,
      caption,
      messageTime
    );

    if (success) {
      return res.json({ success: true, message: 'Image sent to Telegram' });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to send image to Telegram',
    });
  } catch (error) {
    console.error('Error in sendImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get pending messages for user
 * GET /api/chat/messages/:userId
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { since } = req.query; // timestamp of last received message

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const userMessages = pendingMessages.get(userId) || [];
    
    // Filter messages since timestamp if provided
    let messages = userMessages;
    if (since) {
      const sinceTime = new Date(since);
      messages = userMessages.filter(msg => new Date(msg.at) > sinceTime);
    }

    return res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get persisted history from Postgres
 * GET /api/chat/history/:userId
 */
export const getHistoryHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const messages = await getHistory(userId);
    return res.json({ success: true, messages });
  } catch (error) {
    console.error('Error in getHistoryHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      code: error.code,
    });
  }
};

/**
 * Add message to pending queue (called by telegram service)
 * @param {string} userId
 * @param {Object} message
 */
export const addPendingMessage = (userId, message) => {
  if (!pendingMessages.has(userId)) {
    pendingMessages.set(userId, []);
  }

  const userMessages = pendingMessages.get(userId);
  userMessages.push({
    id: `agent-${Date.now()}`,
    role: 'agent',
    kind: 'text',
    text: message.text,
    at: message.at,
    userName: message.userName
  });

  // Keep only last 50 messages per user in the polling queue
  if (userMessages.length > 50) {
    userMessages.shift();
  }

  insertAgentMessage({ userId, text: message.text, at: message.at }).catch((err) =>
    console.error('DB insert (agent message) failed:', err.message)
  );

  console.log(`Added pending message for user ${userId}`);
};

/**
 * Clear old messages for user (optional cleanup)
 * DELETE /api/chat/messages/:userId
 */
export const clearMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    pendingMessages.delete(userId);

    return res.json({
      success: true,
      message: 'Messages cleared'
    });
  } catch (error) {
    console.error('Error in clearMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
