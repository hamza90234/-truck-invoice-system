import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import customerRoutes from './routes/customer.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import partRoutes from './routes/part.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import expenseRoutes from './routes/expense.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/expenses', expenseRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Hussain Invoice System API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
