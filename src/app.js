const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',           // Local development
        'http://localhost:3001',           // Alternative local port
        'https://bhaag-dilli-bhaag-8bd2.vercel.app', // Vercel production (no trailing slash)
        'http://bhaag-dilli-bhaag-8bd2.vercel.app',  // Vercel http variant
        // Add more frontend URLs as needed
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================================================
// KEEP-ALIVE ENDPOINTS FOR RENDER FREE TIER
// ============================================================================
// These endpoints prevent Render free-tier services from going to sleep
// after 15 minutes of inactivity. They are designed to be:
// - Extremely lightweight (no DB, no auth, no business logic)
// - Safe to call frequently (every 5-10 minutes via CRON)
// - Fast response time (< 50ms)
//
// IMPORTANT: These routes are placed BEFORE heavy middleware to ensure
// minimal processing overhead. Do NOT add authentication or database
// calls to these endpoints.
// ============================================================================

/**
 * @route   GET /ping
 * @desc    Ultra-lightweight keep-alive endpoint for CRON services
 * @access  Public (no auth required)
 * @purpose Prevent Render free-tier sleep mode
 * 
 * This is the RECOMMENDED endpoint for external CRON jobs because:
 * - Minimal response payload (smaller bandwidth)
 * - No logging in production (reduces noise)
 * - Fastest possible response time
 */
app.get('/ping', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET /health
 * @desc    Health check endpoint with service status
 * @access  Public (no auth required)
 * @purpose Monitor service health + keep-alive
 * 
 * Use this endpoint when you need:
 * - Service uptime verification
 * - Health monitoring dashboards
 * - More detailed status information
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service is alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// API Routes
app.use('/api/register', require('./routes/register.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bhaag Dilli Bhaag API - Phase 2',
        version: '2.0.0',
        endpoints: {
            ping: '/ping (Keep-alive for Render free tier)',
            health: '/health (Service health check)',
            register: '/api/register',
            adminLogin: '/api/admin/login',
            adminRegistrations: '/api/admin/registrations (Protected)',
            adminStats: '/api/admin/stats (Protected)',
            createPaymentOrder: '/api/payments/create-order'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
