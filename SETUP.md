# YUR Finance SaaS Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **npm** (comes with Node.js)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all backend and frontend dependencies including:
- Fastify, MongoDB (Mongoose), JWT, bcrypt
- React, Zustand, and all frontend dependencies

## Step 2: Set Up MongoDB

### Option A: Local MongoDB

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. MongoDB will run on `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/yur-finance
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yur-finance

# JWT Configuration
JWT_SECRET=dfc0a7e0df0982a438372248f355e10c
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

## Step 4: Start the Backend Server

In one terminal:

```bash
npm run server
```

Or for development with auto-reload:

```bash
npm run server:dev
```

The server will start on `http://localhost:3000`

## Step 5: Start the Frontend

In another terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 6: Create Your First Admin User

### Option A: Via Registration + MongoDB Update (Recommended) ⭐

1. Go to `http://localhost:5173/register`
2. Register a new account with your email and password
3. Open **MongoDB Compass** (or your MongoDB client)
4. Connect to your database
5. Navigate to: `yur-finance` → `users` collection
6. Find your user by email
7. Click **Edit Document**
8. Change `role` from `"user"` to `"admin"`
9. Click **Update**
10. **Log out and log back in** - you'll now have admin access!

### Option B: Using Script (Easiest)

1. Run the admin creation script:
   ```bash
   npm run create-admin
   ```
2. Follow the prompts to enter email, password, and name
3. The script will create an admin user automatically
4. Log in with the credentials you provided

### Option C: Via Admin Dashboard (If you already have admin)

1. Log in as admin
2. Go to Admin Dashboard (click profile → Admin Panel)
3. Click **"Create User"** button
4. Fill in details and select **Role: Admin**
5. Click **Create**

**See `CREATE_ADMIN.md` for detailed instructions!**

## Step 7: Migrate Existing Data (Optional)

If you have existing local data:

1. Log in to the app
2. Go to **Migration** page (in sidebar if you're admin, or navigate to `/migration`)
3. Click **Export to JSON** to backup your data
4. Click **Migrate to Cloud** to upload to MongoDB
5. Your data will be safely imported and associated with your account

## Step 8: Access Admin Dashboard

1. Log in with your admin account
2. You'll see **Admin Dashboard** in the sidebar
3. Click it to manage users, view statistics, and analytics

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists and has correct `MONGODB_URI`
- Check if port 3000 is available

### Frontend can't connect to backend
- Make sure backend is running on port 3000
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Check browser console for errors

### Authentication errors
- Verify JWT_SECRET is set in `.env`
- Check that user exists in MongoDB
- Clear browser localStorage and try again

### Migration fails
- Check that you're logged in
- Verify backend is running
- Check browser console and server logs for errors

## Production Deployment

For production:

1. Change `JWT_SECRET` to a strong random string
2. Set `NODE_ENV=production`
3. Update `CORS_ORIGIN` to your production domain
4. Use a production MongoDB instance
5. Set up environment variables on your hosting platform
6. Build frontend: `npm run build`
7. Deploy backend and frontend separately

## API Endpoints

- **Auth:** `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Data:** `/api/clients`, `/api/income`, `/api/expenses`, etc.
- **Admin:** `/api/admin/users`, `/api/admin/stats`
- **Migration:** `/api/migration/upload`

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up MongoDB
3. ✅ Create `.env` file
4. ✅ Start backend server
5. ✅ Start frontend
6. ✅ Create admin user
7. ✅ Test the system!
