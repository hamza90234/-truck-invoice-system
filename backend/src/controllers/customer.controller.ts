import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Helper to send onboarding alert email
const sendOnboardingAlertEmail = async (customer: any, vehicle: any) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
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

    const shopProfile = await prisma.shopProfile.findFirst();
    const recipient = shopProfile?.email || process.env.SMTP_USER || 'Ajroadservicerepair@gmail.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.ajroadservicerepair.com';

    const vehicleText = vehicle?.unitNumber || vehicle?.vin
      ? `\nInitial Vehicle: Unit #${vehicle.unitNumber || 'N/A'}, VIN: ${vehicle.vin || 'N/A'} (${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''})`
      : '';

    await transporter.sendMail({
      from: `"${shopProfile?.shopName || 'AJ Road Service'}" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `🚚 New Customer Onboarding: ${customer.companyName}`,
      text: `Hello,\n\nA new customer registration has been submitted and is waiting for your review:\n\nCompany: ${customer.companyName}\nContact: ${customer.contactPerson || 'N/A'}\nPhone: ${customer.phone}\nEmail: ${customer.email || 'N/A'}\nUSDOT: ${customer.usdot || 'N/A'}\nMC#: ${customer.mcNumber || 'N/A'}${vehicleText}\n\nReview & Approve in Dashboard: ${frontendUrl}/customers/${customer.id}\n`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e40af; margin-top: 0;">🚚 New Customer Onboarding Request</h2>
          <p>A new customer has submitted their registration form and is pending your review.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Company:</strong> ${customer.companyName}</p>
            <p style="margin: 4px 0;"><strong>Contact Person:</strong> ${customer.contactPerson || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${customer.phone}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${customer.email || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>USDOT #:</strong> ${customer.usdot || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>MC #:</strong> ${customer.mcNumber || 'N/A'}</p>
            ${vehicle?.unitNumber || vehicle?.vin ? `<p style="margin: 4px 0;"><strong>Vehicle:</strong> Unit #${vehicle.unitNumber || 'N/A'} - ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} (VIN: ${vehicle.vin || 'N/A'})</p>` : ''}
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${frontendUrl}/customers/${customer.id}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Review & Approve Customer
            </a>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Error sending onboarding alert email:', err);
  }
};

// Get all customers (with optional status filter)
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vehicles: true }
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get count of pending customer onboarding submissions
export const getPendingCustomerCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.customer.count({
      where: { status: 'PENDING' } as any
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching pending customer count:', error);
    res.status(500).json({ error: 'Failed to fetch pending customer count' });
  }
};

// Public customer self-onboarding endpoint
export const onboardCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      billingAddress,
      serviceAddress,
      usdot,
      mcNumber,
      ein,
      notes,
      // Vehicle details if provided
      unitNumber,
      vin,
      year,
      make,
      model,
      licensePlate
    } = req.body;

    if (!companyName || !phone) {
      res.status(400).json({ error: 'Company Name and Phone Number are required.' });
      return;
    }

    // Create the customer with PENDING status
    const newCustomer = await prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        billingAddress: billingAddress?.trim() || null,
        serviceAddress: serviceAddress?.trim() || null,
        usdot: usdot?.trim() || null,
        mcNumber: mcNumber?.trim() || null,
        ein: ein?.trim() || null,
        notes: notes?.trim() || null,
        status: 'PENDING',
      } as any
    });

    // If initial vehicle info provided, register or link the vehicle
    let createdVehicle = null;
    if (vin || unitNumber) {
      try {
        const cleanVin = vin 
          ? vin.trim().toUpperCase() 
          : `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Check if vehicle with this VIN already exists
        const existingVehicle = await prisma.vehicle.findUnique({
          where: { vin: cleanVin }
        });

        if (existingVehicle) {
          // Safely link vehicle to this new customer
          createdVehicle = await prisma.vehicle.update({
            where: { id: existingVehicle.id },
            data: {
              customerId: newCustomer.id,
              ...(unitNumber ? { unitNumber: unitNumber.trim() } : {}),
              ...(year ? { year: parseInt(year, 10) || existingVehicle.year } : {}),
              ...(make ? { make: make.trim() } : {}),
              ...(model ? { model: model.trim() } : {}),
              ...(licensePlate ? { licensePlate: licensePlate.trim().toUpperCase() } : {}),
            }
          });
        } else {
          // Create new vehicle
          createdVehicle = await prisma.vehicle.create({
            data: {
              customerId: newCustomer.id,
              unitNumber: unitNumber?.trim() || null,
              vin: cleanVin,
              year: year ? parseInt(year, 10) || null : null,
              make: make?.trim() || null,
              model: model?.trim() || null,
              licensePlate: licensePlate?.trim()?.toUpperCase() || null,
            }
          });
        }
      } catch (vehErr) {
        console.warn('Vehicle creation warning during customer onboarding:', vehErr);
      }
    }

    // Fire email notification to shop in background
    sendOnboardingAlertEmail(newCustomer, { unitNumber, vin, year, make, model }).catch(err => {
      console.error('Email alert background failed:', err);
    });

    res.status(201).json({
      message: 'Onboarding application submitted successfully!',
      customer: newCustomer,
      vehicle: createdVehicle
    });
  } catch (error: any) {
    console.error('Error creating self-onboarded customer:', error);
    res.status(500).json({ error: error.message || 'Failed to submit customer onboarding.' });
  }
};

// Approve customer
export const approveCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        status: 'APPROVED',
        rejectionReason: null
      } as any,
      include: { vehicles: true }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error approving customer:', error);
    res.status(500).json({ error: 'Failed to approve customer' });
  }
};

// Reject customer
export const rejectCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Application rejected by shop administrator'
      } as any
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error rejecting customer:', error);
    res.status(500).json({ error: 'Failed to reject customer' });
  }
};

// Get a single customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        invoices: {
          include: {
            vehicle: true
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create a new customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      billingAddress,
      serviceAddress,
      usdot,
      mcNumber,
      ein,
      customerType,
      paymentTerms,
      notes
    } = req.body;

    // Validate required fields
    if (!companyName) {
      res.status(400).json({ error: 'Company Name is required' });
      return;
    }

    const newCustomer = await prisma.customer.create({
      data: {
        companyName,
        contactPerson,
        phone,
        email,
        billingAddress,
        serviceAddress,
        usdot,
        mcNumber,
        ein,
        customerType,
        paymentTerms,
        notes
      }
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update a customer
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data
    });

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete a customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    await prisma.customer.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer. Ensure they have no connected vehicles or invoices.' });
  }
};
