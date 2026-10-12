import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getPendingCustomerCount,
  onboardCustomer,
  approveCustomer,
  rejectCustomer
} from '../controllers/customer.controller.js';

const router = express.Router();

router.get('/', getCustomers);
router.get('/pending/count', getPendingCustomerCount);
router.post('/onboard', onboardCustomer);
router.patch('/:id/approve', approveCustomer);
router.patch('/:id/reject', rejectCustomer);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
