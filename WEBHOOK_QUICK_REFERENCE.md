# 🎯 Webhook Quick Reference

## Endpoint
```
POST /api/payments/webhook
```

## Middleware
```javascript
express.raw({ type: 'application/json' })
```

## Environment Variable
```env
RAZORPAY_WEBHOOK_SECRET=bhaag-dilli-bhaag-webhook-secret-2026
```

## Signature Verification
```javascript
const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
```

## Handled Event
```
payment.captured → Status: Completed
```

## Test Locally
```bash
node test-webhook.js
```

## Test with ngrok
```bash
ngrok http 5000
# Configure webhook URL in Razorpay dashboard
```

## Payment Flow
```
Pending → Pending_Confirmation → Completed ✅
```

## Security Checklist
- [x] Signature verification
- [x] Raw body processing
- [x] Event filtering
- [x] 200 OK response
- [x] Error logging

## Files
- Controller: `src/controllers/payment.controller.js`
- Routes: `src/routes/payment.routes.js`
- Test: `test-webhook.js`
- Docs: `WEBHOOK_IMPLEMENTATION.md`
