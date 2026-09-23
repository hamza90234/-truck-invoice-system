import express from 'express';
import { getSalesReport, getProfitAndLoss, getArAp } from '../controllers/report.controller.js';

const router = express.Router();

router.get('/sales', getSalesReport);
router.get('/profit-loss', getProfitAndLoss);
router.get('/ar-ap', getArAp);

export default router;
