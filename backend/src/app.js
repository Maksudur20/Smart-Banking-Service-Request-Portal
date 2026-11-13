const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const documentRoutes = require('./routes/documentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const kycRoutes = require('./routes/kycRoutes');
const depositRoutes = require('./routes/depositRoutes');
const transferRoutes = require('./routes/transferRoutes');
const closureRoutes = require('./routes/closureRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');

const app = express();

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for academic prototype with CDN icons/fonts and inline scripts
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiter to all API routes
app.use('/api', apiLimiter);

// Anti-caching headers for banking security (prevents browser Back/Forward bfcache)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Serve Frontend static files directly from Express
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// API Root Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Smart Banking Service Request Portal API',
    database: 'Supabase PostgreSQL',
    storage: 'Cloudinary',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/account-closure', closureRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// Fallback to index.html for frontend root access
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error and not found handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

