# Razorpay Webhook Implementation Guide

## Overview
This guide explains the Razorpay webhook implementation that automatically confirms payments when Razorpay sends the `payment.captured` event.

---

## Webhook Endpoint

**URL:** `POST /api/payments/webhook`

**Purpose:** Receive and process Razorpay webhook events to automatically update payment status from `Pending_Confirmation` to `Completed`.

---

## Implementation Details

### 1. Route Configuration

The webhook route uses **`express.raw()`** middleware to receive the raw request body:

```javascript
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
```

**Why raw body?**
- Webhook signature verification requires the **exact raw body**
- JSON parsing would alter the body and break signature validation
- Raw body ensures HMAC SHA256 signature matches

---

### 2. Webhook Signature Verification

**Security Process:**

```javascript
// 1. Get signature from headers
const webhookSignature = req.headers['x-razorpay-signature'];

// 2. Get raw body as string
const webhookBody = req.body.toString();

// 3. Generate expected signature
const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');

// 4. Compare signatures
if (expectedSignature !== webhookSignature) {
    // Reject invalid webhook
    return res.status(400).json({ message: 'Invalid webhook signature' });
}
```

**Environment Variable Required:**
```env
RAZORPAY_WEBHOOK_SECRET=bhaag-dilli-bhaag-webhook-secret-2026
```

---

### 3. Event Handling

**Supported Events:**
- ✅ **`payment.captured`** - Payment successfully captured by Razorpay

**Ignored Events:**
- All other events are acknowledged but not processed

**Event Processing:**

```javascript
if (event === 'payment.captured') {
    const payment = webhookData.payload.payment.entity;
    const paymentId = payment.id;
    const orderId = payment.order_id;
    
    // Find registration by order ID
    const registration = await Registration.findOne({ 
        razorpayOrderId: orderId 
    });
    
    // Update to Completed (PAID)
    registration.paymentStatus = 'Completed';
    registration.razorpayPaymentId = paymentId;
    
    await registration.save();
}
```

---

## Payment Status Flow

### Complete Flow with Webhook

```
1. User registers
   ↓
   Status: "Pending"

2. User pays via Razorpay
   ↓
   Frontend calls /verify-payment
   ↓
   Status: "Pending_Confirmation"

3. Razorpay sends webhook (payment.captured)
   ↓
   Backend verifies webhook signature
   ↓
   Status: "Completed" ✅ PAID
```

---

## Webhook Payload Example

### payment.captured Event

```json
{
  "entity": "event",
  "account_id": "acc_xxxxx",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxx",
        "entity": "payment",
        "amount": 49900,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_xxxxx",
        "invoice_id": null,
        "international": false,
        "method": "card",
        "amount_refunded": 0,
        "refund_status": null,
        "captured": true,
        "description": "2KM Race Registration",
        "card_id": "card_xxxxx",
        "bank": null,
        "wallet": null,
        "vpa": null,
        "email": "user@example.com",
        "contact": "+919876543210",
        "created_at": 1737542315
      }
    }
  },
  "created_at": 1737542320
}
```

---

## Security Features

### ✅ Webhook Signature Verification
- Uses HMAC SHA256 with webhook secret
- Ensures webhook is from Razorpay
- Prevents webhook spoofing attacks

### ✅ Raw Body Processing
- Preserves exact body for signature validation
- Prevents tampering detection

### ✅ Event Filtering
- Only processes `payment.captured` events
- Ignores unauthorized events

### ✅ Database Validation
- Verifies order exists before updating
- Prevents invalid updates

### ✅ Idempotency
- Safe to receive duplicate webhooks
- Status update is idempotent

---

## Error Handling

### 1. Missing Signature
```json
{
  "success": false,
  "message": "Webhook signature missing"
}
```
**Status:** 400 Bad Request

### 2. Invalid Signature
```json
{
  "success": false,
  "message": "Invalid webhook signature"
}
```
**Status:** 400 Bad Request

### 3. Registration Not Found
```json
{
  "success": true,
  "message": "Webhook received but registration not found"
}
```
**Status:** 200 OK (acknowledges to prevent retry)

### 4. Processing Error
```json
{
  "success": false,
  "message": "Webhook processing error"
}
```
**Status:** 200 OK (prevents Razorpay retry loop)

---

## Testing Webhooks

### Local Testing with ngrok

1. **Install ngrok:**
```bash
npm install -g ngrok
```

2. **Start your backend:**
```bash
cd backend
npm run dev
```

3. **Expose local server:**
```bash
ngrok http 5000
```

