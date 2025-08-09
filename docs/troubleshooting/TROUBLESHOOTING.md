# MINIMALL - Troubleshooting Guide

## Table of Contents
- [Deployment Issues](#deployment-issues)
- [Environment Configuration](#environment-configuration)
- [Build & Runtime Issues](#build--runtime-issues)
- [Common Fixes](#common-fixes)

## Related Documentation
- **[BUILD-SYSTEM-OVERHAUL.md](./BUILD-SYSTEM-OVERHAUL.md)** - For comprehensive build system fixes
- **[REACT_ERROR_185_FIX.md](./REACT_ERROR_185_FIX.md)** - For React infinite loop issues
- **[DIAGNOSTIC-METHODOLOGY.md](./DIAGNOSTIC-METHODOLOGY.md)** - For systematic problem diagnosis

---

## Deployment Issues

### Issue: All Routes Return 404 on Vercel
**Date**: 2025-01-08  
**Status**: ✅ RESOLVED

#### **Problem**
- All routes (including static pages like `/test`) returned 404 on Vercel
- Build completed successfully showing correct routes
- Local development worked perfectly
- Even `/api/health` and `/g/demo` showed 404

#### **Root Cause**
Vercel wasn't properly detecting the Next.js app in the monorepo structure. The app is located at `apps/public/` but Vercel was looking at the root directory.

#### **Solution**
Fixed `vercel.json` configuration:

```json
{
  "buildCommand": "npx turbo build --filter=@minimall/public",
  "outputDirectory": "apps/public/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Key Fix**: Adding `"framework": "nextjs"` was critical for Vercel to properly recognize and serve the Next.js app.

#### **Files Changed**
- `vercel.json` - Updated deployment configuration
- `turbo.json` - Added environment variables to build task

#### **Environment Variables Required**
```
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_access_key
R2_SECRET=your_secret_key  
R2_BUCKET_NAME=minimall-configs
NEXT_PUBLIC_BASE_URL=https://your-site.vercel.app
```

#### **Verification Steps**
1. Test static route: `/test` → Should show green success page
2. Test API route: `/api/health` → Should return JSON
3. Test demo route: `/g/demo` → Should show demo store with blue banner

#### **Lessons Learned**
- Always specify `framework` in vercel.json for monorepos
- Use specific turbo filter commands for targeted builds
- Environment variables must be declared in turbo.json for build-time access
- Test deployment systematically: static → API → dynamic routes

---

## Environment Configuration

### Turbo Environment Variables
**Issue**: Environment variables not available during build  
**Solution**: Add to `turbo.json` build task:

```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": [".next/**", "!.next/cache/**", "dist/**"],
    "env": [
      "R2_ENDPOINT",
      "R2_ACCESS_KEY", 
      "R2_SECRET",
      "R2_BUCKET_NAME",
      "NEXT_PUBLIC_BASE_URL",
      "NODE_ENV"
    ]
  }
}
```

### Vercel Environment Variables
Set in Vercel Dashboard → Settings → Environment Variables:
- Set for: Production, Preview, Development
- All R2 credentials must be set
- `NEXT_PUBLIC_BASE_URL` must match deployment URL

---

## Build & Runtime Issues

### Next.js 15 Metadata Viewport Warning
**Warning**: `viewport` property deprecated in metadata export

**Solution**: Use separate `generateViewport` function:
```typescript
// ❌ Old way (deprecated)
export const metadata = {
  viewport: 'width=device-width, initial-scale=1'
}

// ✅ New way (Next.js 15+)
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}
```

### Edge Runtime Static Generation Warning
**Warning**: Using edge runtime disables static generation

**Analysis**: Only `/g/[configId]` should use edge runtime (for R2 calls)
**Solution**: Removed edge runtime from layout.tsx to enable static generation for other pages

### Node.js Crypto Import Compatibility Issue
**Date**: 2025-01-09  
**Status**: ✅ RESOLVED

#### **Problem**
- `import crypto from "node:crypto"` caused webpack build failures in Next.js
- Vercel edge SSR loader couldn't handle Node.js protocol imports
- Lint rules enforced `node:crypto` but this broke client-side builds

#### **Root Cause**
Next.js edge runtime and webpack don't support `node:` protocol imports for crypto module in client-side code.

#### **Solution**
1. **Changed import syntax**: `"node:crypto"` → `"crypto"`
2. **Created separate client/server exports** in core package
3. **Updated lint configuration**: Added `"useNodejsImportProtocol": "off"` to resolve conflicts

#### **Files Fixed**
- `packages/core/src/auth/shopify-auth.ts` - Changed crypto import
- `apps/admin/src/lib/webhook-handler.ts` - Changed crypto import  
- `packages/core/biome.json` - Disabled Node.js import protocol rule
- `packages/core/src/client.ts` - Created client-safe exports
- `packages/core/src/server.ts` - Created server-safe exports

#### **Verification**
✅ All packages build successfully  
✅ Vercel deployment completes without errors  
✅ No lint warnings remain

---

## Common Fixes

### Quick Deployment Test URLs
Replace `YOUR-SITE-URL` with your Vercel deployment URL:

```bash
# Test static routing
curl https://YOUR-SITE-URL/test

# Test API health  
curl https://YOUR-SITE-URL/api/health

# Test demo page (should not 404)
curl -I https://YOUR-SITE-URL/g/demo

# Test R2 debug info
curl https://YOUR-SITE-URL/api/debug/r2
```

### Build Commands Reference
```bash
# Local development
npm run dev

# Test build locally  
npm run build

# Build specific app
npx turbo build --filter=@minimall/public

# Check turbo cache
npx turbo build --dry-run --filter=@minimall/public
```

### Monorepo Structure Validation
```
✅ Correct structure:
/
├── package.json (root - has turbo scripts)
├── turbo.json (build configuration)  
├── vercel.json (deployment config)
├── apps/
│   └── public/ (Next.js app)
│       ├── package.json
│       ├── next.config.js
│       └── src/app/ (App Router)
└── packages/ (shared libraries)
    ├── core/
    ├── db/
    └── ui/
```

---

## Debugging Checklist

### Before Deployment
- [ ] Local build successful: `npm run build`
- [ ] All environment variables set in Vercel dashboard
- [ ] `vercel.json` has correct framework and output directory
- [ ] `turbo.json` includes required environment variables

### After Deployment
- [ ] Build logs show successful completion
- [ ] No framework detection warnings
- [ ] Routes generated correctly in build output
- [ ] Test URLs return expected responses (not 404)

### Red Flags
- ⚠️ All routes returning 404 = deployment config issue
- ⚠️ Environment variable warnings = turbo.json issue  
- ⚠️ Build succeeds but 404s = framework detection issue
- ⚠️ API routes 404 = routing configuration problem

---

## Contact & Updates

**Last Updated**: 2025-01-08  
**Next Review**: When new deployment issues arise  

Add new issues to this document with:
- Date and status
- Clear problem description  
- Root cause analysis
- Step-by-step solution
- Verification steps
- Files changed