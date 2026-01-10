# GitHub Upload Guide

This guide shows exactly which files to upload to GitHub.

## ✅ Files TO Upload (Commit These)

### Source Code
- ✅ `src/` - All React frontend code
- ✅ `server/` - All backend server code
- ✅ `public/` - Public assets (manifest.json, sw.js, etc.)
- ✅ `scripts/` - All utility scripts
- ✅ `electron/` - Electron main process files

### Configuration Files
- ✅ `package.json` - Dependencies and scripts
- ✅ `package-lock.json` - Lock file for dependencies
- ✅ `vite.config.js` - Vite configuration
- ✅ `capacitor.config.ts` - Capacitor configuration
- ✅ `eslint.config.js` - ESLint configuration
- ✅ `index.html` - Main HTML file
- ✅ `Procfile` - For Heroku/Railway deployment

### Documentation
- ✅ `README.md` - Project readme
- ✅ `SETUP.md` - Setup instructions
- ✅ `ADMIN_GUIDE.md` - Admin guide
- ✅ `CREATE_ADMIN.md` - Admin creation guide
- ✅ `MOBILE_BUILD_GUIDE.md` - Mobile build guide
- ✅ `MOBILE_APP_UPDATES.md` - Mobile updates guide
- ✅ `MOBILE_SETUP.md` - Mobile setup guide
- ✅ `DEPLOYMENT_GUIDE.md` - Deployment guide
- ✅ `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- ✅ `GITHUB_UPLOAD_GUIDE.md` - This file
- ✅ `DATA_SYNC_EXPLANATION.md` - Data sync docs
- ✅ `NEW_FEATURES.md` - Features documentation
- ✅ `ANDROID_BUILD.md` - Android build guide

### Android Configuration (Templates Only)
- ✅ `android/build.gradle` - Build configuration
- ✅ `android/settings.gradle` - Settings
- ✅ `android/gradle.properties` - Gradle properties
- ✅ `android/gradle/wrapper/` - Gradle wrapper files
- ✅ `android/keystore.properties.template` - Template (NOT actual keystore)
- ✅ `android/capacitor.settings.gradle` - Capacitor settings
- ✅ `android/variables.gradle` - Variables
- ✅ `android/clean-gradle-cache.sh` - Clean script

### iOS Configuration
- ✅ `ios/App/Podfile` - CocoaPods configuration
- ✅ `ios/App/App.xcodeproj/` - Xcode project files
- ✅ `ios/App/App.xcworkspace/` - Xcode workspace
- ✅ `ios/capacitor-cordova-ios-plugins/` - Plugin specs

## ❌ Files NOT to Upload (Already in .gitignore)

### Build Outputs
- ❌ `node_modules/` - Dependencies (installed via npm)
- ❌ `dist/` - Built frontend files (generated)
- ❌ `dist-electron/` - Electron build output
- ❌ `release/` - Release builds (.exe, .dmg, etc.)
- ❌ `android/app/build/` - Android build output
- ❌ `android/build/` - Android build cache
- ❌ `ios/App/App/build/` - iOS build output

### Environment & Secrets
- ❌ `.env` - Environment variables (contains secrets)
- ❌ `.env.local` - Local environment
- ❌ `.env.production` - Production environment
- ❌ `android/local.properties` - Local Android properties
- ❌ `android/keystore.properties` - Actual keystore (if exists)

### Logs & Cache
- ❌ `*.log` - All log files
- ❌ `logs/` - Log directory
- ❌ `.DS_Store` - macOS system files
- ❌ `.idea/` - IDE files
- ❌ `.vscode/` - VS Code settings (except extensions.json)

### Mobile Build Artifacts
- ❌ `android/` - Full Android folder (build outputs)
- ❌ `ios/` - Full iOS folder (build outputs)
- ❌ `.capacitor/` - Capacitor cache

## 📋 Quick Checklist

### Before Committing

```bash
# Check what will be committed
git status

# Make sure these are NOT listed:
# - .env files
# - node_modules/
# - dist/
# - release/
# - android/app/build/
# - ios/App/App/build/
```

### Standard Commit Command

```bash
# Add all files (respects .gitignore)
git add .

# Check what's staged
git status

# Commit
git commit -m "Initial commit - YUR Finance app"

