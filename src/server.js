require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Validate environment variables
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}

if (!process.env.PORT) {
    console.warn('⚠️  PORT is not defined, using default port 5000');
}

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode`);
            console.log(`📡 Server listening on port ${PORT}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`\n✅ Phase-1 Backend Ready!`);
            console.log(`\nAvailable endpoints:`);
            console.log(`  - GET  /health`);
            console.log(`  - POST /api/register`);
            console.log(`  - GET  /api/register/:id\n`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

// Start the server
startServer();
