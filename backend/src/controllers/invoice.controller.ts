import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

const TRANSACTION_OPTIONS = {
  maxWait: 10000, // 10s max wait to acquire connection
  timeout: 30000  // 30s timeout for transaction execution
};

// Generate next invoice number e.g. INV-1001
export const getNextInvoiceNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });

    if (!lastInvoice || !lastInvoice.invoiceNumber) {
      res.status(200).json({ nextInvoiceNumber: 'INV-1001' });
      return;
    }

    // Try extracting numeric portion
    const match = lastInvoice.invoiceNumber.match(/\d+$/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      const prefix = lastInvoice.invoiceNumber.slice(0, match.index);
      res.status(200).json({ nextInvoiceNumber: `${prefix}${nextNum}` });
    } else {
      const count = await prisma.invoice.count();
      res.status(200).json({ nextInvoiceNumber: `INV-${1001 + count}` });
    }
  } catch (error) {
    console.error('Error fetching next invoice number:', error);
    res.status(500).json({ error: 'Failed to generate next invoice number' });
  }
};

// Get all invoices with search and filtering
export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, customerId, vehicleId } = req.query;

    const whereClause: Prisma.InvoiceWhereInput = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status as any;
    }

    if (customerId && typeof customerId === 'string') {
      whereClause.customerId = customerId;
    }

    if (vehicleId && typeof vehicleId === 'string') {
      whereClause.vehicleId = vehicleId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customer: { companyName: { contains: q, mode: 'insensitive' } } },
        { customer: { contactPerson: { contains: q, mode: 'insensitive' } } },
        { vehicle: { vin: { contains: q, mode: 'insensitive' } } },
        { vehicle: { unitNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        customer: {
          select: { id: true, companyName: true, contactPerson: true, phone: true, email: true }
        },
        vehicle: {
          select: { id: true, unitNumber: true, vin: true, make: true, model: true, year: true }
        },
        _count: {
          select: { items: true, payments: true }
        }
      }
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get single invoice by ID
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const [invoice, shopProfile] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          vehicle: true,
          items: {
            include: {
              part: true
            },
            orderBy: { createdAt: 'asc' }
          },
          payments: {
            orderBy: { date: 'desc' }
          }
        }
      }),
      prisma.shopProfile.findFirst()
    ]);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.status(200).json({ ...invoice, shopProfile });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
};

// Public invoice endpoint for customer portal (no auth required)
export const getPublicInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const [invoice, shopProfile] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              companyName: true,
              contactPerson: true,
              phone: true,
              email: true,
              billingAddress: true
            }
          },
          vehicle: {
            select: {
              unitNumber: true,
              vin: true,
              year: true,
              make: true,
              model: true,
              licensePlate: true,
              mileage: true
            }
          },
          items: {
            select: {
              id: true,
              type: true,
              description: true,
              quantity: true,
              rate: true,
              total: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              date: true
            },
            orderBy: { date: 'desc' }
          }
        }
      }),
      prisma.shopProfile.findFirst({
        select: {
          shopName: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          logoUrl: true,
          creditCardFeePct: true
        }
      })
    ]);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.status(200).json({ ...invoice, shopProfile });
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create new Invoice
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      vehicleId,
      invoiceNumber,
      date,
      dueDate,
      paymentTerms,
      taxRate = 0,
      notes,
      warrantyInfo,
      status = 'UNPAID',
      items = []
    } = req.body;

    if (!customerId || !vehicleId) {
      res.status(400).json({ error: 'Customer and Vehicle are required' });
      return;
    }

    // Auto-generate invoice number if not provided
    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber || finalInvoiceNumber.trim() === '') {
      const count = await prisma.invoice.count();
      finalInvoiceNumber = `INV-${1001 + count}`;
    }

    // Check if invoice number already exists
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: finalInvoiceNumber } });
    if (existing) {
      res.status(400).json({ error: `Invoice number "${finalInvoiceNumber}" is already in use` });
      return;
    }

    // Calculate line totals and subtotal
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const itemTotal = Number((qty * rate).toFixed(2));
      subtotal += itemTotal;

      return {
        type: item.type === 'PART' ? ('PART' as const) : ('LABOR' as const),
        partId: item.partId || null,
        description: item.description || '',
        quantity: qty,
        rate: rate,
        total: itemTotal
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    const taxRateNum = parseFloat(taxRate) || 0;
    const taxAmount = Number(((subtotal * taxRateNum) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));
    const balance = totalAmount;

    // Prisma transaction with increased timeout & atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Deduct inventory atomically for parts
      for (const item of processedItems) {
        if (item.type === 'PART' && item.partId) {
          await tx.part.update({
            where: { id: item.partId },
            data: {
              stockQuantity: {
                decrement: Math.max(1, Math.floor(item.quantity))
              }
            }
          }).catch((err) => {
            console.warn(`Could not update stock for part ${item.partId}:`, err.message);
          });
        }
      }

      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          customerId,
          vehicleId,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          paymentTerms: paymentTerms || null,
          subtotal,
          taxAmount,
          creditCardFee: 0,
          totalAmount,
          amountPaid: 0,
          balance,
          status: status as any,
          notes: notes || null,
          warrantyInfo: warrantyInfo || null,
          items: {
            create: processedItems
          }
        },
        include: {
          customer: true,
          vehicle: true,
          items: true
        }
      });

      return newInvoice;
    }, TRANSACTION_OPTIONS);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
};

