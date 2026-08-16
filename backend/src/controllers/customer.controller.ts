import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Get all customers
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get a single customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
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
