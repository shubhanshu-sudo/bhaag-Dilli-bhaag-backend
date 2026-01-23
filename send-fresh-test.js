/**
 * Send FRESH test email with current timestamp
 */

require('dotenv').config();
const { sendRegistrationConfirmation } = require('./src/utils/emailService');
const { generateInvoice } = require('./src/utils/invoiceGenerator');

const currentTime = new Date().toLocaleTimeString('en-IN');

const testRegistration = {
    _id: '507f1f77bcf86cd799439011',
    name: `Test User - ${currentTime}`,
    email: process.env.SMTP_USER,
    phone: '9876543210',
    race: '5KM',
    tshirtSize: 'M',
    amount: 699,
    paymentStatus: 'paid',
    razorpayOrderId: 'order_test_123456789',
    razorpayPaymentId: 'pay_test_987654321',
    paymentDate: new Date(),
    createdAt: new Date()
};

async function sendFreshEmail() {
    console.log('\n📧 Sending FRESH test email...\n');
    console.log('⏰ Current Time:', currentTime);
    console.log('📋 Test Data:');
    console.log('   Name:', testRegistration.name);
    console.log('   Amount: ₹' + testRegistration.amount);
    console.log('   Race:', testRegistration.race);
    console.log('');

    try {
        // Generate invoice
        console.log('📄 Generating invoice...');
        const invoicePDF = await generateInvoice(testRegistration);
        console.log('✅ Invoice generated:', invoicePDF.length, 'bytes');
        console.log('');

        // Send email
        console.log('📧 Sending email...');
        const result = await sendRegistrationConfirmation(testRegistration, invoicePDF);

        console.log('✅ EMAIL SENT SUCCESSFULLY!');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📬 CHECK YOUR EMAIL NOW!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('Look for email with:');
        console.log('  Subject: Bhaag Dilli Bhaag – Registration Confirmed ✅');
        console.log('  Name in email: Test User -', currentTime);
        console.log('  Amount: ₹699');
        console.log('');
        console.log('In the PDF invoice, you should see:');
        console.log('  ✅ TOTAL AMOUNT PAID: ₹699');
        console.log('  ✅ All values right-aligned');
        console.log('  ✅ Clean professional layout');
        console.log('');
        console.log('Message ID:', result.messageId);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

sendFreshEmail();