// Update existing Invoice
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      invoiceNumber,
      date,
      dueDate,
      paymentTerms,
      taxRate = 0,
      notes,
      warrantyInfo,
      status,
      items = []
    } = req.body;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true }
    });

    if (!existingInvoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (existingInvoice.status === 'CLOSED') {
      res.status(400).json({ error: 'Closed invoices cannot be modified' });
      return;
    }

    // Check if updating invoiceNumber conflicts
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      const conflict = await prisma.invoice.findUnique({ where: { invoiceNumber } });
      if (conflict) {
        res.status(400).json({ error: `Invoice number "${invoiceNumber}" is already in use` });
        return;
      }
    }

    // Calculate line totals and subtotal
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const itemTotal = Number((qty * rate).toFixed(2));
      subtotal += itemTotal;

      return {
        type: item.type === 'PART' ? ('PART' as const) : ('LABOR' as const),
        partId: item.partId || null,
        description: item.description || '',
        quantity: qty,
        rate: rate,
        total: itemTotal
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    const taxRateNum = parseFloat(taxRate) || 0;
    const taxAmount = Number(((subtotal * taxRateNum) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));
    const amountPaid = Number(existingInvoice.amountPaid);
    const balance = Number((totalAmount - amountPaid).toFixed(2));

    // Determine status
    let finalStatus = status || existingInvoice.status;
    if (balance <= 0 && amountPaid > 0) {
      finalStatus = 'PAID';
    } else if (amountPaid > 0 && balance > 0) {
      finalStatus = 'PARTIALLY_PAID';
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Revert previous part deductions
      for (const oldItem of existingInvoice.items) {
        if (oldItem.type === 'PART' && oldItem.partId) {
          await tx.part.update({
            where: { id: oldItem.partId },
            data: { stockQuantity: { increment: Math.floor(Number(oldItem.quantity)) } }
          }).catch((err) => console.warn(err.message));
        }
      }

      // 2. Deduct new part stock
      for (const newItem of processedItems) {
        if (newItem.type === 'PART' && newItem.partId) {
          await tx.part.update({
            where: { id: newItem.partId },
            data: { stockQuantity: { decrement: Math.floor(newItem.quantity) } }
          }).catch((err) => console.warn(err.message));
        }
      }

      // 3. Delete old items and insert new items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber: invoiceNumber || existingInvoice.invoiceNumber,
          date: date ? new Date(date) : existingInvoice.date,
          dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : existingInvoice.paymentTerms,
          subtotal,
          taxAmount,
          totalAmount,
          balance,
          status: finalStatus,
          notes: notes !== undefined ? notes : existingInvoice.notes,
          warrantyInfo: warrantyInfo !== undefined ? warrantyInfo : existingInvoice.warrantyInfo,
          items: {
            create: processedItems
          }
        },
        include: {
          customer: true,
          vehicle: true,
          items: true,
          payments: true
        }
      });

      return updatedInvoice;
    }, TRANSACTION_OPTIONS);

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to update invoice' });
  }
};

// Delete Invoice (Restores inventory)
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Revert part stock
      for (const item of existing.items) {
        if (item.type === 'PART' && item.partId) {
          await tx.part.update({
            where: { id: item.partId },
            data: { stockQuantity: { increment: Math.floor(Number(item.quantity)) } }
          }).catch((err) => console.warn(err.message));
        }
      }

      // Delete payments, items, invoice
      await tx.payment.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });
    }, TRANSACTION_OPTIONS);

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to delete invoice' });
  }
};

// Record a Payment
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amount, paymentMethod, date, transactionId } = req.body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0' });
      return;
    }

    if (!paymentMethod) {
      res.status(400).json({ error: 'Payment method is required' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const currentPaid = Number(invoice.amountPaid);
    const newPaid = Number((currentPaid + payAmount).toFixed(2));
    const total = Number(invoice.totalAmount);
    const newBalance = Number(Math.max(0, total - newPaid).toFixed(2));

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount: payAmount,
          paymentMethod: paymentMethod as any,
          date: date ? new Date(date) : new Date(),
          transactionId: transactionId || null
        }
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
          status: newStatus
        },
        include: {
          payments: { orderBy: { date: 'desc' } }
        }
      });

      return { payment, invoice: updatedInvoice };
    }, TRANSACTION_OPTIONS);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
};

// Close Invoice (Lock)
export const closeInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const closed = await prisma.invoice.update({
      where: { id },
      data: { status: 'CLOSED' }
    });

    res.status(200).json(closed);
  } catch (error: any) {
    console.error('Error closing invoice:', error);
    res.status(500).json({ error: error.message || 'Failed to close invoice' });
  }
};
