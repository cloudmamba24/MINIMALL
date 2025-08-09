# 🚀 MINIMALL Deployment Guide

This comprehensive guide will walk you through deploying your MINIMALL link-in-bio platform to production. Follow these steps to connect all external services and get your application running.

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub account with repository access
- [ ] Vercel account
- [ ] Cloudflare account
- [ ] Shopify Partner account
- [ ] Database provider account (Neon recommended)
- [ ] Sentry account for error monitoring

## 🗂️ Project Architecture Overview

Your MINIMALL project consists of:
- **Admin App** (`apps/admin`) - Shopify app for store management
- **Public App** (`apps/public`) - Customer-facing link-in-bio sites
- **Core Package** (`packages/core`) - Shared business logic
- **Database Package** (`packages/db`) - Data layer with Drizzle ORM
- **UI Package** (`packages/ui`) - Shared components

---

## 1. 🗄️ Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Database
1. Visit [Neon.tech](https://neon.tech/) and sign up
2. Click **Create Project**
3. Configure your project:
   - **Name**: `minimall-production`
   - **PostgreSQL Version**: Latest (16+)
   - **Database Name**: `minimall`
   - **Region**: Choose closest to your users
4. Click **Create Project**

### Step 2: Get Connection String
After creation, copy your connection string (looks like):
```
postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/minimall?sslmode=require
```

### Step 3: Environment Variables
Save these values for later:
```env
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/minimall?sslmode=require"
```

**📝 Note**: Use the pooled connection (-pooler) for better performance.

---

## 2. 🪣 Cloudflare R2 Setup

### Step 1: Create R2 Bucket
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Configure:
   - **Bucket name**: `minimall-assets`
   - **Location**: Auto (recommended)
5. Click **Create bucket**

### Step 2: Generate API Tokens
1. Go to **R2** → **Manage R2 API tokens**
2. Click **Create API token**
3. Configure token:
   - **Token name**: `minimall-api`
   - **Permissions**: Object Read & Write
   - **Specify bucket**: `minimall-assets`
4. Copy the generated credentials:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL** (e.g., `https://xxx.r2.cloudflarestorage.com`)

### Step 3: Configure CORS (Optional)
If you need browser uploads:
1. In your bucket, go to **Settings**
2. Add CORS policy:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 4: Environment Variables
Save these values:
```env
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY="your-access-key"
R2_SECRET="your-secret-key"
R2_BUCKET_NAME="minimall-assets"
R2_DOMAIN="your-custom-domain.com" # Optional: for custom domain
```

---

## 3. 🛍️ Shopify App Setup

### Step 1: Create Shopify Partner Account
1. Visit [Shopify Partners](https://partners.shopify.com/)
2. Sign up or log in
3. Go to **Apps** → **Create app**

### Step 2: Configure App Settings
1. **App name**: `MINIMALL Link-in-Bio`
2. **App type**: Public app
3. **App URL**: `https://your-admin-app.vercel.app` (will get this from Vercel)
4. **Allowed redirection URL(s)**:
   ```
   https://your-admin-app.vercel.app/api/auth/callback
   ```

### Step 3: Get API Credentials
After creating the app:
1. Go to **App setup**
2. Copy these values:
   - **Client ID** (API key)
   - **Client secret**

### Step 4: Configure Scopes
Add these scopes in the **App setup**:
```
read_products,write_products,read_orders,read_customers,read_themes,write_themes
```

### Step 5: Environment Variables
Save these values:
```env
SHOPIFY_API_KEY="your-client-id"
SHOPIFY_API_SECRET="your-client-secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders,read_customers,read_themes,write_themes"
```

---

## 4. 🚨 Sentry Error Monitoring

### Step 1: Create Sentry Project
1. Visit [Sentry.io](https://sentry.io/) and sign up
2. Create a new project:
   - **Platform**: Next.js
   - **Project name**: `minimall`

### Step 2: Get DSN
Copy your DSN from the project settings (looks like):
```
https://abc123@o123456.ingest.sentry.io/123456
```

### Step 3: Environment Variables
Save these values:
```env
NEXT_PUBLIC_SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
```

---

## 5. ⚡ Vercel Deployment

### Step 1: Connect Repository
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your GitHub repository: `cloudmamba24/minimall`

### Step 2: Configure Build Settings
Vercel should auto-detect the monorepo. Configure:

#### Admin App Deployment
- **Framework**: Next.js
- **Root Directory**: `apps/admin`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

#### Public App Deployment  
- **Framework**: Next.js
- **Root Directory**: `apps/public`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 3: Environment Variables

#### For Admin App (`apps/admin`):
```env
# Database
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/minimall?sslmode=require"

# Shopify
SHOPIFY_API_KEY="your-shopify-client-id"
SHOPIFY_API_SECRET="your-shopify-client-secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders,read_customers,read_themes,write_themes"

# R2 Storage
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY="your-r2-access-key"
R2_SECRET="your-r2-secret-key"
R2_BUCKET_NAME="minimall-assets"
R2_DOMAIN="your-custom-domain.com"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"

# Environment
NODE_ENV="production"
```

#### For Public App (`apps/public`):
```env
# Database (read-only operations)
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/minimall?sslmode=require"

# R2 Storage (for assets)
R2_DOMAIN="your-custom-domain.com"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"

# Environment
NODE_ENV="production"
```

### Step 4: Deploy
1. Click **Deploy** for both apps
2. Wait for deployment to complete
3. Copy the deployment URLs:
   - Admin: `https://minimall-admin-xxx.vercel.app`
   - Public: `https://minimall-public-xxx.vercel.app`

---

## 6. 🔄 Update Shopify App Configuration

### Step 1: Update App URLs
1. Go back to your Shopify Partner dashboard
2. Update your app configuration:
   - **App URL**: `https://minimall-admin-xxx.vercel.app`
   - **Allowed redirection URL(s)**:
     ```
     https://minimall-admin-xxx.vercel.app/api/auth/callback
     ```

### Step 2: Test Installation
1. In Partner dashboard, click **Test on development store**
2. Install the app on a test store
3. Verify the admin interface loads correctly

---

## 7. 🗃️ Database Migration

### Step 1: Run Migrations
```bash
# Install dependencies locally
npm install

# Run database migrations
npm run db:migrate --workspace=@minimall/db
```

### Step 2: Verify Schema
```bash
# Check database connection
npm run db:studio --workspace=@minimall/db
```

---

## 8. 🧪 Testing & Verification

### Checklist
- [ ] Admin app loads at Vercel URL
- [ ] Public app loads at Vercel URL
- [ ] Database connections work
- [ ] File uploads to R2 work
- [ ] Shopify app installs successfully
- [ ] Error monitoring captures test errors
- [ ] All environment variables are set

### Test Commands
```bash
# Run all tests
npm test

# Check builds
npm run build

# Lint all packages  
npm run lint
```

---

## 9. 🌐 Custom Domains (Optional)

### Admin Domain
1. In Vercel, go to your admin project
2. **Settings** → **Domains**
3. Add domain: `admin.yourdomain.com`
4. Update DNS records as instructed
5. Update Shopify app URLs to use custom domain

### Public Domain
1. In Vercel, go to your public project  
2. **Settings** → **Domains**
3. Add domain: `links.yourdomain.com`
4. Update DNS records as instructured

---

## 10. 📊 Monitoring & Analytics

### Vercel Analytics
1. Enable **Vercel Analytics** in project settings
2. Add to your Next.js apps:
```bash
npm install @vercel/analytics
```

### Sentry Performance
1. Enable **Performance Monitoring** in Sentry
2. Configure in your apps for:
   - Page load times
   - API response times
   - Database query performance

---

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- **Issue**: TypeScript errors during build
- **Solution**: Run `npm run type-check` locally and fix errors

#### Database Connection Issues
- **Issue**: Connection timeouts
- **Solution**: Add `connect_timeout=10` to connection string

#### R2 Upload Failures
- **Issue**: CORS errors
- **Solution**: Verify CORS configuration in R2 bucket

#### Shopify App Installation Issues
- **Issue**: Redirect URI mismatch
- **Solution**: Ensure URLs match exactly (no trailing slashes)

### Support Resources
- [Vercel Support](https://vercel.com/support)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Neon Database Docs](https://neon.tech/docs)
- [Sentry Docs](https://docs.sentry.io/)

---

## 🎉 Congratulations!

Your MINIMALL platform is now deployed and ready for production use! 

### Next Steps:
1. Set up monitoring alerts
2. Configure backup strategies
3. Plan scaling for growth
4. Set up CI/CD workflows for future updates

### Production Checklist:
- [ ] All services configured and tested
- [ ] Custom domains set up
- [ ] SSL certificates active
- [ ] Monitoring and alerts configured
- [ ] Backup strategies in place
- [ ] Documentation updated with production URLs

**Need Help?** Check the troubleshooting section above or reach out to the development team with specific error messages and configuration details.