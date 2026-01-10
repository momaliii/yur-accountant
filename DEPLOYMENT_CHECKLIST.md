# Quick Deployment Checklist

## Before Deploying

- [ ] Code is pushed to GitHub
- [ ] `.env` file is NOT committed (already in .gitignore ✅)
- [ ] All environment variables documented
- [ ] Server uses `process.env.PORT` (already configured ✅)
- [ ] CORS is configurable via environment (already configured ✅)

## Recommended: Railway (Easiest)

### Step 1: Prepare Repository
```bash
# Make sure everything is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js ✅

### Step 3: Add MongoDB

1. In Railway project, click "New" → "Database" → "MongoDB"
2. Railway creates database automatically
3. Copy the connection string (starts with `mongodb://`)

### Step 4: Set Environment Variables

In Railway → Variables tab, add:

```env
MONGODB_URI=<railway-provided-connection-string>
JWT_SECRET=<generate-a-random-32-char-string>
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Configure Build

Railway should auto-detect, but verify:
- **Build Command**: `npm install` (or leave empty)
- **Start Command**: `npm run server`

### Step 6: Deploy

- Railway automatically deploys
- Get your URL: `https://your-app-name.railway.app`

### Step 7: Test

```bash
curl https://your-app-name.railway.app/api/health
```

Should return: `{"status":"ok"}`

### Step 8: Initialize Data

In Railway → Deployments → Click on deployment → Open shell:

```bash
npm run create-admin
npm run init-plans
npm run init-app-versions
```

### Step 9: Update Frontend

Update frontend `.env` or environment variables:

```env
VITE_API_URL=https://your-app-name.railway.app
```

### Step 10: Deploy Frontend

Deploy frontend to Vercel/Netlify with:
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL=https://your-app-name.railway.app`

## Alternative: Render

### Quick Steps

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. New → Web Service
4. Connect repository
5. Settings:
   - Build: `npm install`
   - Start: `npm run server`
6. Add MongoDB: New → MongoDB
7. Set environment variables (same as Railway)
8. Deploy

**Note**: Free tier spins down after 15 min inactivity

## Environment Variables Reference

### Required
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-32-character-secret-key
NODE_ENV=production
PORT=3000
```

### Optional
```env
CORS_ORIGIN=https://your-frontend.com,http://localhost:5173
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Post-Deployment Tasks

1. ✅ Test API: `curl https://your-server.com/api/health`
2. ✅ Create admin: `npm run create-admin`
3. ✅ Initialize plans: `npm run init-plans`
4. ✅ Initialize app versions: `npm run init-app-versions`
5. ✅ Update frontend API URL
6. ✅ Deploy frontend
7. ✅ Test full flow (login, register, etc.)

## Common Issues

### Issue: Server won't start
**Solution**: Check logs, verify all environment variables are set

### Issue: Database connection fails
**Solution**: 
- Verify MongoDB URI
- Check IP whitelist (MongoDB Atlas: Network Access → Add IP `0.0.0.0/0`)
- Verify credentials

### Issue: CORS errors
**Solution**: 
- Set `CORS_ORIGIN` environment variable
- Include your frontend domain
- Restart server

### Issue: Build fails
**Solution**:
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check build logs

## Quick Commands

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test API locally
curl http://localhost:3000/api/health

# Test deployed API
curl https://your-server.com/api/health
```

## Cost Estimate

**Railway (Recommended)**:
- Free: $5 credit/month (enough for small apps)
- Paid: $5-20/month (depending on usage)

**Render**:
- Free: Limited (spins down)
- Paid: $7/month (always on)

**MongoDB Atlas**:
- Free: 512MB storage (M0 cluster)
- Paid: $9/month (M10 cluster)

**Total**: ~$0-15/month for small apps

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Enable SSL/HTTPS (automatic on Railway/Render)
3. Set up monitoring
4. Configure backups
5. Set up CI/CD (automatic on Railway/Render)
