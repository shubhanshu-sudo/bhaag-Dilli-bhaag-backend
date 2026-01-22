# 🚀 Quick Setup Guide - Email & Invoice System

## Step 1: Update SMTP Credentials

Edit `backend/.env`:

```env
# Replace with your actual email credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### How to Get Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App Passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "Bhaag Dilli Bhaag"
6. Copy the 16-character password
7. Paste it in `SMTP_PASS`

---

## Step 2: Test Email Configuration

```bash
cd backend
node -e "require('./src/utils/emailService').verifyEmailConfig()"
```

**Expected Output:**
```
✅ Email server is ready
```

---

## Step 3: Test Complete Flow

1. **Start Backend:**
```bash
npm run dev
```

2. **Start ngrok:**
```bash
ngrok http 5000
```

3. **Update Razorpay Webhook:**
- Copy ngrok HTTPS URL
- Go to Razorpay Dashboard → Webhooks
- Update URL to: `https://your-ngrok-url.ngrok-free.app/api/payments/webhook`

4. **Make Test Payment:**
- Go to http://localhost:3000/register
- Fill form and pay with test card: `4111 1111 1111 1111`

5. **Check Logs:**
```
✅ Payment confirmed
📧 Generating invoice and sending confirmation email...
✅ Invoice generated successfully
✅ Email sent successfully
✅ Confirmation email sent to: user@example.com
```

6. **Check Email:**
- Open recipient's inbox
- Look for "Bhaag Dilli Bhaag – Registration Confirmed"
- Download and verify PDF invoice

---

## What You Get:

### Email Features:
✅ Professional HTML design
✅ Event branding (blue & yellow)
✅ Complete registration details
✅ Race category & T-shirt size
✅ Amount paid (highlighted)
✅ PDF invoice attachment
✅ Support contact info

### Invoice Features:
✅ Branded header with event colors
✅ Registration ID (highlighted)
✅ Participant details
✅ Payment details (Razorpay IDs)
✅ Amount paid (large, prominent)
✅ Event location & date
✅ System-generated footer

---

## Production Deployment:

### Option 1: Gmail (Testing Only)
- Free
- 500 emails/day limit
- Use for development/testing

### Option 2: SendGrid (Recommended)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```
- 100 emails/day free
- Reliable delivery
- Good for production

### Option 3: AWS SES (Enterprise)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```
- $0.10 per 1000 emails
- Highly scalable
- Best for large events

---

## Troubleshooting:

### "Invalid credentials" error:
- ✅ Check SMTP_USER and SMTP_PASS in .env
- ✅ For Gmail, use App Password (not regular password)
- ✅ Enable 2-Step Verification first

### Email not received:
- ✅ Check spam folder
- ✅ Verify email address is correct
- ✅ Check backend logs for errors
- ✅ Test SMTP connection

### Invoice not attached:
- ✅ Check if pdfkit is installed: `npm list pdfkit`
- ✅ Check backend logs for PDF generation errors
- ✅ Verify registration data is complete

---

## Next Steps:

1. ✅ Update SMTP credentials in `.env`
2. ✅ Test email configuration
3. ✅ Make test payment
4. ✅ Verify email received
5. ✅ Check invoice PDF
6. ✅ Deploy to production
7. ✅ Monitor email delivery

---

**Ready to send professional confirmation emails!** 📧✨
