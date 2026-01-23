const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getRacePrice, isValidRaceCategory } = require('../config/raceConfig');
const Registration = require('../models/Registration');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { sendRegistrationConfirmation } = require('../utils/emailService');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Helper to trigger email instantly with de-duplication
 */
const triggerInstantEmail = async (registrationId, source = 'UNKNOWN') => {
    const logPath = path.join(process.cwd(), 'email-debug.log');
    const logMessage = (msg) => {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `${timestamp} - ${msg}\n`);
    };

    try {
        // Fetch fresh registration to check flags
        const registration = await Registration.findById(registrationId);

        if (!registration) {
            logMessage(`❌ [${source}] Registration not found: ${registrationId}`);
            return;
        }

        // de-duplication check
        if (registration.confirmationEmailSent) {
            logMessage(`ℹ️ [${source}] Email already sent for ${registrationId}. Skipping.`);
            return;
        }

        logMessage(`📧 [${source}] Triggering instant email for ${registrationId} (${registration.email})`);

        // Generate PDF invoice
        const invoicePDF = await generateInvoice(registration);
        logMessage(`✅ [${source}] Invoice generated`);

        // Send email
        const result = await sendRegistrationConfirmation(registration, invoicePDF);

        // Mark as sent in DB
        registration.confirmationEmailSent = true;
        await registration.save();

        logMessage(`✅ [${source}] Email sent successfully. MsgID: ${result.messageId}`);
    } catch (error) {
        logMessage(`❌ [${source}] Email Error: ${error.message}`);
        console.error(`[${source}] Email Error:`, error);
    }
};

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order with backend-determined pricing
 */
const createOrder = async (req, res) => {
    try {
        const { raceCategory, registrationId } = req.body;

        if (!raceCategory || !registrationId) {
            return res.status(400).json({
                success: false,
                message: 'Race category and Registration ID are required'
            });
        }

        if (!isValidRaceCategory(raceCategory)) {
            return res.status(400).json({
                success: false,
                message: `Invalid race category: ${raceCategory}`
            });
        }

        const amount = getRacePrice(raceCategory);
        const receiptId = `receipt_${raceCategory}_${Date.now()}`;

        const options = {
            amount: amount * 100, // paise
            currency: 'INR',
            receipt: receiptId,
            notes: {
                registrationId: registrationId,
                raceCategory: raceCategory
            }
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            orderId: order.id,
            amount: amount,
            currency: order.currency,
            receipt: order.receipt,
            raceCategory: raceCategory
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature
 */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification fields'
            });
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Invalid signature.'
            });
        }

        if (registrationId) {
            // CRITICAL: Update status to 'paid' immediately upon signature verification
            // This provides the "Instant" feedback the user wants
            const registration = await Registration.findByIdAndUpdate(
                registrationId,
                {
                    $set: {
                        paymentStatus: 'paid',
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        paymentDate: new Date(),
                        step: 'completed'
                    }
                },
                { new: true }
            );

            if (registration) {
                console.log('✅ INSTANT POS: Signature verified, marking as paid:', registrationId);

                // TRIGGER EMAIL FLOW IMMEDIATELY
                setImmediate(() => triggerInstantEmail(registrationId, 'VERIFY_PAYMENT'));
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully and confirmation dispatched.',
            verified: true
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 */
const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        if (!webhookSignature) {
            return res.status(400).json({ success: false, message: 'Webhook signature missing' });
        }

        const webhookBody = req.body.toString('utf8');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const webhookData = JSON.parse(webhookBody);
        const event = webhookData.event;

        if (event === 'payment.captured') {
            const payment = webhookData.payload.payment.entity;
            const registrationId = payment.notes?.registrationId;

            if (!registrationId) {
                return res.status(200).json({ success: true, message: 'No registrationId in notes' });
            }

            // Webhook serves as secondary confirmation
            // If verifyPayment already marked it 'paid', this just ensures all IDs are correct
            const updatedRegistration = await Registration.findByIdAndUpdate(
                registrationId,
                {
                    $set: {
                        paymentStatus: 'paid',
                        razorpayPaymentId: payment.id,
                        razorpayOrderId: payment.order_id,
                        paymentDate: new Date(),
                        step: 'completed'
                    }
                },
                { new: true }
            );

            if (updatedRegistration) {
                console.log('✅ WEBHOOK: Confirmed capture for:', registrationId);

                // TRIGGER EMAIL FLOW (Will self-deduplicate if already sent by verifyPayment)
                setImmediate(() => triggerInstantEmail(registrationId, 'WEBHOOK'));
            }
        }

        return res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(200).json({ success: false, message: 'Internal error' });
    }
};

/**
 * @route   GET /api/payments/status/:registrationId
 */
const checkPaymentStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        return res.status(200).json({
            success: true,
            paymentStatus: registration.paymentStatus,
            razorpayOrderId: registration.razorpayOrderId,
            razorpayPaymentId: registration.razorpayPaymentId,
            paymentDate: registration.paymentDate
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * @route   GET /api/payments/invoice/:registrationId
 */
const downloadInvoice = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration.findById(registrationId);

        if (!registration || registration.paymentStatus !== 'paid') {
            return res.status(404).json({ success: false, message: 'Invoice not available' });
        }

        const invoicePDF = await generateInvoice(registration);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${registrationId}.pdf`);
        return res.status(200).send(invoicePDF);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @route   GET /api/payments/test-email/:registrationId
 */
const testEmail = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const registration = await Registration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        console.log(`Manual test email triggered for: ${registration.email}`);

        const invoicePDF = await generateInvoice(registration);
        const result = await sendRegistrationConfirmation(registration, invoicePDF);

        return res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            messageId: result.messageId,
            to: registration.email
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    checkPaymentStatus,
    downloadInvoice,
    testEmail
};
