import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Get all parts
export const getParts = async (req: Request, res: Response): Promise<void> => {
  try {
    const parts = await prisma.part.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Failed to fetch parts' });
  }
};

// Get a single part by ID
export const getPartById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const part = await prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      res.status(404).json({ error: 'Part not found' });
      return;
    }

    res.status(200).json(part);
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({ error: 'Failed to fetch part' });
  }
};

// Create a new part
export const createPart = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      partNumber,
      name,
      description,
      purchaseCost,
      sellingPrice,
      stockQuantity,
      minimumStockLevel
    } = req.body;

    if (!partNumber || !name || purchaseCost === undefined || sellingPrice === undefined) {
      res.status(400).json({ error: 'Part Number, Name, Purchase Cost, and Selling Price are required' });
      return;
    }

    // Check if partNumber already exists
    const existingPart = await prisma.part.findUnique({ where: { partNumber } });
    if (existingPart) {
      res.status(400).json({ error: 'A part with this Part Number already exists' });
      return;
    }

    const newPart = await prisma.part.create({
      data: {
        partNumber,
        name,
        description,
        purchaseCost: parseFloat(purchaseCost),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
        minimumStockLevel: minimumStockLevel ? parseInt(minimumStockLevel, 10) : 5
      }
    });

    res.status(201).json(newPart);
  } catch (error) {
    console.error('Error creating part:', error);
    res.status(500).json({ error: 'Failed to create part' });
  }
};

// Update a part
export const updatePart = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const existingPart = await prisma.part.findUnique({ where: { id } });
    if (!existingPart) {
      res.status(404).json({ error: 'Part not found' });
      return;
    }

    // Check if updating partNumber and it conflicts
    if (data.partNumber && data.partNumber !== existingPart.partNumber) {
      const partConflict = await prisma.part.findUnique({ where: { partNumber: data.partNumber } });
      if (partConflict) {
        res.status(400).json({ error: 'A part with this Part Number already exists' });
        return;
      }
    }

    // Parse numbers if they are passed as strings/numbers
    if (data.purchaseCost !== undefined) data.purchaseCost = parseFloat(data.purchaseCost);
    if (data.sellingPrice !== undefined) data.sellingPrice = parseFloat(data.sellingPrice);
    if (data.stockQuantity !== undefined) data.stockQuantity = parseInt(data.stockQuantity, 10);
    if (data.minimumStockLevel !== undefined) data.minimumStockLevel = parseInt(data.minimumStockLevel, 10);

    const updatedPart = await prisma.part.update({
      where: { id },
      data
    });

    res.status(200).json(updatedPart);
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ error: 'Failed to update part' });
  }
};

// Delete a part
export const deletePart = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingPart = await prisma.part.findUnique({ where: { id } });
    if (!existingPart) {
      res.status(404).json({ error: 'Part not found' });
      return;
    }

    await prisma.part.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ error: 'Failed to delete part. Ensure it is not linked to any invoices.' });
  }
};
