import express from 'express';
import { sendMessage, getMessages, clearMessages } from '../controllers/chatController.js';

const router = express.Router();

// Send message to Telegram
router.post('/send', sendMessage);

// Get pending messages for user
router.get('/messages/:userId', getMessages);

// Clear messages for user
router.delete('/messages/:userId', clearMessages);

export default router;
