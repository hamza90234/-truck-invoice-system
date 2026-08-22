import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Create a new vehicle
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      unitNumber,
      vin,
      year,
      make,
      model,
      engine,
      transmission,
      licensePlate,
      mileage,
      equipmentType
    } = req.body;

    if (!customerId || !vin) {
      res.status(400).json({ error: 'Customer ID and VIN are required' });
      return;
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Check if VIN already exists
    const existingVin = await prisma.vehicle.findUnique({ where: { vin } });
    if (existingVin) {
      res.status(400).json({ error: 'A vehicle with this VIN already exists' });
      return;
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        customerId,
        unitNumber,
        vin,
        year: year ? parseInt(year, 10) : null,
        make,
        model,
        engine,
        transmission,
        licensePlate,
        mileage: mileage ? parseInt(mileage, 10) : null,
        equipmentType
      }
    });

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// Get a single vehicle by ID
export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

// Update a vehicle
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Check if updating VIN and it conflicts
    if (data.vin && data.vin !== existingVehicle.vin) {
      const vinConflict = await prisma.vehicle.findUnique({ where: { vin: data.vin } });
      if (vinConflict) {
        res.status(400).json({ error: 'A vehicle with this VIN already exists' });
        return;
      }
    }

    // Parse integers if they are passed as strings
    if (data.year !== undefined) data.year = data.year ? parseInt(data.year, 10) : null;
    if (data.mileage !== undefined) data.mileage = data.mileage ? parseInt(data.mileage, 10) : null;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data
    });

    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle. Ensure it has no connected invoices.' });
  }
};
