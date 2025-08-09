# Vercel Dual Deployment Setup Guide

This guide explains how to set up dual deployments for MINIMALL on Vercel: one for the public Instagram-native app and one for the Shopify admin interface.

## Overview

Our monorepo contains two Next.js applications that need to be deployed separately:
- **Public App** (`apps/public/`) - Instagram-native customer-facing interface
- **Admin App** (`apps/admin/`) - Shopify admin panel and management interface

## Configuration Files

### 1. Public App Configuration (`vercel.json`)
```json
{
  "$schema": "https://vercel.com/schema/vercel.json",
  "name": "minimall-public",
  "buildCommand": "npx turbo build --filter=@minimall/public",
  "outputDirectory": "apps/public/.next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "functions": {
    "apps/public/src/app/**/*.ts": {
      "runtime": "nodejs22.x"
    }
  }
}
```

### 2. Admin App Configuration (`vercel-admin.json`)
```json
{
  "$schema": "https://vercel.com/schema/vercel.json",
  "name": "minimall-admin",
  "buildCommand": "npx turbo build --filter=@minimall/admin",
  "outputDirectory": "apps/admin/.next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "functions": {
    "apps/admin/src/app/**/*.ts": {
      "runtime": "nodejs22.x"
    }
  }
}
```

## Deployment Steps

### Step 1: Create Public App Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. **Important**: Keep the Root Directory as default (repository root)
5. Set Project Name: `minimall-public`
6. Vercel will automatically use `vercel.json` configuration
7. Configure environment variables (see Environment Variables section below)
8. Deploy

### Step 2: Create Admin App Project on Vercel

1. In Vercel Dashboard, click "New Project" again
2. Import the **same** GitHub repository
3. **Important**: Keep the Root Directory as default (repository root)
4. Set Project Name: `minimall-admin`
5. **Important**: Upload `vercel-admin.json` as the project configuration
6. Configure admin-specific environment variables
7. Deploy

## Environment Variables

### Public App Environment Variables
```bash
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# R2 Storage
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET=your_r2_secret_key
R2_BUCKET_NAME=minimall-configs

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Admin App Environment Variables
```bash
# Core Configuration  
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com

# Database
DATABASE_URL=postgresql://username:password@host:5432/minimall

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_secret_key
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes,read_customers,read_orders
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key

# Authentication
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://admin.yourdomain.com

# R2 Storage (same as public)
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET=your_r2_secret_key
R2_BUCKET_NAME=minimall-configs

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

## Domain Configuration

### Public App Domain
- Production: `yourdomain.com`
- Preview: `minimall-public-git-main-yourusername.vercel.app`

### Admin App Domain  
- Production: `admin.yourdomain.com`
- Preview: `minimall-admin-git-main-yourusername.vercel.app`

## Key Architecture Decisions

### 1. Monorepo Build Commands
- Uses custom `buildCommand` with Turbo filters for monorepo builds
- Each project uses proper `outputDirectory` pointing to its `.next` folder
- Maintains repository root as the working directory for dependency resolution

### 2. Shared Dependencies
Critical build dependencies are now in root `package.json`:
- `autoprefixer` - PostCSS plugin for CSS prefixing
- `postcss` - CSS transformation tool
- `tailwindcss` - Utility-first CSS framework
- `framer-motion` - Animation library
- `lucide-react` - Icon library

### 3. Separate Vercel Projects
- Each app gets its own Vercel project
- Independent deployments and rollbacks
- Separate domain management
- Isolated environment variables

## Troubleshooting

### Build Failures
If builds fail with "module not found" errors:

1. **Check Dependencies**: Ensure critical dependencies are in root `package.json`
2. **Clear Cache**: Delete `.vercel` cache in Vercel dashboard
3. **Redeploy**: Trigger new deployment from GitHub commit

### Environment Variables
If environment variables aren't available:

1. **Check Turbo Config**: Ensure variables are listed in `turbo.json`
2. **Verify Vercel Settings**: Check environment variables in Vercel dashboard
3. **Case Sensitivity**: Environment variable names are case-sensitive

### Domain Issues
For custom domain setup:

1. **DNS Configuration**: Point domains to Vercel name servers
2. **SSL Certificates**: Vercel automatically provisions Let's Encrypt certificates
3. **Shopify Setup**: Update Shopify Partner Dashboard with admin domain

## Deployment Verification

After successful deployment, verify:

1. **Public App**: Visit your public domain, test Instagram-native features
2. **Admin App**: Visit admin domain, verify Shopify OAuth flow
3. **API Endpoints**: Test API routes for both apps
4. **Database Connection**: Verify admin can connect to database
5. **R2 Storage**: Test image uploads and asset management

## Maintenance

### Updates
- Both apps deploy automatically from the same GitHub repository
- Use feature flags to control rollouts
- Monitor deployment status in Vercel dashboard

### Monitoring
- Vercel Analytics enabled for both apps
- Sentry error tracking configured
- Custom metrics available via API routes

## Support

For deployment issues:
1. Check Vercel build logs
2. Review environment variable configuration
3. Verify monorepo structure matches documentation
4. Test builds locally with `npx turbo build`