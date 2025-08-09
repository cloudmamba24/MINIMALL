# Vercel Deployment Configurations

Since we have two separate Vercel projects deploying from the same GitHub repo, we configure each project individually in their Vercel dashboard settings instead of using vercel.json files.

## Public App Project Settings

**Project**: minimall (minimall-tau.vercel.app)
**Build Command**: `npx turbo build --filter=@minimall/public --force`
**Output Directory**: `apps/public/.next`
**Install Command**: `npm ci`
**Framework**: Next.js

## Admin App Project Settings

**Project**: minimall-admin (minimall-admin.vercel.app)  
**Build Command**: `npx turbo build --filter=@minimall/admin --force`
**Output Directory**: `apps/admin/.next`
**Install Command**: `npm ci`
**Framework**: Next.js

### Environment Variables (Admin Project Only)
- `NEXT_PUBLIC_SHOPIFY_API_KEY`: Your Shopify API key
- `NODE_ENV`: production
- `NEXT_PUBLIC_APP_ENV`: production

## Configuration Files (For Reference)

- `vercel-public.json` - Configuration template for public app
- `vercel-admin.json` - Configuration template for admin app  
- `vercel.json.backup` - Previous configuration file (not used)

## Setup Instructions

1. **Public Project**: Go to Vercel dashboard → Project Settings → Build & Output Settings
2. **Admin Project**: Go to Vercel dashboard → Project Settings → Build & Output Settings
3. Copy the respective build settings from above
4. Deploy both projects

This approach ensures each project builds the correct app without conflicts.