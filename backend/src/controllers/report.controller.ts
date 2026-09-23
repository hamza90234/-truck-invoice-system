import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: 'DRAFT' } },
      include: { customer: true },
      orderBy: { date: 'desc' }
    });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};

export const getProfitAndLoss = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceAgg = await prisma.invoice.aggregate({ _sum: { amountPaid: true, totalAmount: true } });
    const expenseAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
    const vendorPurchaseAgg = await prisma.vendorPurchase.aggregate({ _sum: { totalAmount: true } });

    const totalRevenue = Number(invoiceAgg._sum.amountPaid || 0);
    const totalExpenses = Number(expenseAgg._sum.amount || 0);
    const totalCOGS = Number(vendorPurchaseAgg._sum.totalAmount || 0); // Cost of Goods Sold (Parts)
    
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    res.status(200).json({
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch P&L' });
  }
};

export const getArAp = async (req: Request, res: Response): Promise<void> => {
  try {
    const customersWithBalance = await prisma.customer.findMany({
       where: { invoices: { some: { balance: { gt: 0 } } } },
       include: { invoices: { where: { balance: { gt: 0 } } } }
    });
    
    const vendorsWithBalance = await prisma.vendor.findMany({
       where: { balance: { gt: 0 } }
    });

    res.status(200).json({
      accountsReceivable: customersWithBalance,
      accountsPayable: vendorsWithBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AR/AP' });
  }
};
