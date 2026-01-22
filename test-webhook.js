/**
 * Razorpay Webhook Test Script
 * 
 * This script simulates a Razorpay webhook to test the webhook endpoint locally.
 * Run with: node test-webhook.js
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'http://localhost:5000/api/payments/webhook';
const WEBHOOK_SECRET = 'bhaag-dilli-bhaag-webhook-secret-2026';

// Test webhook payload (payment.captured event)
const webhookPayload = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
        payment: {
            entity: {
                id: 'pay_test_' + Date.now(),
                entity: 'payment',
                amount: 49900, // 499 rupees in paise
                currency: 'INR',
                status: 'captured',
                order_id: 'order_test_' + Date.now(), // Replace with actual order ID from your DB
                invoice_id: null,
                international: false,
                method: 'card',
                amount_refunded: 0,
                refund_status: null,
                captured: true,
                description: '2KM Race Registration',
                card_id: 'card_test123',
                bank: null,
                wallet: null,
                vpa: null,
                email: 'test@example.com',
                contact: '+919876543210',
                created_at: Math.floor(Date.now() / 1000)
            }
        }
    },
    created_at: Math.floor(Date.now() / 1000)
};

/**
 * Generate webhook signature
 */
function generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');
    return signature;
}

/**
 * Send webhook to local server
 */
async function testWebhook() {
    try {
        console.log('🧪 Testing Razorpay Webhook');
        console.log('='.repeat(50));

        // Convert payload to string
        const payloadString = JSON.stringify(webhookPayload);

        // Generate signature
        const signature = generateSignature(webhookPayload, WEBHOOK_SECRET);

        console.log('\n📦 Webhook Payload:');
        console.log(JSON.stringify(webhookPayload, null, 2));

        console.log('\n🔐 Generated Signature:');
        console.log(signature);

        console.log('\n📡 Sending webhook to:', WEBHOOK_URL);

        // Send webhook request
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': signature
            },
            body: payloadString
        });

        const result = await response.json();

        console.log('\n📨 Response Status:', response.status);
        console.log('📨 Response Body:');
        console.log(JSON.stringify(result, null, 2));

        if (response.ok && result.success) {
            console.log('\n✅ Webhook test PASSED');
        } else {
            console.log('\n❌ Webhook test FAILED');
        }

        console.log('\n' + '='.repeat(50));

    } catch (error) {
        console.error('\n❌ Error testing webhook:', error.message);
    }
}

// Instructions
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Make sure your backend server is running (npm run dev)');
console.log('2. Update the order_id in the payload with a real order ID from your database');
console.log('3. Run this script: node test-webhook.js');
console.log('4. Check your database to verify payment status updated to "Completed"\n');

// Prompt user
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Have you updated the order_id in the script? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        testWebhook();
    } else {
        console.log('\n⚠️  Please update the order_id in the script first!');
        console.log('Find a valid order_id from your database (Registration.razorpayOrderId)');
    }
    readline.close();
});
