# 🔧 Setting Up Vercel Admin App Project

## Problem
You have one Vercel project for the public app, but need a second project for the admin app to access the Shopify admin interface.

## Solution: Create Second Vercel Project

### Step 1: Create New Vercel Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import from GitHub**: Select your `minimall` repository
4. **Configure Project**:
   - **Project Name**: `minimall-admin`
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave blank (uses monorepo detection)
   - **Build Command**: `npx turbo build --filter=@minimall/admin`
   - **Install Command**: `npm install`
   - **Output Directory**: `apps/admin/.next`

### Step 2: Override Build Configuration

Since Vercel may not detect the `vercel-admin.json` automatically:

1. **Go to Project Settings** → **General**
2. **Override Build Settings**:
   - **Build Command**: `npx turbo build --filter=@minimall/admin`
   - **Output Directory**: `apps/admin/.next`
   - **Install Command**: `npm install`
   - **Root Directory**: Leave blank

### Step 3: Configure Environment Variables

In your admin Vercel project, go to **Settings** → **Environment Variables** and add:

#### Required Variables
```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes,read_customers,read_orders
NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key

# App URLs (use your admin domain)
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
ADMIN_APP_URL=https://admin.yourdomain.com
PUBLIC_APP_URL=https://yourdomain.com

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://admin.yourdomain.com
JWT_SECRET=your_jwt_secret_key

# Webhooks
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Database (same as public)
DATABASE_URL=postgresql://user:pass@host/db

# R2 Storage (same as public)
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET=your_r2_secret_key
R2_BUCKET_NAME=minimall-configs

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Step 4: Configure Custom Domain

1. **Go to Project Settings** → **Domains**
2. **Add Domain**: `admin.yourdomain.com`
3. **Configure DNS**: Point `admin.yourdomain.com` to Vercel
   - **A Record**: `76.76.19.61`
   - **Or CNAME**: `cname.vercel-dns.com`

### Step 5: Test Admin App

1. **Deploy**: Push to GitHub or manually deploy
2. **Access**: Go to `https://admin.yourdomain.com`
3. **Verify**: Should show Shopify admin interface

## Accessing Admin Features

### Current Admin Routes
- **Main Admin**: `https://admin.yourdomain.com/admin`
- **Analytics**: `https://admin.yourdomain.com/analytics`
- **Editor**: `https://admin.yourdomain.com/editor/[configId]`

### API Endpoints
- **Auth**: `https://admin.yourdomain.com/api/auth/shopify/install`
- **Session**: `https://admin.yourdomain.com/api/auth/session`
- **Configs**: `https://admin.yourdomain.com/api/configs/[configId]`
- **Webhooks**: `https://admin.yourdomain.com/api/webhooks/*`

## Shopify Partner Dashboard Setup

Once your admin domain is working:

1. **Go to**: [Shopify Partners Dashboard](https://partners.shopify.com/)
2. **Update App URLs**:
   - **App URL**: `https://admin.yourdomain.com/admin`
   - **Allowed redirection URLs**:
     - `https://admin.yourdomain.com/api/auth/shopify/callback`
     - `https://admin.yourdomain.com/admin/auth/callback`

## Testing the Setup

### 1. Test Admin App Access
```bash
# Should redirect to Shopify OAuth
curl -I https://admin.yourdomain.com/admin
```

### 2. Test API Health
```bash
# Should return 401 (unauthorized) - this is expected
curl https://admin.yourdomain.com/api/auth/session
```

### 3. Test Shopify Install Flow
```bash
# Should return 302 redirect to Shopify
curl -I https://admin.yourdomain.com/api/auth/shopify/install
```

## Common Issues

### "App Not Found" Error
- **Cause**: Build configuration pointing to wrong directory
- **Solution**: Verify build command and output directory in Vercel settings

### OAuth Redirect Mismatch
- **Cause**: Admin domain not configured in Shopify Partner Dashboard
- **Solution**: Update all URLs in Partner Dashboard to use admin domain

### Environment Variables Missing
- **Cause**: Required variables not set in admin Vercel project
- **Solution**: Copy all required variables from environment template

### Build Failures
- **Cause**: Admin app dependencies not installing correctly
- **Solution**: Check build logs, ensure all packages are in package.json

## Verification Checklist

- [ ] Admin Vercel project created and connected to GitHub
- [ ] Build configuration set to use admin app
- [ ] All environment variables configured
- [ ] Custom domain `admin.yourdomain.com` configured
- [ ] DNS pointing to Vercel
- [ ] SSL certificate provisioned
- [ ] Shopify Partner Dashboard updated with admin URLs
- [ ] Admin app accessible and shows Shopify interface

Once complete, you'll have:
- **Public App**: `yourdomain.com` (Instagram-native experience)
- **Admin App**: `admin.yourdomain.com` (Shopify merchant interface)

Both apps deploy automatically when you push to GitHub!