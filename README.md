# Bhaag Dilli Bhaag - Backend API (Phase 1)

Event registration backend built with Node.js, Express, and MongoDB Atlas.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Environment:** dotenv
- **CORS:** Enabled for frontend

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   └── Registration.js       # Registration schema
│   ├── routes/
│   │   └── register.routes.js    # API routes
│   ├── controllers/
│   │   └── register.controller.js # Business logic
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── .env                          # Environment variables
├── package.json
└── README.md
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file and replace the placeholders:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER_URL>/bhaag_dilli_bhaag?retryWrites=true&w=majority
NODE_ENV=development
```

**Example:**
```env
MONGODB_URI=mongodb+srv://admin:mypassword123@cluster0.abc123.mongodb.net/bhaag_dilli_bhaag?retryWrites=true&w=majority
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-20T11:34:18.000Z"
}
```

### Create Registration
```http
POST /api/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "race": "5KM",
  "tshirtSize": "L",
  "amount": 699
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "registrationId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "race": "5KM",
    "amount": 699,
    "paymentStatus": "pending"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "This email is already registered"
}
```

### Get Registration by ID
```http
GET /api/register/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "race": "5KM",
    "tshirtSize": "L",
    "amount": 699,
    "paymentStatus": "pending",
    "createdAt": "2026-01-20T11:34:18.000Z"
  }
}
```

## 📊 Database Schema

### Registration Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Participant name |
| email | String | Yes | Email (unique) |
| phone | String | Yes | 10-digit phone number |
| race | String | Yes | 2KM, 5KM, or 10KM |
| tshirtSize | String | Yes | XS, S, M, L, XL, XXL |
| amount | Number | Yes | Registration fee |
| paymentStatus | String | No | pending/completed/failed |
| paymentId | String | No | For future payment integration |
| transactionId | String | No | For future payment integration |
| orderId | String | No | For future payment integration |
| createdAt | Date | Auto | Registration timestamp |
| updatedAt | Date | Auto | Last update timestamp |

## 🧪 Testing with Postman

1. **Health Check:**
   - Method: GET
   - URL: `http://localhost:5000/health`

2. **Create Registration:**
   - Method: POST
   - URL: `http://localhost:5000/api/register`
   - Headers: `Content-Type: application/json`
   - Body: (see example above)

3. **Get Registration:**
   - Method: GET
   - URL: `http://localhost:5000/api/register/{registrationId}`

## 🔒 Validation Rules

- **Name:** 2-100 characters
- **Email:** Valid email format, unique
- **Phone:** Exactly 10 digits
- **Race:** Must be 2KM, 5KM, or 10KM
- **T-shirt Size:** Must be XS, S, M, L, XL, or XXL
- **Amount:** Non-negative number

## 🚧 Future Phases (Not Implemented Yet)

### Phase 2: Payment Integration
- Razorpay order creation
- Payment verification webhook
- Invoice generation (PDF)

### Phase 3: Admin Panel
- GET /api/admin/registrations
- Filter by race category
- Export to CSV
- Dashboard analytics

### Phase 4: Notifications
- Email confirmation
- SMS notifications
- Payment receipts

## 🛡️ Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| NODE_ENV | Environment mode | development/production |

## 🔗 CORS Configuration

Allowed origins:
- `http://localhost:3000` (Next.js dev)
- `http://localhost:3001` (Alternative port)
- Your Vercel deployment URL (update in `src/app.js`)

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5"
}
```

## 🎯 Phase 1 Checklist

- ✅ Express server setup
- ✅ MongoDB Atlas connection
- ✅ Registration model with validation
- ✅ POST /api/register endpoint
- ✅ GET /api/register/:id endpoint
- ✅ Error handling
- ✅ CORS configuration
- ✅ Environment variables
- ✅ Future-ready schema
- ✅ Production-ready structure

## 🚀 Deployment

### Prerequisites
- MongoDB Atlas account
- Node.js hosting (Railway, Render, Heroku, etc.)

### Steps
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

## 📞 Support

For issues or questions, refer to the project documentation or contact the development team.

---

**Version:** 1.0.0  
**Phase:** 1 (Registration Only)  
**Status:** Production Ready ✅
# bhaag-Dilli-bhaag-backend
