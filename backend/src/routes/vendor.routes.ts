import { Router } from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  createVendorPurchase,
  markPurchasePaid
} from '../controllers/vendor.controller.js';

const router = Router();

router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);
router.post('/:id/purchases', createVendorPurchase);
router.patch('/purchases/:purchaseId/pay', markPurchasePaid);

export default router;
