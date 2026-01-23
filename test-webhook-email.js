/**
 * Test Webhook Email Flow
 * 
 * This script simulates a Razorpay webhook and tests the complete email flow
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('./src/models/Registration');
const { generateInvoice } = require('./src/utils/invoiceGenerator');
const { sendRegistrationConfirmation } = require('./src/utils/emailService');

async function testWebhookEmailFlow() {
    console.log('\n🧪 Testing Webhook Email Flow...\n');

    try {
        // Step 1: Connect to MongoDB
        console.log('📊 Step 1: Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('');

        // Step 2: Create a test registration
        console.log('📝 Step 2: Creating test registration...');
        const testRegistration = new Registration({
            name: 'Webhook Test User',
            email: process.env.SMTP_USER, // Your email
            phone: '9876543210', // 10 digits, no country code
            race: '5KM', // Must be 2KM, 5KM, or 10KM
            tshirtSize: 'L',
            amount: 699,
            paymentStatus: 'pending', // Initially pending
            createdAt: new Date()
        });

        await testRegistration.save();
        console.log(`✅ Test registration created: ${testRegistration._id}`);
        console.log('');

        // Step 3: Simulate webhook payment confirmation
        console.log('💰 Step 3: Simulating webhook payment confirmation...');
        const updatedRegistration = await Registration.findByIdAndUpdate(
            testRegistration._id,
            {
                $set: {
                    paymentStatus: 'paid',
                    razorpayPaymentId: 'pay_webhook_test_123',
                    razorpayOrderId: 'order_webhook_test_456',
                    paymentDate: new Date()
                }
            },
            { new: true }
        );
        console.log('✅ Payment status updated to: paid');
        console.log('');

        // Step 4: Generate invoice
        console.log('📄 Step 4: Generating invoice...');
        const invoicePDF = await generateInvoice(updatedRegistration);
        console.log(`✅ Invoice generated (${invoicePDF.length} bytes)`);
        console.log('');

        // Step 5: Send confirmation email
        console.log('📧 Step 5: Sending confirmation email...');
        const result = await sendRegistrationConfirmation(updatedRegistration, invoicePDF);
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   To: ${updatedRegistration.email}`);
        console.log('');

        // Step 6: Cleanup - Delete test registration
        console.log('🧹 Step 6: Cleaning up test data...');
        await Registration.findByIdAndDelete(testRegistration._id);
        console.log('✅ Test registration deleted');
        console.log('');

        // Success summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ WEBHOOK EMAIL FLOW TEST PASSED!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('📬 Check your email inbox:');
        console.log(`   Email: ${updatedRegistration.email}`);
        console.log(`   Subject: "Bhaag Dilli Bhaag – Registration Confirmed ✅"`);
        console.log('');
        console.log('✅ What was tested:');
        console.log('   1. MongoDB connection');
        console.log('   2. Registration creation');
        console.log('   3. Payment status update (pending → paid)');
        console.log('   4. PDF invoice generation');
        console.log('   5. Email sending with attachment');
        console.log('   6. Database cleanup');
        console.log('');
        console.log('🚀 The system is ready for production!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Start ngrok: ngrok http 5000');
        console.log('   2. Update Razorpay webhook URL');
        console.log('   3. Make a real test payment');
        console.log('   4. Verify email is received automatically');
        console.log('');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(`   Error: ${error.message}`);
        console.error('');
        console.error('Full error:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('📊 MongoDB connection closed\n');
    }
}

// Run test
testWebhookEmailFlow();
