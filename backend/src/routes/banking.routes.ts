import express from 'express';
import multer from 'multer';
import { uploadBankStatement, getUnmatchedTransactions, matchTransaction } from '../controllers/banking.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/banking/' });

router.post('/upload', upload.single('file'), uploadBankStatement);
router.get('/transactions/unmatched', getUnmatchedTransactions);
router.post('/match', matchTransaction);

export default router;
