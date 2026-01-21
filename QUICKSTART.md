# 🚀 Quick Start Guide - Bhaag Dilli Bhaag Backend

## Step 1: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't already)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace placeholders in `.env` file:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/bhaag_dilli_bhaag?retryWrites=true&w=majority
```

## Step 2: Install Dependencies

```bash
cd backend
npm install
```

## Step 3: Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.abc123.mongodb.net
📊 Database: bhaag_dilli_bhaag
🚀 Server running in development mode
📡 Server listening on port 5000
🌐 API URL: http://localhost:5000

✅ Phase-1 Backend Ready!
```

## Step 4: Test the API

### Option 1: Using cURL

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Create Registration:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "race": "5KM",
    "tshirtSize": "M",
    "amount": 699
  }'
```

### Option 2: Using Postman

1. Import `Bhaag_Dilli_Bhaag_API.postman_collection.json`
2. Run the "Health Check" request
3. Run "Create Registration - 5KM" request
4. Copy the `registrationId` from response
5. Paste it in "Get Registration by ID" request

### Option 3: Using Browser

Open: `http://localhost:5000/health`

## Step 5: Verify in MongoDB

1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. You should see `registrations` collection with your data

## 🎯 What's Working?

- ✅ Server running on port 5000
- ✅ MongoDB connected
- ✅ Registration API accepting data
- ✅ Data stored in MongoDB
- ✅ Validation working
- ✅ Error handling active

## 🔧 Troubleshooting

### Error: "MONGODB_URI is not defined"
- Check if `.env` file exists in `backend/` folder
- Verify MongoDB connection string is correct

### Error: "MongoServerError: Authentication failed"
- Check username and password in connection string
- Ensure password doesn't contain special characters (URL encode if needed)

### Error: "EADDRINUSE: address already in use"
- Port 5000 is already in use
- Change PORT in `.env` to 5001 or kill the process using port 5000

### Error: "Network error"
- Check if MongoDB Atlas IP whitelist includes your IP
- Add `0.0.0.0/0` to allow all IPs (development only)

## 📝 Next Steps

1. ✅ Backend is ready
2. Connect frontend to `http://localhost:5000/api/register`
3. Test end-to-end registration flow
4. Prepare for Phase 2 (Payment Integration)

## 🎉 Success!

Your Phase-1 backend is now running and ready to accept registrations!
