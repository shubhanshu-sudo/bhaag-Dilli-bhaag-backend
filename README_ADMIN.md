# 🔐 Admin Backend - Bhaag Dilli Bhaag

Secure admin authentication and management system for event registrations.

## 🎯 Features

- ✅ **Secure Admin Authentication** - JWT-based login system
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Protected Routes** - Middleware-based authorization
- ✅ **Registration Management** - View all registrations
- ✅ **Dashboard Statistics** - Real-time event stats
- ✅ **Environment-Driven** - No hardcoded secrets

---

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/bhaag_dilli_bhaag

# JWT Secret (Generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**⚠️ IMPORTANT:**
- Generate a secure JWT_SECRET using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Use a strong password for ADMIN_PASSWORD
- Never commit `.env` to version control

### 3. Create Admin Account

Run the admin creation script:

```bash
npm run create-admin
```

You should see:
```
✅ Connected to MongoDB
✅ Admin created successfully!
📧 Email: admin@yourdomain.com
🔒 Password has been securely hashed
```

**⚠️ SECURITY:** After creating the admin, remove or comment out `ADMIN_PASSWORD` from `.env`

### 4. Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

---

## 🔌 API Endpoints

### Public Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-20T13:18:20.000Z"
}
```

#### Admin Login
```http
POST /api/admin/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@yourdomain.com",
  "password": "YourSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "admin@yourdomain.com"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Protected Endpoints (Require Authentication)

All protected endpoints require the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

#### Get All Registrations
```http
GET /api/admin/registrations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 150,
  "stats": {
    "total": 150,
    "pending": 45,
    "completed": 100,
    "failed": 5,
    "byRace": {
      "2KM": 50,
      "5KM": 70,
      "10KM": 30
    }
  },
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "race": "5KM",
      "tshirtSize": "L",
      "amount": 699,
      "paymentStatus": "pending",
      "createdAt": "2026-01-20T10:30:00.000Z"
    }
  ]
}
```

#### Get Registration by ID
```http
GET /api/admin/registrations/:id
Authorization: Bearer <token>
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
    "createdAt": "2026-01-20T10:30:00.000Z"
  }
}
```

#### Get Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRegistrations": 150,
    "pendingPayments": 45,
    "completedPayments": 100,
    "totalRevenue": 104500,
    "raceStats": [
      {
        "_id": "2KM",
        "count": 50,
        "revenue": 24950
      },
      {
        "_id": "5KM",
        "count": 70,
        "revenue": 48930
      },
      {
        "_id": "10KM",
        "count": 30,
        "revenue": 29970
      }
    ],
    "recentRegistrations": [...]
  }
}
```

---

## 🔒 Security Features

### Password Security
- ✅ Passwords hashed using bcrypt with salt rounds
- ✅ Plain passwords never stored in database
- ✅ Secure password comparison

### JWT Authentication
- ✅ Token-based authentication
- ✅ 24-hour token expiry
- ✅ Secure token verification
- ✅ Protected routes with middleware

### Environment Security
- ✅ All secrets in environment variables
- ✅ No hardcoded credentials
- ✅ `.env` excluded from version control

---

## 🧪 Testing with Postman

### 1. Import Collection

Import the Postman collection (if provided) or create requests manually.

### 2. Login as Admin

**POST** `http://localhost:5000/api/admin/login`

Body:
```json
{
  "email": "admin@yourdomain.com",
  "password": "YourSecurePassword123!"
}
```

Copy the `token` from the response.

### 3. Access Protected Routes

**GET** `http://localhost:5000/api/admin/registrations`

Headers:
```
Authorization: Bearer <paste_token_here>
```

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                      # MongoDB connection
│   ├── models/
│   │   ├── Admin.js                   # Admin model with password hashing
│   │   └── Registration.js            # Registration model
│   ├── controllers/
│   │   ├── admin.controller.js        # Admin logic
│   │   └── register.controller.js     # Registration logic
│   ├── routes/
│   │   ├── admin.routes.js            # Admin routes
│   │   └── register.routes.js         # Registration routes
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication middleware
│   ├── scripts/
│   │   └── createAdmin.js             # Admin creation script
│   ├── app.js                         # Express app setup
│   └── server.js                      # Server entry point
├── .env                               # Environment variables (DO NOT COMMIT)
├── .env.example                       # Environment template
├── .gitignore
├── package.json
└── README_ADMIN.md                    # This file
```

---

## 🔐 Admin Model Schema

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `comparePassword(candidatePassword)` - Compare plain password with hashed password
- `toJSON()` - Exclude password from JSON responses

---

## 🛡️ Middleware

### Authentication Middleware (`auth.js`)

Protects routes by:
1. Extracting JWT token from Authorization header
2. Verifying token with JWT_SECRET
3. Attaching admin info to request object
4. Blocking access if token is invalid/expired

**Usage:**
```javascript
router.get('/protected-route', authMiddleware, controller);
```

---

## 📊 Error Handling

### Authentication Errors

| Status | Message | Cause |
|--------|---------|-------|
| 401 | Access denied. No token provided. | Missing Authorization header |
| 401 | Invalid token format. | Malformed Bearer token |
| 401 | Token has expired. | JWT token expired (>24h) |
| 401 | Invalid token. | JWT verification failed |
| 401 | Invalid credentials | Wrong email/password |

### Server Errors

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Please provide email and password | Missing login credentials |
| 404 | Registration not found | Invalid registration ID |
| 500 | Internal server error | Server/database error |

---

## 🔄 Admin Creation Script

The `createAdmin.js` script:
- ✅ Reads credentials from environment variables
- ✅ Checks if admin already exists (prevents duplicates)
- ✅ Hashes password automatically
- ✅ Safe to re-run multiple times

**Run:**
```bash
npm run create-admin
```

---

## 🚨 Important Security Notes

### Production Deployment

1. **Change JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Remove ADMIN_PASSWORD from .env** after admin creation

3. **Use HTTPS** in production

4. **Set NODE_ENV=production**

5. **Enable rate limiting** for login endpoint

6. **Add IP whitelisting** for admin routes (optional)

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server in production mode |
| `npm run dev` | Start server with nodemon (auto-reload) |
| `npm run create-admin` | Create admin account from .env |

---

## 🔮 Future Enhancements (Not in Current Scope)

- ❌ Payment gateway integration
- ❌ Role-based access control (RBAC)
- ❌ Multiple admin accounts
- ❌ Password reset functionality
- ❌ Admin activity logs
- ❌ Email notifications

---

## ✅ Phase 2 Checklist

- ✅ Admin model created
- ✅ Password hashing with bcrypt
- ✅ JWT authentication implemented
- ✅ Admin creation script
- ✅ Login endpoint
- ✅ Protected routes with middleware
- ✅ Get all registrations endpoint
- ✅ Get registration by ID endpoint
- ✅ Dashboard statistics endpoint
- ✅ Environment-driven configuration
- ✅ No hardcoded secrets
- ✅ Security best practices

---

**Admin Backend: COMPLETE ✅**  
**Ready for Frontend Integration: YES ✅**  
**Next Phase: Admin Panel UI 🔜**
