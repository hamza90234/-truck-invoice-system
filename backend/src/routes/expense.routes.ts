import { Router } from 'express';
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expense.controller.js';

const router = Router();

router.get('/summary', getExpenseSummary);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
