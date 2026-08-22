import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

// Get all expenses with filters
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, startDate, endDate, search } = req.query;

    const whereClause: Prisma.ExpenseWhereInput = {};

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.expenseCategory = category;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate && typeof startDate === 'string') {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { expenseCategory: { contains: q, mode: 'insensitive' } }
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    res.status(200).json({
      expenses,
      totalAmount
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Get Expense summary & category breakdown
export const getExpenseSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const expenses = await prisma.expense.findMany();

    const categoryMap: { [key: string]: number } = {};
    let totalSpent = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount || 0);
      totalSpent += amt;
      const cat = exp.expenseCategory || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    }

    const categoryBreakdown = Object.keys(categoryMap).map((cat) => {
      const amt = categoryMap[cat] ?? 0;
      return {
        category: cat,
        amount: amt,
        percentage: totalSpent > 0 ? Number(((amt / totalSpent) * 100).toFixed(1)) : 0
      };
    });

    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    res.status(200).json({
      totalSpent,
      count: expenses.length,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
};

// Create a new expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { expenseCategory, amount, date, description } = req.body;

    const amountNum = parseFloat(amount);
    if (!expenseCategory || isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({ error: 'Valid category and positive amount are required' });
      return;
    }

    const newExpense = await prisma.expense.create({
      data: {
        expenseCategory: expenseCategory.trim(),
        amount: amountNum,
        date: date ? new Date(date) : new Date(),
        description: description ? description.trim() : null
      }
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
};

// Update an expense
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { expenseCategory, amount, date, description } = req.body;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Expense record not found' });
      return;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        expenseCategory: expenseCategory ? expenseCategory.trim() : existing.expenseCategory,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        date: date ? new Date(date) : existing.date,
        description: description !== undefined ? description : existing.description
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete an expense
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Expense record not found' });
      return;
    }

    await prisma.expense.delete({ where: { id } });
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
