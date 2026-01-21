const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',           // Local development
        'http://localhost:3001',           // Alternative local port
        'https://your-vercel-app.vercel.app', // Replace with your Vercel URL
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

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/register', require('./routes/register.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bhaag Dilli Bhaag API - Phase 2',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            register: '/api/register',
            adminLogin: '/api/admin/login',
            adminRegistrations: '/api/admin/registrations (Protected)',
            adminStats: '/api/admin/stats (Protected)'
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
