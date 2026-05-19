import express from 'express';
import { sendMessage, sendImage, getMessages, clearMessages, getHistoryHandler } from '../controllers/chatController.js';

const router = express.Router();

// Send text message to Telegram
router.post('/send', sendMessage);

// Send image (+ optional caption) to Telegram
router.post('/send-image', sendImage);

// Get pending messages for user
router.get('/messages/:userId', getMessages);

// Get persisted full history from DB
router.get('/history/:userId', getHistoryHandler);

// Clear messages for user
router.delete('/messages/:userId', clearMessages);

export default router;
