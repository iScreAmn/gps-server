import { sendToTelegram, sendImageToTelegram } from '../services/telegramService.js';
import {
  insertUserMessage,
  insertUserImage,
  insertAgentMessage,
  getHistory,
  setTelegramMessageId,
  getNewAgentMessages,
} from '../../db/index.js';

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
        message: 'userId and message are required',
      });
    }

    const messageTime = timestamp ? new Date(timestamp) : new Date();
    let dbId = null;

    try {
      dbId = await insertUserMessage({ userId, userName, text: message, at: messageTime });
    } catch (dbErr) {
      console.error('DB insert (user message) failed:', dbErr.message);
    }

    const result = await sendToTelegram(userId, userName, message, messageTime);

    if (result.success) {
      if (dbId && result.telegramMessageId) {
        try {
          await setTelegramMessageId(dbId, result.telegramMessageId);
        } catch (e) {
          console.error('Failed to store telegram message id:', e.message);
        }
      }
      return res.json({ success: true, message: 'Message sent to Telegram successfully' });
    }
    return res.status(500).json({ success: false, message: 'Failed to send message to Telegram' });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Send an image (optionally with caption) to Telegram
 * POST /api/chat/send-image
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
    let dbId = null;

    try {
      dbId = await insertUserImage({ userId, userName, buffer, mime, caption, at: messageTime });
    } catch (dbErr) {
      console.error('DB insert (user image) failed:', dbErr.message);
    }

    const result = await sendImageToTelegram(userId, userName, buffer, mime, caption, messageTime);

    if (result.success) {
      if (dbId && result.telegramMessageId) {
        try {
          await setTelegramMessageId(dbId, result.telegramMessageId);
        } catch (e) {
          console.error('Failed to store telegram message id:', e.message);
        }
      }
      return res.json({ success: true, message: 'Image sent to Telegram' });
    }
    return res.status(500).json({ success: false, message: 'Failed to send image to Telegram' });
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
 * Get new agent messages for user (polling endpoint)
 * GET /api/chat/messages/:userId
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { since } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const sinceTime = since ? new Date(since) : new Date(0);
    const messages = await getNewAgentMessages(userId, sinceTime);

    return res.json({ success: true, messages });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
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
 * Clear messages for user
 * DELETE /api/chat/messages/:userId
 */
export const clearMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    return res.json({ success: true, message: 'Messages cleared' });
  } catch (error) {
    console.error('Error in clearMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
