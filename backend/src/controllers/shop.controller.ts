import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcrypt';

export const getShopProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, you get this from the JWT token middleware.
    // For now, we just fetch the first shop since it's a single-tenant app.
    const shop = await prisma.shopProfile.findFirst();
    
    if (!shop) {
      res.status(404).json({ error: 'Shop profile not found' });
      return;
    }

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateShopProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      shopName, address, phone, email, website, logoUrl, 
      taxId, defaultTaxRate, defaultPaymentTerms, creditCardFeePct, invoiceSettings, password
    } = req.body;

    const existingShop = await prisma.shopProfile.findFirst();
    if (!existingShop) {
      res.status(404).json({ error: 'Shop profile not found' });
      return;
    }

    const updatedShop = await prisma.shopProfile.update({
      where: { id: existingShop.id },
      data: {
        shopName,
        address,
        phone,
        email,
        website,
        logoUrl,
        taxId,
        defaultTaxRate,
        defaultPaymentTerms,
        creditCardFeePct,
        invoiceSettings,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {})
      },
    });

    res.status(200).json(updatedShop);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
