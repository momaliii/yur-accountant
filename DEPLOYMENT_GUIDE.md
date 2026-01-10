# Server Deployment Guide

This guide covers where and how to deploy your YUR Finance server online.

## Quick Comparison

| Platform | Free Tier | Best For | Difficulty |
|----------|-----------|----------|------------|
| **Railway** | ✅ Yes | Quick deployment | ⭐ Easy |
| **Render** | ✅ Yes | Simple setup | ⭐ Easy |
| **Heroku** | ❌ No (paid) | Established platform | ⭐⭐ Medium |
| **DigitalOcean** | ❌ No | Full control | ⭐⭐⭐ Advanced |
| **AWS** | ✅ Limited | Enterprise | ⭐⭐⭐ Advanced |
| **Vercel** | ✅ Yes | Serverless | ⭐⭐ Medium |
| **Fly.io** | ✅ Yes | Global edge | ⭐⭐ Medium |

## Recommended: Railway (Easiest)

### Why Railway?
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in MongoDB option
- ✅ Easy environment variables
- ✅ HTTPS included
- ✅ Simple setup

### Steps to Deploy on Railway

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository

3. **Configure Project**
   - Railway auto-detects Node.js
   - Set root directory if needed
   - Add build command: `npm install`
   - Add start command: `npm run server`

4. **Add MongoDB Database**
   - Click "New" → "Database" → "MongoDB"
   - Railway provides connection string automatically

5. **Set Environment Variables**
   - Go to "Variables" tab
   - Add:
     ```
     MONGODB_URI=<railway-provided-connection-string>
     JWT_SECRET=<your-secret-key>
     NODE_ENV=production
     PORT=3000
     ```

6. **Deploy**
   - Railway automatically deploys on push
   - Get your URL: `https://your-app.railway.app`

7. **Update Frontend**
   - Update `VITE_API_URL` in frontend to your Railway URL
   - Rebuild frontend

## Alternative: Render (Free Tier)

### Steps to Deploy on Render

1. **Sign up at [render.com](https://render.com)**

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Select your repo

3. **Configure Service**
   - **Name**: yur-finance-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Plan**: Free (or paid for better performance)

4. **Add MongoDB**
   - Click "New" → "MongoDB"
   - Choose free tier
   - Copy connection string

5. **Set Environment Variables**
   - In service settings → Environment
   - Add:
     ```
     MONGODB_URI=<render-mongodb-connection-string>
     JWT_SECRET=<generate-random-string>
     NODE_ENV=production
     PORT=3000
     ```

6. **Deploy**
   - Render auto-deploys
   - Get URL: `https://your-app.onrender.com`

**Note**: Free tier spins down after 15 minutes of inactivity (first request may be slow)

## Alternative: DigitalOcean App Platform

### Steps to Deploy on DigitalOcean

1. **Sign up at [digitalocean.com](https://digitalocean.com)**

2. **Create App**
   - Go to App Platform
   - Click "Create App"
   - Connect GitHub

3. **Configure**
   - Select Node.js
   - Build command: `npm install`
   - Run command: `npm run server`

4. **Add Database**
   - Add MongoDB component
   - Or use managed MongoDB

5. **Set Environment Variables**
   - Add all required variables

6. **Deploy**
   - DigitalOcean handles deployment
   - Get URL: `https://your-app.ondigitalocean.app`

**Cost**: ~$5-12/month (no free tier, but reliable)

## Alternative: Fly.io (Global Edge)

### Steps to Deploy on Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up**
   ```bash
   fly auth signup
   ```

3. **Create App**
   ```bash
   fly launch
   ```

4. **Configure fly.toml**
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[services]]
     http_checks = []
     internal_port = 3000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []
   ```

5. **Set Secrets**
   ```bash
   fly secrets set MONGODB_URI="your-connection-string"
   fly secrets set JWT_SECRET="your-secret"
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

**Free Tier**: 3 shared VMs, 160GB outbound data

## Alternative: Vercel (Serverless)

### Steps to Deploy on Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/index.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

**Note**: Vercel is serverless, may need adjustments for long-running connections

## MongoDB Hosting Options

### Option 1: MongoDB Atlas (Recommended)

1. **Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)**
2. **Create Free Cluster** (M0 - Free tier)
3. **Configure Network Access**
   - Add IP: `0.0.0.0/0` (allow all) or your server IP
4. **Create Database User**
5. **Get Connection String**
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### Option 2: Railway MongoDB
- Included when you add MongoDB to Railway project
- Automatic connection string

### Option 3: Render MongoDB
- Included when you add MongoDB to Render project
- Free tier available

## Environment Variables Checklist

Make sure to set these in your hosting platform:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Environment
NODE_ENV=production
PORT=3000

