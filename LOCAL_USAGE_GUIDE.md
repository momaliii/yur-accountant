# Local Usage Guide: What Happens Without Server

This guide explains what happens when you use the app locally **without running the server**.

## ⚠️ Quick Answer

**Without the server running, most features won't work.** The app needs the backend server for:
- ✅ Authentication (login/register)
- ✅ Data synchronization
- ✅ API calls
- ✅ Database operations

## 🔴 What WON'T Work Without Server

### 1. **Authentication**
- ❌ **Login** - Will show error: "Network error. Please check your connection."
- ❌ **Register** - Cannot create new accounts
- ❌ **Logout** - May not work properly
- ❌ **Session management** - Cannot validate tokens

**Error Message:**
```
Network error. Please check your connection.
```

### 2. **Data Loading**
- ❌ **Dashboard** - Cannot load financial data
- ❌ **Clients** - Cannot fetch client list
- ❌ **Income/Expenses** - Cannot load transactions
- ❌ **Reports** - Cannot generate reports
- ❌ **All data pages** - Will show loading errors

**Error Message:**
```
Failed to fetch
Network error. Please check your connection.
```

### 3. **Data Operations**
- ❌ **Create** - Cannot add new records
- ❌ **Update** - Cannot edit existing records
- ❌ **Delete** - Cannot remove records
- ❌ **Sync** - Cannot sync with server

### 4. **Features Requiring Server**
- ❌ **AI Chat** - Requires backend API
- ❌ **Admin Dashboard** - Requires server authentication
- ❌ **Security Settings** - Requires server
- ❌ **Subscriptions** - Requires payment processing
- ❌ **Messages/Tickets** - Requires server
- ❌ **App Updates** - Cannot check for updates

## ✅ What WILL Work (Limited)

