/**
 * Test Email Sending with Real Registration Data
 * 
 * This script simulates the webhook flow and sends an actual test email
 */

require('dotenv').config();
const { sendRegistrationConfirmation } = require('./src/utils/emailService');
const { generateInvoice } = require('./src/utils/invoiceGenerator');

// Sample registration data (simulating a real registration)
const testRegistration = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: process.env.SMTP_USER, // Send to your own email for testing
    phone: '9876543210',
    race: '5KM',
    tshirtSize: 'M',
    amount: 699, // 5KM race price
    paymentStatus: 'paid',
    razorpayOrderId: 'order_test_123456789',
    razorpayPaymentId: 'pay_test_987654321',
    paymentDate: new Date(),
    createdAt: new Date()
};

async function testEmailSending() {
    console.log('\n📧 Testing Email Sending with Invoice...\n');

    console.log('📋 Test Registration Data:');
    console.log(`   Name: ${testRegistration.name}`);
    console.log(`   Email: ${testRegistration.email}`);
    console.log(`   Race: ${testRegistration.race}`);
    console.log(`   Amount: ₹${testRegistration.amount}`);
    console.log('');

    try {
        // Step 1: Generate Invoice
        console.log('📄 Step 1: Generating PDF invoice...');
        const invoicePDF = await generateInvoice(testRegistration);
        console.log(`✅ Invoice generated (${invoicePDF.length} bytes)`);
        console.log('');

        // Step 2: Send Email
        console.log('📧 Step 2: Sending confirmation email...');
        console.log(`   To: ${testRegistration.email}`);
        console.log(`   Subject: Bhaag Dilli Bhaag – Registration Confirmed ✅`);
        console.log('');

        const result = await sendRegistrationConfirmation(testRegistration, invoicePDF);

        console.log('✅ SUCCESS: Email sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log('');
        console.log('📬 Check your email inbox:');
        console.log(`   Email: ${testRegistration.email}`);
        console.log(`   Subject: "Bhaag Dilli Bhaag – Registration Confirmed ✅"`);
        console.log('');
        console.log('📎 The email should contain:');
        console.log('   ✅ Success badge');
        console.log('   ✅ Registration details');
        console.log('   ✅ Payment information');
        console.log('   ✅ PDF invoice attachment');
        console.log('');
        console.log('💡 If you don\'t see it:');
        console.log('   1. Check spam/junk folder');
        console.log('   2. Wait a few seconds (email delivery may take time)');
        console.log('   3. Check the email address is correct\n');

    } catch (error) {
        console.error('\n❌ ERROR: Failed to send email');
        console.error(`   Error: ${error.message}`);
        console.error('');
        console.error('🔍 Troubleshooting:');
        console.error('   1. Check SMTP credentials in .env');
        console.error('   2. Verify Gmail App Password is correct');
        console.error('   3. Check internet connection');
        console.error('   4. Verify firewall allows port 587');
        console.error('');
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run test
testEmailSending();
