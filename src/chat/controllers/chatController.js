import { sendToTelegram } from '../services/telegramService.js';

// Store pending messages for each user (in-memory)
// In production, use Redis or database
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

  // Keep only last 50 messages per user
  if (userMessages.length > 50) {
    userMessages.shift();
  }

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
