/**
 * Generate and save invoice PDF locally for debugging
 */

require('dotenv').config();
const fs = require('fs');
const { generateInvoice } = require('./src/utils/invoiceGenerator');

const testRegistration = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com',
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

async function testInvoice() {
    console.log('\n📄 Generating invoice PDF...\n');
    console.log('Test Data:');
    console.log('  Amount:', testRegistration.amount);
    console.log('  Race:', testRegistration.race);
    console.log('');

    try {
        const pdfBuffer = await generateInvoice(testRegistration);

        const filename = 'test-invoice.pdf';
        fs.writeFileSync(filename, pdfBuffer);

        console.log('✅ Invoice saved:', filename);
        console.log('   Size:', pdfBuffer.length, 'bytes');
        console.log('');
        console.log('Open the PDF to verify:');
        console.log('  - Amount shows: ₹699');
        console.log('  - All fields are right-aligned');
        console.log('  - Layout looks professional');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

testInvoice();