4. **Configure Razorpay webhook:**
- Go to Razorpay Dashboard → Settings → Webhooks
- Add webhook URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
- Select event: `payment.captured`
- Enter webhook secret: `bhaag-dilli-bhaag-webhook-secret-2026`

5. **Test payment:**
- Complete a test payment
- Check ngrok console for webhook request
- Verify database status updated to `Completed`

---

### Manual Webhook Testing

**Using cURL:**

```bash
# Generate signature
WEBHOOK_SECRET="bhaag-dilli-bhaag-webhook-secret-2026"
PAYLOAD='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test123","order_id":"order_test123","amount":49900}}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIGNATURE" \
  --data-raw "$PAYLOAD"
```

---

## Production Setup

### 1. Configure Webhook URL

**Razorpay Dashboard:**
- Settings → Webhooks → Add New Webhook
- URL: `https://your-domain.com/api/payments/webhook`
- Active Events: `payment.captured`
- Secret: Use strong random string

### 2. Update Environment Variable

```env
RAZORPAY_WEBHOOK_SECRET=your-production-webhook-secret
```

### 3. Monitor Webhook Logs

Check server logs for:
- ✅ Webhook received
- ✅ Signature verified
- ✅ Payment confirmed
- ❌ Signature verification failed
- ❌ Registration not found

---

## Webhook Retry Logic

**Razorpay Retry Behavior:**
- Retries failed webhooks (non-200 responses)
- Exponential backoff between retries
- Maximum retry attempts: ~10 times over 3 days

**Our Implementation:**
- Returns **200 OK** for all webhooks (even errors)
- Logs errors for manual investigation
- Prevents infinite retry loops

---

## Database Updates

### Fields Updated by Webhook

```javascript
{
  paymentStatus: 'Completed',        // Changed from Pending_Confirmation
  razorpayPaymentId: 'pay_xxxxx',   // Payment ID from webhook
  paymentDate: new Date()            // Set if not already set
}
```

---

## Monitoring & Debugging

### Console Logs

**Successful Webhook:**
```
Webhook received: payment.captured
Payment captured: { paymentId: 'pay_xxx', orderId: 'order_xxx', amount: 499 }
Payment confirmed for registration: 507f1f77bcf86cd799439011
```

**Failed Signature:**
```
Webhook signature verification failed
Expected: abc123...
Received: xyz789...
```

**Registration Not Found:**
```
Registration not found for order: order_xxxxx
```

---

## Best Practices

### ✅ Do's
- Always verify webhook signature
- Return 200 OK to acknowledge receipt
- Log all webhook events
- Handle duplicate webhooks gracefully
- Use raw body for signature verification

### ❌ Don'ts
- Don't trust webhook without signature verification
- Don't return error status codes for processing errors
- Don't parse JSON before signature verification
- Don't expose webhook secret in logs
- Don't skip event type validation

---

## Troubleshooting

### Webhook Not Received

**Check:**
1. Webhook URL is publicly accessible
2. Firewall allows incoming requests
3. SSL certificate is valid (production)
4. Razorpay webhook is configured correctly

### Signature Verification Fails

**Check:**
1. `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
2. Using `express.raw()` middleware
3. Not parsing body before verification
4. Signature header name is correct: `x-razorpay-signature`

### Payment Not Updating

**Check:**
1. Webhook event is `payment.captured`
2. Order ID exists in database
3. Database connection is working
4. No errors in server logs

---

## Next Steps

1. **Email Notifications:** Send confirmation email when payment is completed
2. **Admin Dashboard:** Show webhook logs in admin panel
3. **Webhook Analytics:** Track webhook success/failure rates
4. **Retry Mechanism:** Manual retry for failed webhooks
5. **Multiple Events:** Handle refund, failed payment events

---

## API Documentation

### Endpoint Summary

| Endpoint | Method | Purpose | Status Update |
|----------|--------|---------|---------------|
| `/api/payments/create-order` | POST | Create Razorpay order | - |
| `/api/payments/verify-payment` | POST | Verify payment signature | → Pending_Confirmation |
| `/api/payments/webhook` | POST | Process Razorpay webhooks | → Completed |

---

## Security Checklist

- [x] Webhook signature verification implemented
- [x] HMAC SHA256 validation
- [x] Raw body processing for signature
- [x] Event type filtering
- [x] Database validation before update
- [x] Error logging without exposing secrets
- [x] Idempotent webhook processing
- [x] 200 OK response to prevent retries

---

## Status: ✅ COMPLETE

The Razorpay webhook implementation is production-ready and follows all security best practices!
