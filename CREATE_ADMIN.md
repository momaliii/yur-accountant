# How to Create an Admin User

There are **3 ways** to create an admin user:

## Method 1: Register + Update in MongoDB (Easiest) ⭐

**Best for:** Creating your first admin user

1. **Register a new account:**
   - Go to `http://localhost:5173/register`
   - Register with your email and password
   - Log in with that account

2. **Update role in MongoDB:**
   - Open **MongoDB Compass** (or your MongoDB client)
   - Connect to your database
   - Go to database: `yur-finance` → collection: `users`
   - Find your user by email
   - Click **Edit Document**
   - Change `role` from `"user"` to `"admin"`
   - Click **Update**

3. **Log out and log back in:**
   - You'll now have admin access!

---

## Method 2: Using Admin Dashboard (If you already have admin access)

**Best for:** Creating additional admin users

1. **Log in as admin**
2. **Go to Admin Dashboard:**
   - Click your profile icon (top-right)
   - Click "Admin Panel"
   - OR go to `/admin` route

3. **Create new user:**
   - Click **"Create User"** button
   - Fill in:
     - Email
     - Name
     - Password (min 6 characters)
     - **Role: Select "Admin"**
   - Click **"Create"**

---

## Method 3: Using MongoDB Script (Advanced)

**Best for:** Programmatic admin creation

1. **Create a script file** (see `scripts/createAdmin.js`)

2. **Run the script:**
   ```bash
   node scripts/createAdmin.js
   ```

3. **Follow the prompts** to create an admin user

---

## Quick MongoDB Update (If you already registered)

If you already have a user account and want to make it admin:

### Using MongoDB Compass:
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to: `yur-finance` → `users`
4. Find your user document
5. Edit the document
6. Change: `"role": "user"` → `"role": "admin"`
7. Save

### Using MongoDB Shell:
```javascript
use yur-finance
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Verify Admin Access

After making yourself admin:
1. **Log out** from the app
2. **Log back in**
3. You should see:
   - "Admin" badge in your profile dropdown
   - "Admin Panel" link in the dropdown
   - Admin Dashboard accessible at `/admin`

---

## Troubleshooting

**Can't see Admin Panel?**
- Make sure you logged out and logged back in after updating the role
- Check that `role` field in MongoDB is exactly `"admin"` (lowercase)
- Clear browser localStorage and try again

**Admin Dashboard shows "Forbidden"?**
- Your JWT token might be cached with old role
- Log out completely and log back in
- Check MongoDB that your role is saved correctly