# Push to GitHub
git push origin main
```

## 🔍 Verify Before Pushing

### 1. Check for Sensitive Files

```bash
# Make sure .env is NOT tracked
git ls-files | grep .env
# Should return nothing

# Make sure node_modules is NOT tracked
git ls-files | grep node_modules
# Should return nothing
```

### 2. Check File Size

```bash
# Check repository size
du -sh .
# Should be reasonable (not gigabytes)

# If too large, check what's included
git ls-files | xargs du -sh | sort -h | tail -20
```

### 3. Review What's Staged

```bash
# See all files that will be committed
git status

# See detailed list
git ls-files --cached
```

## 📁 Recommended Repository Structure

Your GitHub repo should look like this:

```
yur-accountant/
├── src/                    ✅ Source code
├── server/                 ✅ Backend code
├── public/                 ✅ Public assets
├── scripts/                ✅ Utility scripts
├── electron/               ✅ Electron files
├── package.json            ✅ Dependencies
├── package-lock.json       ✅ Lock file
├── vite.config.js          ✅ Vite config
├── capacitor.config.ts     ✅ Capacitor config
├── index.html              ✅ Main HTML
├── Procfile                ✅ Deployment file
├── .gitignore              ✅ Ignore rules
├── README.md               ✅ Documentation
├── *.md                    ✅ All docs
└── android/                ⚠️  Only config files (no build/)
    └── app/build/          ❌ NOT included
```

## 🚨 Important: Never Commit These

### Critical Security Files
- ❌ `.env` - Contains database passwords, JWT secrets
- ❌ `android/keystore.properties` - Contains signing keys
- ❌ Any file with passwords, API keys, or secrets

### Large Build Files
- ❌ `node_modules/` - Can be regenerated
- ❌ `dist/` - Build output
- ❌ `release/` - Release builds
- ❌ Build artifacts

## ✅ Safe to Commit

### Configuration Templates
- ✅ `keystore.properties.template` - Template without secrets
- ✅ `.env.example` - Example env file (if you create one)

### Source Code
- ✅ All `.js`, `.jsx`, `.ts`, `.tsx` files
- ✅ All `.json` config files
- ✅ All `.md` documentation files

## 📝 Create .env.example (Optional)

Create a template for environment variables:

```bash
# Create .env.example
cat > .env.example << 'EOF'
# Database
MONGODB_URI=mongodb://localhost:27017/yur-accountant

# JWT
JWT_SECRET=your-secret-key-here

# Environment
NODE_ENV=development
PORT=3000

# CORS
CORS_ORIGIN=http://localhost:5173
EOF
```

This file is safe to commit (no real secrets).

## 🎯 Quick Start Commands

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add remote (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/yur-accountant.git

# 3. Check what will be committed
git status

# 4. Add all files (respects .gitignore)
git add .

# 5. Verify no sensitive files
git ls-files | grep -E '\.env|node_modules|dist/|release/'
# Should return nothing or only .env.example

# 6. Commit
git commit -m "Initial commit: YUR Finance application"

# 7. Push to GitHub
git push -u origin main
```

## 🔐 Security Checklist

Before pushing, verify:

- [ ] No `.env` files are tracked
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] No database credentials in code
- [ ] `.gitignore` is properly configured
- [ ] `node_modules/` is not tracked
- [ ] Build outputs are not tracked

## 📊 Expected Repository Size

- **Source code only**: ~5-20 MB
- **With node_modules**: ~200-500 MB (don't commit!)
- **With builds**: ~1-5 GB (don't commit!)

Your repo should be **small** (under 50 MB) if you're only committing source code.

## 🆘 If You Accidentally Committed Secrets

```bash
# Remove from git history (DANGEROUS - rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**Better solution**: Rotate all secrets immediately!

## ✅ Final Checklist

Before pushing to GitHub:

- [ ] `.gitignore` is in place
- [ ] No `.env` files in repository
- [ ] `node_modules/` is not tracked
- [ ] `dist/` is not tracked
- [ ] `release/` is not tracked
- [ ] All source code is included
- [ ] Documentation is included
- [ ] Configuration files are included
- [ ] No secrets in code
- [ ] Repository size is reasonable

## 🎉 You're Ready!

Once you've verified everything, push to GitHub:

```bash
git push origin main
```

Then deploy to Railway/Render using the deployment guides!
