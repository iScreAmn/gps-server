import express from 'express';
import { subscribe, unsubscribe, broadcast } from '../controllers/newsletterController.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.get('/unsubscribe', unsubscribe);
router.post('/broadcast', broadcast);

export default router;
