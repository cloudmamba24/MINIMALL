# 🚀 MINIMALL Dual Deployment Guide

## Overview

MINIMALL uses a **dual deployment strategy** with two separate Vercel projects from a single GitHub repository:

- **`yourdomain.com`** → Public app (Instagram-native link-in-bio experience)
- **`admin.yourdomain.com`** → Admin app (Shopify embedded admin interface)

## 📋 Deployment Setup Checklist

### 1. Vercel Projects Setup

#### Create Public App Project
1. **Connect to GitHub**: Link your `minimall` repository
2. **Import Settings**:
   - **Project Name**: `minimall-public`
   - **Framework**: Next.js
   - **Root Directory**: Leave blank (uses monorepo detection)
   - **Build Command**: Uses `vercel.json` configuration
3. **Domain**: Connect your main domain (e.g., `yourdomain.com`)

#### Create Admin App Project  
1. **Connect to GitHub**: Same `minimall` repository
2. **Import Settings**:
   - **Project Name**: `minimall-admin`
   - **Framework**: Next.js  
   - **Root Directory**: Leave blank
   - **Build Command**: Uses `vercel-admin.json` configuration
3. **Domain**: Connect admin subdomain (e.g., `admin.yourdomain.com`)

### 2. Environment Variables Configuration

#### Public App Environment Variables (`yourdomain.com`)
```env
# R2 Storage
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET=your_r2_secret_key
R2_BUCKET_NAME=minimall-configs

# Base URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Shopify Storefront (for product data)
SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxx
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

#### Admin App Environment Variables (`admin.yourdomain.com`)
```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes,read_customers,read_orders
NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key

# App URLs
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

### 3. Shopify Partner Dashboard Configuration

1. **Navigate to**: [Shopify Partners Dashboard](https://partners.shopify.com/)
2. **Update App Settings**:
   - **App URL**: `https://admin.yourdomain.com/admin`
   - **Allowed redirection URLs**: 
     - `https://admin.yourdomain.com/api/auth/shopify/callback`
     - `https://admin.yourdomain.com/admin/auth/callback`
   - **Webhook endpoints**: All pointing to `admin.yourdomain.com`

### 4. DNS Configuration

Set up DNS records with your domain provider:

```dns
# A Records (if using A records)
yourdomain.com        A    76.76.19.61  # Vercel IP
admin.yourdomain.com  A    76.76.19.61  # Vercel IP

# CNAME Records (recommended)
yourdomain.com        CNAME  cname.vercel-dns.com
admin.yourdomain.com  CNAME  cname.vercel-dns.com
```

### 5. SSL Certificates

Both domains automatically get SSL certificates through Vercel. Wait 24-48 hours for DNS propagation and certificate provisioning.

## 🔧 Deployment Commands

### Manual Deployment
```bash
# Deploy public app
vercel --prod --config vercel.json

# Deploy admin app  
vercel --prod --config vercel-admin.json
```

### Automatic Deployment
Both apps automatically deploy when you push to the `main` branch on GitHub.

## 🧪 Testing the Setup

### Public App Testing
```bash
# Test homepage
curl https://yourdomain.com

# Test demo page
curl https://yourdomain.com/g/demo

# Test API health
curl https://yourdomain.com/api/health
```

### Admin App Testing
```bash
# Test admin redirect
curl -I https://admin.yourdomain.com

# Test Shopify auth
curl https://admin.yourdomain.com/api/auth/shopify/install

# Test webhooks endpoint
curl https://admin.yourdomain.com/api/webhooks/app/uninstalled
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Domain not found" errors
- **Cause**: DNS not propagated or misconfigured
- **Solution**: Check DNS settings, wait for propagation (up to 48 hours)

#### 2. Shopify OAuth failures
- **Cause**: Mismatched redirect URLs
- **Solution**: Ensure Shopify Partner Dashboard URLs match your admin domain

#### 3. Build failures
- **Cause**: Missing environment variables
- **Solution**: Verify all required env vars are set in both Vercel projects

#### 4. Webhook delivery failures
- **Cause**: Admin app not accessible or wrong endpoints
- **Solution**: Test admin domain accessibility, verify webhook URLs

### Debug Commands
```bash
# Check DNS resolution
nslookup yourdomain.com
nslookup admin.yourdomain.com

# Test SSL certificates
openssl s_client -connect yourdomain.com:443
openssl s_client -connect admin.yourdomain.com:443

# Check HTTP responses
curl -I https://yourdomain.com
curl -I https://admin.yourdomain.com
```

## 📊 Architecture Benefits

### ✅ **Advantages**
- **Unified Development**: Single codebase, shared packages
- **Independent Scaling**: Each app scales based on its needs
- **Specialized Configuration**: Optimized for each use case
- **Security Isolation**: Admin and public apps are isolated
- **Better Performance**: Specialized caching and optimization

### ⚠️ **Considerations**
- **Dual Environment Management**: Need to manage two sets of env vars
- **DNS Configuration**: Requires subdomain setup
- **Shopify Configuration**: App URLs must be configured correctly

## 🎯 Production Checklist

- [ ] Both Vercel projects created and connected to GitHub
- [ ] All environment variables configured in both projects
- [ ] DNS records configured for both domains
- [ ] SSL certificates provisioned (automatic via Vercel)
- [ ] Shopify Partner Dashboard updated with admin domain
- [ ] Webhook endpoints tested and responding
- [ ] Both apps tested and accessible
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics configured (if using)

## 📞 Support

For deployment issues:
1. Check this troubleshooting guide
2. Review Vercel build logs
3. Test individual components (DNS, SSL, API endpoints)
4. Verify environment variable configuration

---

**Remember**: This dual deployment setup gives you the best of both worlds - a unified development experience with specialized production deployments for optimal performance and security.