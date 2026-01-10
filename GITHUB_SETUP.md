# GitHub Setup Guide for Railway Deployment

Follow these steps to upload your code to GitHub and deploy to Railway.

## Step 1: Initialize Git Repository

```bash
# Initialize git
git init

# Add all files (respects .gitignore)
git add .

# Check what will be committed (verify no .env files)
git status

# Create initial commit
git commit -m "Initial commit: YUR Finance application"
```

## Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"New repository"** (or the **+** icon)
3. Repository name: `yur-accountant` (or your preferred name)
4. Description: "YUR Finance - Financial dashboard for media buyers"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 3: Connect and Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/yur-accountant.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Verify Upload

1. Go to your GitHub repository page
2. Verify these files are present:
   - ✅ `package.json`
   - ✅ `server/` folder
   - ✅ `src/` folder
   - ✅ `.gitignore`
   - ✅ `README.md`
3. Verify these files are **NOT** present:
   - ❌ `.env` files
   - ❌ `node_modules/`
   - ❌ `dist/`
   - ❌ `release/`

## Step 5: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Select your `yur-accountant` repository
6. Railway will auto-detect Node.js ✅

## Step 6: Configure Railway

### Add MongoDB Database
1. In Railway project, click **"New"**
2. Select **"Database"** → **"MongoDB"**
3. Railway creates database automatically
4. Copy the connection string (starts with `mongodb://`)

### Set Environment Variables
1. Go to your service → **"Variables"** tab
2. Add these variables:

```env
MONGODB_URI=<railway-provided-connection-string>
JWT_SECRET=<generate-random-32-char-string>
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configure Build Settings
Railway should auto-detect, but verify:
- **Build Command**: `npm install` (or leave empty)
- **Start Command**: `npm run server`

## Step 7: Deploy

1. Railway automatically deploys when you push to GitHub
2. Wait for deployment to complete
3. Get your server URL: `https://your-app.railway.app`

## Step 8: Initialize Data

After deployment, in Railway → Deployments → Click deployment → **"View Logs"** or use **"Shell"**:

```bash
npm run create-admin
npm run init-plans
npm run init-app-versions
```

## Step 9: Test Server

```bash
curl https://your-app.railway.app/api/health
```

Should return: `{"status":"ok"}`

## Step 10: Update Frontend

Update your frontend to use the Railway URL:

1. Create `.env` file in project root:
```env
VITE_API_URL=https://your-app.railway.app
```

2. Rebuild frontend:
```bash
npm run build
```

3. Deploy frontend to Vercel/Netlify (or same server)

## Quick Command Reference

```bash
# Initialize and commit
git init
git add .
git commit -m "Initial commit: YUR Finance application"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/yur-accountant.git
git branch -M main
git push -u origin main

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test server
curl https://your-app.railway.app/api/health
```

## Troubleshooting

### Problem: "Repository not found"
- Check repository name is correct
- Check you have access to the repository
- Verify GitHub username is correct

### Problem: "Permission denied"
- Use HTTPS URL (not SSH)
- Or set up SSH keys in GitHub

### Problem: ".env file is tracked"
```bash
# Remove from git (but keep file)
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### Problem: "Large files"
```bash
# Check repository size
du -sh .

# If too large, check what's included
git ls-files | xargs du -sh | sort -h | tail -20
```

## Security Checklist

Before pushing:
- [ ] No `.env` files in repository
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] `.gitignore` is working
- [ ] `node_modules/` not tracked
- [ ] `dist/` not tracked

## Next Steps After Deployment

1. ✅ Test API endpoints
2. ✅ Create admin user
3. ✅ Initialize plans
4. ✅ Update frontend API URL
5. ✅ Deploy frontend
6. ✅ Test full application

---

**Ready?** Follow the steps above to get your app on GitHub and Railway!
