import express from 'express';
import { sendScanReport } from '../controllers/scannerReportController.js';

const router = express.Router();

router.post('/send-report', sendScanReport);

export default router;
