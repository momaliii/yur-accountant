# Fix GitHub Authentication Error

You're getting this error because GitHub no longer accepts passwords for HTTPS. Here are 3 solutions:

## Solution 1: Use Personal Access Token (Recommended)

### Step 1: Create Personal Access Token
1. Go to GitHub → Settings → Developer settings
2. Click "Personal access tokens" → "Tokens (classic)"
3. Click "Generate new token" → "Generate new token (classic)"
4. Name it: `yur-accountant-upload`
5. Select scopes: ✅ **repo** (full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Use Token Instead of Password
When you push, use the token as password:

```bash
git push -u origin main
```

When prompted:
- **Username**: `momaliii` (your GitHub username)
- **Password**: `paste-your-token-here` (the token you copied)

### Step 3: Save Credentials (Optional)
To avoid entering token every time:

```bash
# macOS Keychain
git config --global credential.helper osxkeychain

# Or store in git config (less secure)
git config --global credential.helper store
```

## Solution 2: Use SSH (More Secure)

### Step 1: Check for SSH Key
```bash
ls -al ~/.ssh
```

If you see `id_rsa.pub` or `id_ed25519.pub`, you have a key. Skip to Step 3.

### Step 2: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept defaults (don't set a passphrase unless you want to).

### Step 3: Add SSH Key to GitHub
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
# Or if you have id_rsa:
cat ~/.ssh/id_rsa.pub
```

1. Copy the entire output (starts with `ssh-ed25519` or `ssh-rsa`)
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Title: `MacBook Air`
5. Paste the key
6. Click "Add SSH key"

### Step 4: Change Remote to SSH
```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote
git remote add origin git@github.com:momaliii/yur-accountant.git

# Push
git push -u origin main
```

## Solution 3: Use GitHub CLI (Easiest)

### Step 1: Install GitHub CLI
```bash
# macOS
brew install gh

# Or download from: https://cli.github.com
```

### Step 2: Authenticate
```bash
gh auth login
```

Follow the prompts:
- Choose "GitHub.com"
- Choose "HTTPS"
- Authenticate via browser

### Step 3: Push
```bash
git push -u origin main
```

## Quick Fix (Fastest)

**Just use a Personal Access Token:**

1. Create token: https://github.com/settings/tokens/new
2. Select "repo" scope
3. Copy token
4. When pushing, use token as password:

```bash
git push -u origin main
# Username: momaliii
# Password: <paste-token-here>
```

## Verify Authentication

```bash
# Test connection
git ls-remote origin

# Should show branch info without errors
```

## Troubleshooting

### "Permission denied (publickey)"
- You're using SSH but key isn't added to GitHub
- Use Solution 1 (Personal Access Token) instead

### "Token expired"
- Create a new token
- Or set longer expiration (90 days, 1 year)

### "Repository not found"
- Check repository name: `momaliii/yur-accountant`
- Verify you have access to the repository

## Recommended: Personal Access Token

**Easiest and works immediately:**

1. Go to: https://github.com/settings/tokens/new
2. Name: `yur-accountant`
3. Expiration: `90 days` (or `No expiration`)
4. Scopes: ✅ **repo**
5. Generate → Copy token
6. Use token as password when pushing

---

**Try Solution 1 first** - it's the quickest! 🚀
