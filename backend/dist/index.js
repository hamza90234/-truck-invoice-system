import 'dotenv/config';
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import customerRoutes from './routes/customer.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import partRoutes from './routes/part.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import bankingRoutes from './routes/banking.routes.js';
import reportRoutes from './routes/report.routes.js';
import { requireAuth } from './middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';
const app = express();
app.set('trust proxy', 1);
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again later.' }
});
// Global API Auth Middleware
app.use('/api', (req, res, next) => {
    if (req.method === 'OPTIONS')
        return next();
    const isLogin = req.method === 'POST' && req.path === '/auth/login';
    const isPublicInvoice = req.method === 'GET' && req.path.startsWith('/invoices/public/');
    if (isLogin || isPublicInvoice) {
        return next();
    }
    return requireAuth(req, res, next);
});
app.use('/api/auth/login', loginLimiter);
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
app.use('/api/banking', bankingRoutes);
app.use('/api/reports', reportRoutes);
// Health Check
app.get('/', (req, res) => {
    res.send('Hussain Invoice System API is running...');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map