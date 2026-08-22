import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

const TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 30000
};

// Get all vendors
export const getVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    });

    const totalPayables = vendors.reduce((sum, v) => sum + Number(v.balance || 0), 0);

    res.status(200).json({
      vendors,
      totalPayables
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// Get a single vendor by ID with purchase history
export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

// Create a new vendor
export const createVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, contactInfo } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Vendor name is required' });
      return;
    }

    const newVendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        contactInfo: contactInfo ? contactInfo.trim() : null,
        balance: 0
      }
    });

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

// Update a vendor
export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, contactInfo } = req.body;

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        contactInfo: contactInfo !== undefined ? contactInfo : existing.contactInfo
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

// Delete a vendor
export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    await prisma.vendor.delete({ where: { id } });
    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor. Ensure no purchase records are linked.' });
  }
};

// Record a Vendor Parts Purchase (Increments stock & updates balance)
export const createVendorPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { totalAmount, date, status = 'UNPAID', items = [] } = req.body;

    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      res.status(400).json({ error: 'Valid total purchase amount is required' });
      return;
    }

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const isUnpaid = status === 'UNPAID';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Restock parts in inventory
      for (const item of items) {
        if (item.partId && item.quantity) {
          const qtyNum = parseInt(item.quantity, 10);
          if (qtyNum > 0) {
            await tx.part.update({
              where: { id: item.partId },
              data: {
                stockQuantity: { increment: qtyNum },
                ...(item.unitCost ? { purchaseCost: parseFloat(item.unitCost) } : {})
              }
            }).catch((err) => console.warn(`Could not increment part ${item.partId}:`, err.message));
          }
        }
      }

      // 2. Create the purchase record
      const purchase = await tx.vendorPurchase.create({
        data: {
          vendorId: id,
          totalAmount: amountNum,
          date: date ? new Date(date) : new Date(),
          status: isUnpaid ? 'UNPAID' : 'PAID'
        }
      });

      // 3. Update vendor balance if unpaid
      if (isUnpaid) {
        await tx.vendor.update({
          where: { id },
          data: {
            balance: { increment: amountNum }
          }
        });
      }

      return purchase;
    }, TRANSACTION_OPTIONS);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating vendor purchase:', error);
    res.status(500).json({ error: error.message || 'Failed to record purchase order' });
  }
};

// Mark a Vendor Purchase as Paid (Decreases vendor balance)
export const markPurchasePaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const purchaseId = req.params.purchaseId as string;

    const purchase = await prisma.vendorPurchase.findUnique({
      where: { id: purchaseId },
      include: { vendor: true }
    });

    if (!purchase) {
      res.status(404).json({ error: 'Purchase record not found' });
      return;
    }

    if (purchase.status === 'PAID') {
      res.status(400).json({ error: 'This purchase is already marked as PAID' });
      return;
    }

    const amountNum = Number(purchase.totalAmount);

    const result = await prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.vendorPurchase.update({
        where: { id: purchaseId },
        data: { status: 'PAID' }
      });

      const currentBalance = Number(purchase.vendor.balance);
      const newBalance = Math.max(0, currentBalance - amountNum);

      await tx.vendor.update({
        where: { id: purchase.vendorId },
        data: { balance: newBalance }
      });

      return updatedPurchase;
    }, TRANSACTION_OPTIONS);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error marking purchase paid:', error);
    res.status(500).json({ error: error.message || 'Failed to mark purchase as paid' });
  }
};
