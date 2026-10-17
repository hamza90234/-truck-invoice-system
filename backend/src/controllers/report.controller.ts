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
    const [invoices, invoiceAgg, expenseAgg, vendorPurchaseAgg] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: { not: 'DRAFT' } },
        include: {
          items: {
            include: { part: true }
          }
        }
      }),
      prisma.invoice.aggregate({ 
        where: { status: { not: 'DRAFT' } },
        _sum: { amountPaid: true, totalAmount: true } 
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.vendorPurchase.aggregate({ _sum: { totalAmount: true } })
    ]);

    let laborRevenue = 0;
    let partsRevenue = 0;
    let partsCOGS = 0;

    for (const inv of invoices) {
      for (const item of inv.items) {
        const itemTotal = Number(item.total || 0);
        const qty = Number(item.quantity || 1);
        if (item.type === 'LABOR') {
          laborRevenue += itemTotal;
        } else if (item.type === 'PART') {
          partsRevenue += itemTotal;
          const unitCost = item.cost !== null && item.cost !== undefined
            ? Number(item.cost)
            : Number(item.part?.purchaseCost || 0);
          partsCOGS += Number((qty * unitCost).toFixed(2));
        }
      }
    }

    laborRevenue = Number(laborRevenue.toFixed(2));
    partsRevenue = Number(partsRevenue.toFixed(2));
    partsCOGS = Number(partsCOGS.toFixed(2));
    const partsGrossProfit = Number((partsRevenue - partsCOGS).toFixed(2));
    const totalGrossProfit = Number((laborRevenue + partsGrossProfit).toFixed(2));

    const totalBilled = Number(invoiceAgg._sum.totalAmount || 0);
    const totalRevenue = Number(invoiceAgg._sum.amountPaid || 0);
    const totalExpenses = Number(expenseAgg._sum.amount || 0);
    const totalVendorPurchases = Number(vendorPurchaseAgg._sum.totalAmount || 0);
    
    const netProfit = Number((totalGrossProfit - totalExpenses).toFixed(2));
    const grossMarginPct = totalBilled > 0 
      ? Number(((totalGrossProfit / totalBilled) * 100).toFixed(1)) 
      : 0;

    res.status(200).json({
      totalBilled,
      totalRevenue,
      laborRevenue,
      partsRevenue,
      partsCOGS,
      partsGrossProfit,
      laborProfit: laborRevenue,
      totalGrossProfit,
      totalExpenses,
      totalVendorPurchases,
      netProfit,
      grossMarginPct
    });
  } catch (error) {
    console.error('Error calculating P&L:', error);
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
