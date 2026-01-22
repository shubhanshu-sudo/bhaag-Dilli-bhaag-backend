# Payment API Documentation

## Overview
The Payment API provides secure Razorpay integration for creating payment orders with **backend-determined pricing**. This prevents price manipulation attacks by ensuring all pricing logic is handled server-side.

---

## Endpoint: Create Payment Order

### Request

**URL:** `POST /api/payments/create-order`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "raceCategory": "2KM" | "5KM" | "10KM"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| raceCategory | string | Yes | Race category (2KM, 5KM, or 10KM) |

---

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "orderId": "order_NXmjFOiPvKLsWq",
  "amount": 499,
  "currency": "INR",
  "receipt": "receipt_2KM_1737542315000",
  "raceCategory": "2KM"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if the request was successful |
| orderId | string | Razorpay order ID (use this for payment) |
| amount | number | Amount in rupees (determined by backend) |
| currency | string | Currency code (INR) |
| receipt | string | Unique receipt identifier |
| raceCategory | string | The race category for this order |

---

#### Error Responses

**400 Bad Request - Missing Race Category**
```json
{
  "success": false,
  "message": "Race category is required"
}
```

**400 Bad Request - Invalid Race Category**
```json
{
  "success": false,
  "message": "Invalid race category: 15KM. Valid categories are: 2KM, 5KM, 10KM"
}
```

**400 Bad Request - Razorpay Error**
```json
{
  "success": false,
  "message": "Payment gateway error",
  "error": "Description of the error (development only)"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to create payment order",
  "error": "Error details (development only)"
}
```

---

## Pricing Structure

Prices are **strictly determined by the backend** and cannot be modified from the frontend:

| Race Category | Distance | Price (INR) |
|---------------|----------|-------------|
| 2KM | 2 KM | ₹499 |
| 5KM | 5 KM | ₹699 |
| 10KM | 10 KM | ₹1199 |

**Security Note:** The API **never** accepts amount from the frontend. All pricing is determined server-side using the `raceConfig.js` configuration file.

---

## Usage Example

### JavaScript (Fetch API)

```javascript
async function createPaymentOrder(raceCategory) {
  try {
    const response = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raceCategory: raceCategory
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Order created:', data.orderId);
      console.log('Amount:', data.amount);
      // Use data.orderId to initiate Razorpay payment
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

// Usage
createPaymentOrder('5KM');
```

### cURL

```bash
# Create order for 2KM race
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"raceCategory": "2KM"}'

# Create order for 5KM race
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"raceCategory": "5KM"}'

# Create order for 10KM race
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"raceCategory": "10KM"}'
```

---

## Endpoint: Verify Payment

### Request

**URL:** `POST /api/payments/verify-payment`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "razorpay_order_id": "order_NXmjFOiPvKLsWq",
  "razorpay_payment_id": "pay_NXmjFOiPvKLsWq",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "registrationId": "507f1f77bcf86cd799439011"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| razorpay_order_id | string | Yes | Order ID from Razorpay |
| razorpay_payment_id | string | Yes | Payment ID from Razorpay |
| razorpay_signature | string | Yes | Payment signature from Razorpay |
| registrationId | string | Yes | MongoDB registration ID |

---

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "registrationId": "507f1f77bcf86cd799439011",
  "paymentStatus": "Completed"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates if verification was successful |
| message | string | Success message |
| registrationId | string | MongoDB registration ID |
| paymentStatus | string | Updated payment status (Completed) |

---

#### Error Responses

**400 Bad Request - Missing Fields**
```json
{
  "success": false,
  "message": "Missing required payment verification fields"
}
```

**400 Bad Request - Invalid Signature**
```json
{
  "success": false,
  "message": "Payment verification failed. Invalid signature."
}
```

**404 Not Found - Registration Not Found**
```json
{
  "success": false,
  "message": "Registration not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to verify payment",
  "error": "Error details (development only)"
}
```

---

### Usage Example

#### JavaScript (Fetch API)

```javascript
async function verifyPayment(paymentData, registrationId) {
  try {
    const response = await fetch('http://localhost:5000/api/payments/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        registrationId: registrationId
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Payment verified:', data.paymentStatus);
      return data;
    } else {
      console.error('Verification failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}
```

#### cURL

```bash
curl -X POST http://localhost:5000/api/payments/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_NXmjFOiPvKLsWq",
    "razorpay_payment_id": "pay_NXmjFOiPvKLsWq",
    "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
    "registrationId": "507f1f77bcf86cd799439011"
  }'
```

---

## Integration Flow

1. **Frontend:** User selects a race category (2KM, 5KM, or 10KM)
2. **Frontend:** Calls `/api/payments/create-order` with the race category
3. **Backend:** Validates the race category
4. **Backend:** Determines the price from `raceConfig.js` (NOT from frontend)
5. **Backend:** Creates a Razorpay order with the determined price
6. **Backend:** Returns the order details to frontend
7. **Frontend:** Uses the `orderId` to initiate Razorpay payment UI
8. **Frontend:** User completes payment through Razorpay
9. **Razorpay:** Returns payment details (order_id, payment_id, signature)
10. **Frontend:** Calls `/api/payments/verify-payment` with payment details
11. **Backend:** Verifies signature using HMAC SHA256
12. **Backend:** Updates registration status to "Completed"
13. **Backend:** Returns verification success
14. **Frontend:** Shows success page to user


---

## Security Features

✅ **Price Integrity:** Amount is NEVER accepted from frontend  
✅ **Backend Validation:** Race category is validated server-side  
✅ **Single Source of Truth:** All pricing in `raceConfig.js`  
✅ **Signature Verification:** Payment signatures verified using HMAC SHA256  
✅ **Payment Authenticity:** Ensures payments are genuine Razorpay transactions  
✅ **Error Handling:** Comprehensive error messages  
✅ **Async/Await:** Modern promise-based error handling  
✅ **Environment Variables:** Razorpay keys stored securely in `.env`

---

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

---

## Testing

Run the test script to validate the API:

```bash
# Start the server
npm run dev

# In another terminal, run the test script
node test-payment-api.js
```

---

## Notes

- The API returns amounts in **rupees** (e.g., 499)
- Razorpay internally uses **paise** (smallest currency unit), so the backend multiplies by 100
- Receipt IDs are auto-generated with format: `receipt_{raceCategory}_{timestamp}`
- Order IDs are generated by Razorpay and start with `order_`

---

## Next Steps

After creating an order, you need to:

1. Use the `orderId` to initialize Razorpay checkout on frontend
2. Handle payment success/failure callbacks
3. Implement webhook verification for payment confirmation
4. Update registration status based on payment confirmation
