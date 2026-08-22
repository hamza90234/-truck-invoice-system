import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      customerCount,
      vehicleCount,
      partCount,
      invoiceAgg,
      unpaidCount,
      recentInvoices,
      recentCustomers,
      expenseAgg,
      vendorAgg
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.vehicle.count(),
      prisma.part.count(),
      prisma.invoice.aggregate({
        _sum: {
          amountPaid: true,
          balance: true
        }
      }),
      prisma.invoice.count({
        where: {
          status: { in: ['UNPAID', 'PARTIALLY_PAID'] }
        }
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { companyName: true } },
          vehicle: { select: { unitNumber: true, make: true, model: true } }
        }
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicles: true,
          _count: { select: { invoices: true } }
        }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true }
      }),
      prisma.vendor.aggregate({
        _sum: { balance: true }
      })
    ]);

    const totalRevenue = Number(invoiceAgg._sum.amountPaid || 0);
    const outstandingBalance = Number(invoiceAgg._sum.balance || 0);
    const totalExpenses = Number(expenseAgg._sum.amount || 0);
    const vendorPayables = Number(vendorAgg._sum.balance || 0);
    const netProfit = totalRevenue - totalExpenses;

    res.status(200).json({
      activeCustomers: customerCount,
      vehicles: vehicleCount,
      totalParts: partCount,
      totalRevenue,
      outstandingBalance,
      unpaidInvoices: unpaidCount,
      totalExpenses,
      vendorPayables,
      netProfit,
      recentInvoices,
      recentCustomers
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
