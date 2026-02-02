const express = require('express');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const stationRoutes = require('./routes/stationRoutes');
const measurementRoutes = require('./routes/measurementRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/health', healthRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// ERROR HANDLER (Must be last)
// ============================================

app.use(errorHandler);

module.exports = app;
