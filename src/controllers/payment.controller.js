const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getRacePrice, isValidRaceCategory } = require('../config/raceConfig');
const Registration = require('../models/Registration');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order with backend-determined pricing
 * @access  Public
 * 
 * Security Features:
 * - Amount is NEVER accepted from frontend
 * - Price is determined strictly by backend using raceConfig
 * - Validates race category before processing
 * - Prevents price manipulation attacks
 */
const createOrder = async (req, res) => {
    try {
        const { raceCategory } = req.body;

        // Validation: Check if raceCategory is provided
        if (!raceCategory) {
            return res.status(400).json({
                success: false,
                message: 'Race category is required'
            });
        }

        // Validation: Check if raceCategory is valid
        if (!isValidRaceCategory(raceCategory)) {
            return res.status(400).json({
                success: false,
                message: `Invalid race category: ${raceCategory}. Valid categories are: 2KM, 5KM, 10KM`
            });
        }

        // CRITICAL: Get price from backend config (NOT from frontend)
        // This prevents price manipulation attacks
        const amount = getRacePrice(raceCategory);

        // Generate unique receipt ID
        const receiptId = `receipt_${raceCategory}_${Date.now()}`;

        // Razorpay order options
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
            currency: 'INR',
            receipt: receiptId,
            notes: {
                raceCategory: raceCategory,
                createdAt: new Date().toISOString()
            }
        };

        // Create Razorpay order
        const order = await razorpay.orders.create(options);

        // Return order details to frontend
        return res.status(200).json({
            success: true,
            orderId: order.id,
            amount: amount, // Amount in rupees
            currency: order.currency,
            receipt: order.receipt,
            raceCategory: raceCategory
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);

        // Handle Razorpay-specific errors
        if (error.error) {
            return res.status(400).json({
                success: false,
                message: 'Payment gateway error',
                error: process.env.NODE_ENV === 'development' ? error.error.description : undefined
            });
        }

        // Handle general errors
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature (does NOT mark as paid)
 * @access  Public
 * 
 * Security Features:
 * - Verifies payment signature using HMAC SHA256
 * - Validates payment authenticity
 * - Does NOT update payment status (webhook will do that)
 * - Saves payment IDs for webhook matching
 * 
 * Note: Payment status remains 'pending' after this call.
 * Only the webhook (payment.captured) will update status to 'paid'.
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

        // Validation: Check if all required fields are provided
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)'
            });
        }

        // CRITICAL: Verify payment signature
        // This ensures the payment was actually made through Razorpay
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Compare signatures
        if (generatedSignature !== razorpay_signature) {
            console.error('Payment signature verification failed');
            console.error('Expected:', generatedSignature);
            console.error('Received:', razorpay_signature);

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Invalid signature.'
            });
        }

        // Signature is valid - Save payment IDs but DON'T change status
        if (registrationId) {
            const registration = await Registration.findById(registrationId);

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Registration not found'
                });
            }

            // Save payment IDs for webhook matching
            // Status remains 'pending' - webhook will update to 'paid'
            registration.razorpayOrderId = razorpay_order_id;
            registration.razorpayPaymentId = razorpay_payment_id;
            registration.paymentDate = new Date();

            await registration.save();

            return res.status(200).json({
                success: true,
                message: 'Payment signature verified. Awaiting confirmation.',
                registrationId: registration._id,
                paymentStatus: registration.paymentStatus // Will be 'pending'
            });
        }

        // If no registrationId provided, just verify signature
        return res.status(200).json({
            success: true,
            message: 'Payment signature verified successfully',
            verified: true
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public (verified by webhook signature)
 * 
 * Security Features:
 * - Verifies webhook signature using HMAC SHA256
 * - Uses RAZORPAY_WEBHOOK_SECRET for validation
 * - Only processes payment.captured events
 * - Updates payment status to paid
 * 
 * Note: This endpoint uses express.raw() middleware to receive raw body
 * for signature verification. The raw body is required for HMAC validation.
 */
const handleWebhook = async (req, res) => {
    try {
        // Get webhook signature from headers
        const webhookSignature = req.headers['x-razorpay-signature'];

        if (!webhookSignature) {
            console.error('Webhook signature missing');
            return res.status(400).json({
                success: false,
                message: 'Webhook signature missing'
            });
        }

        // CRITICAL: req.body is a Buffer when using express.raw()
        // Convert Buffer to string for signature verification
        const webhookBody = req.body.toString('utf8');

        console.log('Webhook received - verifying signature...');

        // CRITICAL: Verify webhook signature
        // This ensures the webhook is actually from Razorpay
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        // Compare signatures
        if (expectedSignature !== webhookSignature) {
            console.error('Webhook signature verification failed');
            console.error('Expected:', expectedSignature);
            console.error('Received:', webhookSignature);

            return res.status(400).json({
                success: false,
                message: 'Invalid webhook signature'
            });
        }

        // Signature is valid - Parse the webhook payload
        const webhookData = JSON.parse(webhookBody);
        const event = webhookData.event;

        console.log('Webhook received:', event);

        // Handle only payment.captured event
        if (event === 'payment.captured') {
            const payment = webhookData.payload.payment.entity;
            const paymentId = payment.id;
            const orderId = payment.order_id;
            const amount = payment.amount / 100; // Convert from paise to rupees

            console.log('Payment captured:', {
                paymentId,
                orderId,
                amount
            });

            // Find registration by razorpayOrderId
            const registration = await Registration.findOne({ razorpayOrderId: orderId });

            if (!registration) {
                console.error('Registration not found for order:', orderId);
                // Still return 200 to Razorpay to acknowledge receipt
                return res.status(200).json({
                    success: true,
                    message: 'Webhook received but registration not found'
                });
            }

            // Update payment status to paid
            registration.paymentStatus = 'paid';
            registration.razorpayPaymentId = paymentId;

            // Update payment date if not already set
            if (!registration.paymentDate) {
                registration.paymentDate = new Date();
            }

            await registration.save();

            console.log('Payment confirmed for registration:', registration._id);

            // Return 200 OK to Razorpay
            return res.status(200).json({
                success: true,
                message: 'Payment confirmed successfully'
            });
        }

        // For other events, just acknowledge receipt
        console.log('Webhook event ignored:', event);
        return res.status(200).json({
            success: true,
            message: 'Webhook received'
        });

    } catch (error) {
        console.error('Error processing webhook:', error);

        // Return 200 even on error to prevent Razorpay from retrying
        // Log the error for manual investigation
        return res.status(200).json({
            success: false,
            message: 'Webhook processing error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   GET /api/payments/status/:registrationId
 * @desc    Check payment status for a registration (for polling)
 * @access  Public
 * 
 * This endpoint allows the frontend to poll for payment status updates
 * after the webhook has been received and processed.
 */
const checkPaymentStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await Registration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        return res.status(200).json({
            success: true,
            paymentStatus: registration.paymentStatus,
            razorpayOrderId: registration.razorpayOrderId,
            razorpayPaymentId: registration.razorpayPaymentId,
            paymentDate: registration.paymentDate
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check payment status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    checkPaymentStatus
};
