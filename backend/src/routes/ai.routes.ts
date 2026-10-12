import { Router } from 'express';
import { scanVinFromImage } from '../controllers/ai.controller.js';

const router = Router();

// POST /api/ai/scan-vin
router.post('/scan-vin', scanVinFromImage);

export default router;
