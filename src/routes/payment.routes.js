const express = require('express');
const router = express.Router();
const { createOrder, cancelOrder, verifyPayment, handleWebhook, checkPaymentStatus, downloadInvoice, testEmail, getPriceBreakdown } = require('../controllers/payment.controller');

/**
 * CRITICAL: Webhook route MUST use raw body for signature verification
 * This route is defined FIRST and uses express.raw() middleware
 * All other routes will use express.json() middleware
 */

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhook events
 * @access  Public (verified by webhook signature)
 * 
 * IMPORTANT: This route uses express.raw() middleware to receive raw body
 * for signature verification. The raw body is required for HMAC validation.
 * 
 * Headers:
 * {
 *   "x-razorpay-signature": "webhook_signature"
 * }
 * 
 * Body: Raw JSON (not parsed)
 * 
 * Handled Events:
 * - payment.captured: Updates payment status to paid
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment confirmed successfully"
 * }
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

/**
 * Apply JSON parsing middleware to all other routes
 * Webhook route above will NOT be affected by this
 */
router.use(express.json());

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order with backend-determined pricing
 * @access  Public
 * 
 * Request Body:
 * {
 *   "raceCategory": "2KM" | "5KM" | "10KM"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "orderId": "order_xxxxx",
 *   "amount": 499,
 *   "currency": "INR",
 *   "receipt": "receipt_2KM_1234567890",
 *   "raceCategory": "2KM"
 * }
 */
router.post('/create-order', createOrder);
router.post('/complete-free-registration', require('../controllers/payment.controller').completeFreeRegistration);
router.post('/cancel-order', cancelOrder);

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature (does NOT mark as paid)
 * @access  Public
 * 
 * Request Body:
 * {
 *   "razorpay_order_id": "order_xxxxx",
 *   "razorpay_payment_id": "pay_xxxxx",
 *   "razorpay_signature": "signature_xxxxx",
 *   "registrationId": "mongodb_id"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment signature verified. Awaiting confirmation.",
 *   "registrationId": "mongodb_id",
 *   "paymentStatus": "pending"
 * }
 */
router.post('/verify-payment', verifyPayment);

/**
 * @route   GET /api/payments/status/:registrationId
 * @desc    Check payment status for a registration
 * @access  Public
 * 
 * Used by frontend to poll for payment status updates after webhook confirmation.
 * 
 * Response:
 * {
 *   "success": true,
 *   "paymentStatus": "pending" | "paid" | "failed",
 *   "razorpayOrderId": "order_xxxxx",
 *   "razorpayPaymentId": "pay_xxxxx",
 *   "paymentDate": "2026-01-22T..."
 * }
 */
router.get('/status/:registrationId', checkPaymentStatus);

/**
 * @route   GET /api/payments/invoice/:registrationId
 * @desc    Generate and download invoice PDF
 * @access  Public
 */
router.get('/invoice/:registrationId', downloadInvoice);

/**
 * @route   GET /api/payments/test-email/:registrationId
 * @desc    Manually trigger email for testing (checks if email flow works)
 * @access  Public
 */
router.get('/test-email/:registrationId', testEmail);

/**
 * @route   GET /api/payments/price-breakdown/:raceCategory
 * @desc    Get payment breakdown showing registration fee, gateway charges, and total
 * @access  Public
 * 
 * Response:
 * {
 *   "success": true,
 *   "raceCategory": "2KM",
 *   "breakdown": {
 *     "registrationFee": 499,      // What merchant receives
 *     "gatewayCharges": 12,        // Payment gateway fee
 *     "totalPayable": 511,         // What user pays
 *     "feePercentage": 2.36        // Fee percentage
 *   }
 * }
 */
router.get('/price-breakdown/:raceCategory', getPriceBreakdown);

module.exports = router;
