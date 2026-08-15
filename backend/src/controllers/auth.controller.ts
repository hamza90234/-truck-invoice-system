import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, password, shopName, address, phone,
      website, logoUrl, taxId, defaultTaxRate, defaultPaymentTerms, creditCardFeePct, invoiceSettings
    } = req.body;

    // Check if shop profile already exists
    const existingShop = await prisma.shopProfile.findUnique({ where: { email } });
    if (existingShop) {
      res.status(400).json({ error: 'Shop profile already exists with this email' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create ShopProfile
    const shop = await prisma.shopProfile.create({
      data: {
        email,
        passwordHash,
        shopName,
        address,
        phone,
        website,
        logoUrl,
        taxId,
        defaultTaxRate,
        defaultPaymentTerms,
        creditCardFeePct,
        invoiceSettings
      },
    });

    // Generate Token
    const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, shop: { id: shop.id, shopName: shop.shopName, email: shop.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const shop = await prisma.shopProfile.findUnique({ where: { email } });
    if (!shop) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, shop.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token, shop: { id: shop.id, shopName: shop.shopName, email: shop.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