### 1. **UI/Interface**
- ✅ **Pages load** - UI components render
- ✅ **Navigation** - Can navigate between pages
- ✅ **Forms** - Can fill out forms (but can't submit)
- ✅ **Styling** - All CSS and UI works

### 2. **Local Storage (If Previously Loaded)**
- ✅ **Cached data** - If you were logged in before, some data might be in IndexedDB
- ⚠️ **Limited access** - Can only view cached data, cannot modify

### 3. **Offline Queue (Partial)**
- ✅ **Queue operations** - Operations are queued locally
- ⚠️ **Not processed** - Queue won't process until server is online
- ⚠️ **No sync** - Cannot sync queued operations without server

## 📱 User Experience Without Server

### Scenario 1: Fresh Start (No Server)
```
1. User opens app
2. User tries to login
3. ❌ Error: "Network error. Please check your connection."
4. User cannot access any features
5. App shows error messages on all pages
```

### Scenario 2: Previously Logged In (Server Goes Down)
```
1. User was logged in before
2. Server stops
3. User tries to access dashboard
4. ❌ Error: "Network error. Please check your connection."
5. User cannot load new data
6. User cannot save changes
7. User is eventually logged out (401 error)
```

### Scenario 3: Offline Mode (Browser Offline)
```
1. User is online but server is down
2. Browser detects network error
3. Operations are queued locally
4. User sees error messages
5. When server comes back, queue processes
```

## 🔧 How the App Handles Server Errors

### Error Handling Flow

1. **API Call Made**
   ```javascript
   fetch('http://localhost:3000/api/auth/login', ...)
   ```

2. **Network Error Occurs**
   ```javascript
   // Error: Failed to fetch
   ```

3. **Error Caught**
   ```javascript
   catch (error) {
     if (error.message.includes('Failed to fetch')) {
       throw new Error('Network error. Please check your connection.');
     }
   }
   ```

4. **User Sees Error**
   - Red error message displayed
   - Loading states stop
   - User cannot proceed

### Default API URL

The app defaults to:
```javascript
API_BASE_URL = 'http://localhost:3000'
```

If server is not running on port 3000, all API calls fail.

## 🚀 Solutions

### Option 1: Run Server Locally (Recommended)

**Start the server:**
```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Start frontend
npm run dev
```

**Now everything works:**
- ✅ Login/Register
- ✅ All data operations
- ✅ Full functionality

### Option 2: Use Online Server

**Update API URL:**
```bash
# Create .env file
VITE_API_URL=https://your-server.railway.app
```

**Now app connects to online server:**
- ✅ Works without local server
- ✅ Requires internet connection
- ✅ Uses remote database

### Option 3: Offline Development (Limited)

**For UI development only:**
```bash
# Just run frontend
npm run dev
```

**Limitations:**
- ❌ Cannot test authentication
- ❌ Cannot test data operations
- ✅ Can develop UI components
- ✅ Can test styling
- ✅ Can test navigation

## 📊 Feature Dependency Matrix

| Feature | Requires Server | Works Offline |
|---------|----------------|---------------|
| Login | ✅ Yes | ❌ No |
| Register | ✅ Yes | ❌ No |
| Dashboard | ✅ Yes | ⚠️ Cached data only |
| Clients | ✅ Yes | ⚠️ Cached data only |
| Income/Expenses | ✅ Yes | ⚠️ Cached data only |
| Reports | ✅ Yes | ❌ No |
| AI Chat | ✅ Yes | ❌ No |
| Admin Dashboard | ✅ Yes | ❌ No |
| Settings | ✅ Yes | ⚠️ Partial |
| Security | ✅ Yes | ❌ No |
| UI/Navigation | ❌ No | ✅ Yes |
| Forms (display) | ❌ No | ✅ Yes |

## 🛠️ Development Workflow

### For Full Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

### For UI-Only Development
```bash
# Just frontend (server features won't work)
npm run dev
```

### For Production Testing
```bash
# Build frontend
npm run build

# Serve built files
npm run preview

# Run server separately
npm run server
```

## 🔍 Troubleshooting

### Problem: "Network error" on every page

**Cause:** Server is not running

**Solution:**
```bash
# Start the server
npm run server
```

### Problem: "Failed to fetch" errors

**Cause:** Server is not accessible

**Solutions:**
1. Check if server is running: `curl http://localhost:3000/api/health`
2. Check server logs for errors
3. Verify port 3000 is not in use
4. Check firewall settings

### Problem: Can't login even with server running

**Causes:**
1. Server not fully started (wait a few seconds)
2. Database not connected
3. Wrong API URL in frontend

**Solutions:**
```bash
# Check server health
curl http://localhost:3000/api/health

# Check server logs
# Look for "Server listening on port 3000"
# Look for "MongoDB connected successfully"
```

### Problem: CORS errors

**Cause:** Server CORS not configured for frontend URL

**Solution:**
```bash
# In server/.env or server/index.js
CORS_ORIGIN=http://localhost:5173
```

## 📝 Summary

### Without Server:
- ❌ **Cannot authenticate** (login/register)
- ❌ **Cannot load data** from database
- ❌ **Cannot save changes**
- ❌ **Most features don't work**
- ✅ **UI still works** (pages, navigation, styling)
- ⚠️ **Limited cached data** (if previously loaded)

### With Server:
- ✅ **Full functionality**
- ✅ **Authentication works**
- ✅ **Data operations work**
- ✅ **All features available**

## 🎯 Best Practice

**Always run the server when developing:**
```bash
# Use two terminals
# Terminal 1:
npm run server

# Terminal 2:
npm run dev
```

**For production:**
- Deploy server to Railway/Render
- Update `VITE_API_URL` to production URL
- Build and deploy frontend

## ⚡ Quick Commands

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Start server
npm run server

# Start frontend
npm run dev

# Start both (if you have a script)
npm run dev:all  # (if configured)
```

## 🔐 Security Note

**Never commit `.env` files** with real credentials. The app will use default `http://localhost:3000` if `VITE_API_URL` is not set, which is fine for local development.

---

**Bottom Line:** The app is a **full-stack application** that requires both frontend and backend to function properly. Without the server, you can only view the UI, but cannot use any features that require data or authentication.
