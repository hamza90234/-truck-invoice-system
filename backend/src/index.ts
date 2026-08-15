import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import customerRoutes from './routes/customer.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/customers', customerRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Hussain Invoice System API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
