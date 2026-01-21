require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Validate environment variables
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}

if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL is not defined in .env file');
    process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD is not defined in .env file');
    process.exit(1);
}

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

        if (existingAdmin) {
            console.log('⚠️  Admin already exists with email:', process.env.ADMIN_EMAIL);
            console.log('✅ No action needed. Admin creation script completed.');
            process.exit(0);
        }

        // Create new admin
        const admin = await Admin.create({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD // Will be hashed by pre-save hook
        });

        console.log('✅ Admin created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('🔒 Password has been securely hashed');
        console.log('\n⚠️  IMPORTANT: Remove ADMIN_PASSWORD from .env after first run for security');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

// Run the script
createAdmin();
