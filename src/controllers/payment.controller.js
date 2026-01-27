const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getRacePrice, isValidRaceCategory, getPaymentBreakdown } = require('../config/raceConfig');
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
 * @desc    Create Razorpay order with backend-determined pricing (includes gateway fee)
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

        // Get payment breakdown (base amount + gateway fee)
        const paymentBreakdown = getPaymentBreakdown(raceCategory);
        const { baseAmount, gatewayFee, chargedAmount } = paymentBreakdown;

        const receiptId = `receipt_${raceCategory}_${Date.now()}`;

        const options = {
            amount: chargedAmount * 100, // paise (charged amount includes gateway fee)
            currency: 'INR',
            receipt: receiptId,
            notes: {
                registrationId: registrationId,
                raceCategory: raceCategory,
                baseAmount: baseAmount,
                gatewayFee: gatewayFee,
                chargedAmount: chargedAmount
            }
        };

        const order = await razorpay.orders.create(options);

        console.log(`💰 Order created: Base ₹${baseAmount} + Fee ₹${gatewayFee} = Total ₹${chargedAmount}`);

        return res.status(200).json({
            success: true,
            orderId: order.id,
            // Payment breakdown for frontend display
            baseAmount: baseAmount,           // Registration fee (what merchant receives)
            gatewayFee: gatewayFee,           // Payment gateway charges
            chargedAmount: chargedAmount,     // Total charged to user
            amount: chargedAmount,            // For backward compatibility
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
 * @desc    Verify Razorpay payment signature and update registration with payment amounts
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
            // Fetch order details from Razorpay to get the payment amounts
            let baseAmount, chargedAmount;
            try {
                const order = await razorpay.orders.fetch(razorpay_order_id);
                // Amount is in paise, convert to rupees
                chargedAmount = order.amount / 100;
                baseAmount = order.notes?.baseAmount ? parseInt(order.notes.baseAmount) : chargedAmount;
            } catch (orderError) {
                console.error('Error fetching order details:', orderError);
                // Fallback to just chargedAmount if order fetch fails
                chargedAmount = null;
                baseAmount = null;
            }

            // CRITICAL: Update status to 'paid' immediately upon signature verification
            // This provides the "Instant" feedback the user wants
            const updateData = {
                paymentStatus: 'paid',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                paymentDate: new Date(),
                step: 'completed'
            };

            // Add amounts if fetched successfully
            if (baseAmount !== null) {
                updateData.baseAmount = baseAmount;
            }
            if (chargedAmount !== null) {
                updateData.chargedAmount = chargedAmount;
            }

            const registration = await Registration.findByIdAndUpdate(
                registrationId,
                { $set: updateData },
                { new: true }
            );

            if (registration) {
                console.log(`✅ INSTANT POS: Signature verified, marking as paid: ${registrationId}`);
                console.log(`   💵 Base: ₹${baseAmount}, Charged: ₹${chargedAmount}`);

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
 * Payment Status Constants
 */
const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'paid',
    FAILED: 'failed',
    ABANDONED: 'abandoned'
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events (captured and failed)
 */
const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        if (!webhookSignature) {
            return res.status(400).json({ success: false, message: 'Webhook signature missing' });
        }

        // Verify webhook signature
        const webhookBody = req.body.toString('utf8');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            console.error('❌ WEBHOOK: Invalid signature detected');
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const webhookData = JSON.parse(webhookBody);
        const event = webhookData.event;
        const payment = webhookData.payload.payment?.entity;
        const registrationId = payment?.notes?.registrationId;

        if (!registrationId) {
            console.warn('⚠️ WEBHOOK: Received event without registrationId in notes:', event);
            return res.status(200).json({ success: true, message: 'No registrationId mapping - skipped' });
        }

        // Handle SUCCESS (Captured)
        if (event === 'payment.captured' || event === 'order.paid') {
            const registration = await Registration.findById(registrationId);

            // Idempotency: Only update if not already paid
            if (registration && registration.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
                registration.paymentStatus = PAYMENT_STATUS.SUCCESS;
                registration.razorpayPaymentId = payment.id;
                registration.razorpayOrderId = payment.order_id;
                registration.paymentDate = new Date();
                registration.step = 'completed';

                // Store payment amounts from notes (set during order creation)
                if (payment.notes?.baseAmount) {
                    registration.baseAmount = parseInt(payment.notes.baseAmount);
                }
                if (payment.notes?.chargedAmount) {
                    registration.chargedAmount = parseInt(payment.notes.chargedAmount);
                } else if (payment.amount) {
                    // Fallback: use payment amount (in paise, convert to rupees)
                    registration.chargedAmount = payment.amount / 100;
                }

                await registration.save();

                console.log('✅ WEBHOOK: Payment Success confirmed for:', registrationId);
                console.log(`   💵 Base: ₹${registration.baseAmount}, Charged: ₹${registration.chargedAmount}`);

                // Trigger email (de-duplicated inside function)
                setImmediate(() => triggerInstantEmail(registrationId, 'WEBHOOK_SUCCESS'));
            }
        }

        // Handle FAILURE
        if (event === 'payment.failed') {
            const registration = await Registration.findById(registrationId);

            // Only mark as failed if it's currently pending (don't overwrite a success if it happened weirdly out of order)
            if (registration && registration.paymentStatus === PAYMENT_STATUS.PENDING) {
                registration.paymentStatus = PAYMENT_STATUS.FAILED;
                registration.failureReason = payment.error_description || 'Payment rejected by bank or gateway';
                registration.failureCode = payment.error_code || 'PAYMENT_FAILED';
                registration.razorpayPaymentId = payment.id;
                registration.razorpayOrderId = payment.order_id;
                await registration.save();

                console.log('❌ WEBHOOK: Payment Failed recorded for:', registrationId, '-', registration.failureReason);
            }
        }

        // Always return 200 to Razorpay
        return res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('🔥 WEBHOOK: Internal processing error:', error);
        // Still return 200 so Razorpay doesn't keep retrying if it's a code error on our side
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
            paymentDate: registration.paymentDate,
            baseAmount: registration.baseAmount,       // Registration fee
            chargedAmount: registration.chargedAmount  // Total charged (includes gateway fee)
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

/**
 * @route   GET /api/payments/price-breakdown/:raceCategory
 * @desc    Get payment breakdown showing base amount, gateway fee, and total charged
 */
const getPriceBreakdown = async (req, res) => {
    try {
        const { raceCategory } = req.params;

        if (!isValidRaceCategory(raceCategory)) {
            return res.status(400).json({
                success: false,
                message: `Invalid race category: ${raceCategory}`
            });
        }

        const breakdown = getPaymentBreakdown(raceCategory);

        return res.status(200).json({
            success: true,
            raceCategory: raceCategory,
            breakdown: {
                registrationFee: breakdown.baseAmount,      // What merchant receives
                gatewayCharges: breakdown.gatewayFee,       // Payment gateway fee
                totalPayable: breakdown.chargedAmount,       // What user pays
                feePercentage: breakdown.feePercentage       // Fee percentage for display
            }
        });
    } catch (error) {
        console.error('Error getting price breakdown:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get price breakdown'
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    checkPaymentStatus,
    downloadInvoice,
    testEmail,
    getPriceBreakdown
};