# Optional: Email (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Redis (if using caching)
REDIS_URL=redis://localhost:6379
```

## Pre-Deployment Checklist

### 1. Update Server Configuration

Check `server/index.js`:
- ✅ CORS is configured for your frontend domain
- ✅ Port uses `process.env.PORT || 3000`
- ✅ Error handling is in place

### 2. Update Frontend Configuration

Update `.env` or `vite.config.js`:
```env
VITE_API_URL=https://your-server-url.com
```

### 3. Security

- ✅ Use strong `JWT_SECRET` (32+ characters)
- ✅ Set `NODE_ENV=production`
- ✅ Enable HTTPS
- ✅ Configure CORS properly
- ✅ Use environment variables (never commit secrets)

### 4. Database

- ✅ Create production database
- ✅ Run migrations if needed
- ✅ Create admin user: `npm run create-admin`
- ✅ Initialize plans: `npm run init-plans`

### 5. Build Frontend

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel (for frontend)
- Netlify
- Cloudflare Pages
- Or same server with static file serving

## Deployment Steps Summary

### For Railway (Recommended)

1. Push code to GitHub
2. Sign up at railway.app
3. Create project from GitHub
4. Add MongoDB database
5. Set environment variables
6. Deploy (automatic)
7. Get URL
8. Update frontend API URL
9. Deploy frontend separately

### For Render

1. Push code to GitHub
2. Sign up at render.com
3. Create web service
4. Add MongoDB
5. Set environment variables
6. Deploy
7. Get URL
8. Update frontend

## Frontend Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Connect GitHub repo**
2. **Configure**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=https://your-server.com`

3. **Deploy**
   - Automatic on push

### Option 2: Netlify

1. **Connect GitHub**
2. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment variables**
   - `VITE_API_URL=https://your-server.com`
4. **Deploy**

### Option 3: Cloudflare Pages

1. **Connect GitHub**
2. **Build settings**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. **Environment variables**
   - `VITE_API_URL=https://your-server.com`
4. **Deploy**

## Full Stack Deployment (Same Platform)

### Railway (Both Frontend & Backend)

1. **Backend Service**
   - Deploy server as web service
   - Add MongoDB

2. **Frontend Service**
   - Deploy as static site
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment: `VITE_API_URL=https://your-backend.railway.app`

### Render (Both)

1. **Backend Service**
   - Web service for server

2. **Frontend Service**
   - Static site for frontend
   - Build command: `npm run build`
   - Publish directory: `dist`

## Post-Deployment

### 1. Test API

```bash
curl https://your-server.com/api/health
```

### 2. Create Admin User

SSH into server or use Railway/Render shell:
```bash
npm run create-admin
```

### 3. Initialize Data

```bash
npm run init-plans
npm run init-app-versions
```

### 4. Update CORS

In `server/index.js`, update CORS:
```javascript
origin: [
  'https://your-frontend-domain.com',
  'http://localhost:5173' // for local dev
]
```

### 5. Monitor

- Check logs in hosting dashboard
- Monitor errors
- Check database connections
- Verify API endpoints

## Cost Comparison

| Platform | Free Tier | Paid Starts At | Best For |
|----------|-----------|---------------|----------|
| Railway | ✅ $5 credit/month | $5/month | Quick setup |
| Render | ✅ Free (limited) | $7/month | Simple apps |
| DigitalOcean | ❌ No | $5/month | Full control |
| Fly.io | ✅ Free tier | $1.94/month | Global edge |
| Vercel | ✅ Free | $20/month | Serverless |
| Heroku | ❌ No | $7/month | Established |

## Recommended Setup

**For Beginners:**
- **Backend**: Railway
- **Database**: MongoDB Atlas (free tier)
- **Frontend**: Vercel or Netlify

**For Production:**
- **Backend**: Railway or DigitalOcean
- **Database**: MongoDB Atlas (paid for better performance)
- **Frontend**: Vercel or Cloudflare Pages

## Troubleshooting

### Server Won't Start

1. Check logs in hosting dashboard
2. Verify environment variables
3. Check MongoDB connection
4. Verify port configuration

### CORS Errors

1. Update CORS in `server/index.js`
2. Add frontend domain to allowed origins
3. Check API URL in frontend

### Database Connection Issues

1. Verify MongoDB URI
2. Check network access (IP whitelist)
3. Verify credentials
4. Check database user permissions

### Build Failures

1. Check Node.js version
2. Verify all dependencies in package.json
3. Check build logs
4. Ensure all environment variables are set

## Quick Start: Railway Deployment

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push

# 2. Go to railway.app
# 3. Create project from GitHub
# 4. Add MongoDB
# 5. Set environment variables
# 6. Deploy!

# 7. Update frontend .env
VITE_API_URL=https://your-app.railway.app

# 8. Deploy frontend to Vercel/Netlify
```

## Support

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
