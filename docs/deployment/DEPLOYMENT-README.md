# 🚀 MINIMALL Deployment Documentation

## Quick Links

- **[Dual Deployment Guide](DUAL-DEPLOYMENT-GUIDE.md)** - Complete setup instructions
- **[Environment Template](quick-start/ENVIRONMENT-TEMPLATE.env)** - All required environment variables
- **[Shopify Setup Guide](quick-start/SHOPIFY-SETUP-GUIDE.md)** - Shopify Partner Dashboard configuration

## 🏗️ Architecture Overview

MINIMALL uses a **dual deployment strategy** for optimal performance and security:

```
┌─────────────────────────┐    ┌─────────────────────────┐
│     Public App          │    │      Admin App          │
│   yourdomain.com        │    │  admin.yourdomain.com   │
├─────────────────────────┤    ├─────────────────────────┤
│ • Instagram-native UX   │    │ • Shopify embedded app  │
│ • Link-in-bio pages     │    │ • Drag-and-drop editor  │
│ • Fast product display  │    │ • Configuration manager │
│ • Edge-optimized        │    │ • Analytics dashboard   │
│ • Customer-facing       │    │ • Merchant-facing       │
└─────────────────────────┘    └─────────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                          │
                ┌─────────────────────────┐
                │   Shared Resources      │
                ├─────────────────────────┤
                │ • Single GitHub repo    │
                │ • Shared database       │
                │ • Shared R2 storage     │
                │ • Shared packages       │
                └─────────────────────────┘
```

## 🎯 Why Dual Deployment?

### ✅ **Benefits**
- **Specialized Performance**: Each app optimized for its use case
- **Security Isolation**: Admin functions isolated from public app
- **Shopify Compliance**: Proper OAuth setup with dedicated admin domain
- **Independent Scaling**: Scale based on merchant vs customer traffic
- **Better Caching**: Specialized caching strategies for each app

### 🔧 **Technical Details**
- **Single Codebase**: Both apps built from same monorepo
- **Shared Libraries**: Common packages (@minimall/core, @minimall/ui, @minimall/db)
- **Separate Deployments**: Independent Vercel projects with specialized configs
- **Domain Separation**: Public (.com) vs Admin (admin.domain.com)

## 📋 Quick Setup Checklist

1. **Repository Setup**
   - [x] Single GitHub repository with monorepo structure
   - [x] Both apps configured in same codebase

2. **Vercel Projects**
   - [ ] Create `minimall-public` project (uses `vercel.json`)
   - [ ] Create `minimall-admin` project (uses `vercel-admin.json`)
   - [ ] Connect both projects to same GitHub repo

3. **Domain Configuration**
   - [ ] Set up DNS for main domain (`yourdomain.com`)
   - [ ] Set up DNS for admin subdomain (`admin.yourdomain.com`)
   - [ ] Configure domains in respective Vercel projects

4. **Environment Variables**
   - [ ] Configure public app environment variables
   - [ ] Configure admin app environment variables
   - [ ] Use [environment template](quick-start/ENVIRONMENT-TEMPLATE.env) as reference

5. **Shopify Configuration**
   - [ ] Update Shopify Partner Dashboard with admin domain
   - [ ] Configure OAuth redirect URLs
   - [ ] Set up webhook endpoints

6. **Testing & Verification**
   - [ ] Run deployment setup script: `./scripts/deploy-setup.sh`
   - [ ] Test both deployments: `./scripts/verify-deployment.sh`
   - [ ] Verify Shopify app installation

## 🛠️ Automated Setup

Use our automated setup scripts to streamline the deployment process:

```bash
# Validate deployment configuration
./scripts/deploy-setup.sh

# Verify deployment after setup
./scripts/verify-deployment.sh
```

## 📚 Documentation Structure

```
docs/deployment/
├── DEPLOYMENT-README.md              # This file
├── DUAL-DEPLOYMENT-GUIDE.md          # Complete setup guide
├── AI-CONTEXT-GUIDE.md               # AI assistant context
└── quick-start/
    ├── DEPLOYMENT-GUIDE.md           # Step-by-step instructions
    ├── ENVIRONMENT-TEMPLATE.env      # Environment variables template
    ├── QUICK-START-CHECKLIST.md      # Setup checklist
    ├── SHOPIFY-SETUP-GUIDE.md        # Shopify Partner Dashboard setup
    └── README.md                     # Quick start overview
```

## 🚨 Common Issues & Solutions

### DNS Not Resolving
- **Wait**: DNS propagation can take up to 48 hours
- **Check**: Verify DNS records with your domain provider
- **Test**: Use `nslookup yourdomain.com` to verify

### SSL Certificate Issues
- **Wait**: Vercel SSL provisioning takes a few hours
- **Check**: Ensure domains are properly connected in Vercel
- **Retry**: Force SSL certificate renewal in Vercel dashboard

### Shopify OAuth Failures
- **URLs**: Ensure Partner Dashboard URLs match your admin domain exactly
- **HTTPS**: All URLs must use HTTPS in production
- **Scopes**: Verify scopes match between app configuration and Partner Dashboard

### Build Failures
- **Environment Variables**: Check all required variables are set
- **Dependencies**: Ensure all packages install correctly
- **Paths**: Verify monorepo paths in build configurations

## 🆘 Getting Help

1. **Check Documentation**: Review the complete [Dual Deployment Guide](DUAL-DEPLOYMENT-GUIDE.md)
2. **Run Verification**: Use `./scripts/verify-deployment.sh` to diagnose issues
3. **Check Logs**: Review Vercel build and function logs
4. **Test Components**: Verify each piece (DNS, SSL, APIs) individually

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Both domains resolve and have valid SSL certificates
- ✅ Public app shows Instagram-native experience on mobile
- ✅ Admin app loads and accepts Shopify OAuth
- ✅ Configuration changes in admin reflect on public site
- ✅ All API endpoints respond correctly
- ✅ Webhooks are delivered successfully

---

**Ready to deploy?** Start with the [Dual Deployment Guide](DUAL-DEPLOYMENT-GUIDE.md) for complete setup instructions!