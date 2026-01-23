/**
 * Test Email Configuration
 * 
 * This script verifies that your SMTP configuration is working correctly.
 * Run this before testing the full payment flow.
 */

require('dotenv').config();
const { verifyEmailConfig } = require('./src/utils/emailService');

async function testEmailConfig() {
    console.log('\n🧪 Testing Email Configuration...\n');

    console.log('📋 Current SMTP Settings:');
    console.log(`   Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
    console.log(`   Port: ${process.env.SMTP_PORT || 'NOT SET'}`);
    console.log(`   User: ${process.env.SMTP_USER || 'NOT SET'}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
    console.log('');

    // Check if all required variables are set
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ ERROR: Missing SMTP configuration in .env file');
        console.log('\n📝 Required variables:');
        console.log('   SMTP_HOST=smtp.gmail.com');
        console.log('   SMTP_PORT=587');
        console.log('   SMTP_USER=your-email@gmail.com');
        console.log('   SMTP_PASS=your-app-password');
        console.log('\n💡 For Gmail App Password:');
        console.log('   1. Go to Google Account Settings');
        console.log('   2. Security → 2-Step Verification');
        console.log('   3. App Passwords → Generate new password');
        console.log('   4. Copy the 16-character password to SMTP_PASS\n');
        process.exit(1);
    }

    // Verify SMTP connection
    console.log('🔌 Connecting to SMTP server...\n');

    try {
        const isValid = await verifyEmailConfig();

        if (isValid) {
            console.log('\n✅ SUCCESS: Email configuration is working!');
            console.log('\n📧 You can now send confirmation emails.');
            console.log('\n🚀 Next steps:');
            console.log('   1. Start ngrok: ngrok http 5000');
            console.log('   2. Update Razorpay webhook URL');
            console.log('   3. Make a test payment');
            console.log('   4. Check your email inbox\n');
        } else {
            console.log('\n❌ FAILED: Could not connect to email server');
            console.log('\n🔍 Troubleshooting:');
            console.log('   1. Verify SMTP credentials in .env');
            console.log('   2. Check if 2-Step Verification is enabled (Gmail)');
            console.log('   3. Generate a new App Password');
            console.log('   4. Check firewall settings (port 587)\n');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\n🔍 Common issues:');
        console.log('   - Invalid credentials');
        console.log('   - App Password not generated (Gmail)');
        console.log('   - Firewall blocking port 587');
        console.log('   - SMTP server down\n');
    }
}

// Run test
testEmailConfig();
