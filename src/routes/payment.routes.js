const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleWebhook, checkPaymentStatus } = require('../controllers/payment.controller');

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

/**
 * @route   POST /api/payments/verify-payment
 * @desc    Verify Razorpay payment signature and update registration status
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
 *   "message": "Payment verified successfully",
 *   "registrationId": "mongodb_id",
 *   "paymentStatus": "Pending_Confirmation"
 * }
 */
router.post('/verify-payment', verifyPayment);

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
 * - payment.captured: Updates payment status to Completed
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Payment confirmed successfully"
 * }
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

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

module.exports = router;
