# Deployment Guide

## Vercel Deployment

This monorepo contains two Next.js applications:
- `apps/public` - Public-facing link-in-bio site
- `apps/admin` - Shopify app admin interface

### Configuration Options

**Option 1: Use vercel.json (Current)**
The included `vercel.json` configures the build to deploy the public app.

**Option 2: Vercel Dashboard Configuration**
Alternatively, you can configure in the Vercel dashboard:
1. Go to Project Settings
2. Set Root Directory to: `apps/public`
3. Remove or ignore the `vercel.json` file

### Environment Variables

Make sure to set these in your Vercel environment:
- `SHOPIFY_API_KEY`
- `SHOPIFY_SECRET_KEY` 
- `DATABASE_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ACCOUNT_ID`

### Build Commands

The build uses TurboRepo for optimal caching:
- Install: `npm install`
- Build: `turbo run build --filter=@minimall/public`
- Dev: `turbo run dev --filter=@minimall/public`