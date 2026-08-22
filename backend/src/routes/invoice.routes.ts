import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  closeInvoice,
  getPublicInvoice
} from '../controllers/invoice.controller.js';

const router = Router();

// Public customer invoice route
router.get('/public/:id', getPublicInvoice);

// Next invoice number generator
router.get('/next-number', getNextInvoiceNumber);

// Standard CRUD & Operations
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/payments', recordPayment);
router.post('/:id/close', closeInvoice);

export default router;
