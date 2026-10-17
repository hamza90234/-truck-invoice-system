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
      licensePlateState,
      color,
      trailerType,
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
    const existingVin = await prisma.vehicle.findUnique({ where: { vin: vin.trim().toUpperCase() } });
    if (existingVin) {
      res.status(400).json({ error: 'A vehicle with this VIN already exists' });
      return;
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        customerId,
        unitNumber: unitNumber ? unitNumber.trim() : null,
        vin: vin.trim().toUpperCase(),
        year: year ? parseInt(year, 10) : null,
        make: make ? make.trim() : null,
        model: model ? model.trim() : null,
        engine: engine ? engine.trim() : null,
        transmission: transmission ? transmission.trim() : null,
        licensePlate: licensePlate ? licensePlate.trim().toUpperCase() : null,
        licensePlateState: licensePlateState ? licensePlateState.trim().toUpperCase() : null,
        color: color ? color.trim() : null,
        trailerType: trailerType ? trailerType.trim() : null,
        mileage: mileage ? parseInt(mileage, 10) : null,
        equipmentType: equipmentType || 'TRUCK'
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

// Send scheduled maintenance / oil change reminder email
export const sendServiceReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { customNote } = req.body || {};

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const customer = vehicle.customer;
    if (!customer || (!customer.email && !customer.additionalEmails)) {
      res.status(400).json({ error: 'Customer has no email address on file to send a reminder.' });
      return;
    }

    const recipientEmails = [
      customer.email,
      ...(customer.additionalEmails ? customer.additionalEmails.split(',').map((e: string) => e.trim()) : [])
    ].filter(Boolean) as string[];

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      res.status(500).json({ error: 'Email service (SMTP) is not configured.' });
      return;
    }

    const shopProfile = await prisma.shopProfile.findFirst();
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const shopName = shopProfile?.shopName || 'AJ Truck Repair and Mobile Road Service';
    const shopPhone = shopProfile?.phone || '909-500-0909';
    const shopAddress = shopProfile?.address || 'Riverside, CA';

    const unitInfo = vehicle.unitNumber ? `Unit #${vehicle.unitNumber}` : (vehicle.vin || 'Vehicle');
    const vehicleDesc = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Commercial Vehicle';

    await transporter.sendMail({
      from: `"${shopName}" <${process.env.SMTP_USER}>`,
      to: recipientEmails.join(', '),
      subject: `🔧 Scheduled Maintenance & Oil Change Reminder for ${unitInfo}`,
      text: `Hello ${customer.contactPerson || customer.companyName},\n\nThis is a friendly maintenance reminder from ${shopName} that your vehicle (${unitInfo} — ${vehicleDesc}, VIN: ${vehicle.vin || 'N/A'}) is due for scheduled preventative maintenance / oil change.\n\n${customNote ? `${customNote}\n\n` : ''}Regular oil changes, fluid checks, and lubrication keep your engine running smoothly and prevent costly DOT violations or roadside breakdowns.\n\nTo schedule your in-shop or mobile road service, please call us at ${shopPhone} or reply to this email.\n\nThank you for choosing ${shopName}!\n${shopAddress}\n${shopPhone}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">🔧 Scheduled Maintenance & Oil Change Reminder</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">${shopName}</p>
          </div>
          
          <p style="font-size: 15px; color: #1e293b; line-height: 1.5;">Dear <strong>${customer.contactPerson || customer.companyName}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            This is a friendly service reminder that your equipment is due for scheduled preventative maintenance and oil service:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Unit Number:</strong> <span style="background-color: #fef3c7; color: #78350f; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${vehicle.unitNumber || 'N/A'}</span></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Vehicle:</strong> ${vehicleDesc}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>VIN:</strong> <code style="font-family: monospace;">${vehicle.vin || 'N/A'}</code></p>
            ${vehicle.licensePlate ? `<p style="margin: 4px 0; font-size: 14px;"><strong>License Plate:</strong> ${vehicle.licensePlate} ${vehicle.licensePlateState ? `(${vehicle.licensePlateState})` : ''}</p>` : ''}
            ${vehicle.mileage ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Last Recorded Odometer:</strong> ${vehicle.mileage.toLocaleString()} mi</p>` : ''}
          </div>

          ${customNote ? `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0; border-radius: 6px; font-size: 13px; color: #1e40af;"><strong>Shop Note:</strong> ${customNote}</div>` : ''}

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Routine oil service, filter replacements, and safety inspections keep your trucks operating at peak performance and prevent costly roadside breakdowns.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="tel:${shopPhone}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              📞 Call ${shopPhone} to Schedule
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b; text-align: center;">
            <p style="margin: 2px 0;"><strong>${shopName}</strong></p>
            <p style="margin: 2px 0;">${shopAddress}</p>
            <p style="margin: 2px 0;">Phone: ${shopPhone}</p>
          </div>
        </div>
      `
    });

    res.status(200).json({ success: true, message: `Oil change reminder email sent to ${recipientEmails.join(', ')}` });
  } catch (error: any) {
    console.error('Error sending service reminder:', error);
    res.status(500).json({ error: error.message || 'Failed to send service reminder email' });
  }
};
