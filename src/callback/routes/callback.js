import express from 'express';
import { submitCallback } from '../controllers/callbackController.js';

const router = express.Router();

// Send a callback request (name + phone) to Telegram
router.post('/submit', submitCallback);

export default router;
