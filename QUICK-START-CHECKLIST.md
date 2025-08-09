# ⚡ MINIMALL Quick Start Checklist

Use this checklist to quickly set up and deploy your MINIMALL platform. Each section should take 5-10 minutes.

## 📝 Pre-Deployment (30 minutes)

### Database Setup - Neon PostgreSQL
- [ ] Sign up at [neon.tech](https://neon.tech/)
- [ ] Create project: `minimall-production`
- [ ] Copy connection string (with `-pooler`)
- [ ] Save as `DATABASE_URL` in environment file

### Storage Setup - Cloudflare R2  
- [ ] Sign up at [cloudflare.com](https://cloudflare.com/)
- [ ] Create bucket: `minimall-assets`
- [ ] Generate API token with Read/Write permissions
- [ ] Save `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET`, `R2_BUCKET_NAME`

### Shopify App Setup
- [ ] Sign up at [partners.shopify.com](https://partners.shopify.com/)
- [ ] Create app: "MINIMALL Link-in-Bio"
- [ ] Copy Client ID and Secret
- [ ] Save as `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- [ ] ⏸️ **PAUSE**: Need Vercel URL first, will update callback later

### Error Monitoring - Sentry
- [ ] Sign up at [sentry.io](https://sentry.io/)
- [ ] Create Next.js project: `minimall`
- [ ] Copy DSN
- [ ] Save as `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`

---

## 🚀 Deployment (15 minutes)

### Vercel Setup
- [ ] Sign up at [vercel.com](https://vercel.com/)
- [ ] Connect GitHub repository
- [ ] Create **2 projects**:
  - [ ] **Admin**: Root directory = `apps/admin`
  - [ ] **Public**: Root directory = `apps/public`

### Environment Variables
- [ ] Copy `ENVIRONMENT-TEMPLATE.env` to your clipboard
- [ ] In **Admin** Vercel project settings, add all environment variables
- [ ] In **Public** Vercel project settings, add these variables:
  ```
  DATABASE_URL
  R2_DOMAIN
  NEXT_PUBLIC_SENTRY_DSN
  SENTRY_DSN
  NODE_ENV
  ```

### Deploy & Get URLs
- [ ] Deploy both projects
- [ ] Copy deployment URLs:
  - [ ] Admin: `https://minimall-admin-xxx.vercel.app`
  - [ ] Public: `https://minimall-public-xxx.vercel.app`

---

## 🔄 Connect Services (10 minutes)

### Update Shopify App
- [ ] Go back to Shopify Partners dashboard
- [ ] Update **App URL**: `https://your-admin-url.vercel.app`  
- [ ] Update **Redirect URI**: `https://your-admin-url.vercel.app/api/auth/callback`
- [ ] Save changes

### Run Database Migration
```bash
# In your local project
npm install
npm run db:migrate --workspace=@minimall/db
```

---

## ✅ Verification (5 minutes)

### Test Each Service
- [ ] **Admin App**: Visit your admin URL, should load without errors
- [ ] **Public App**: Visit your public URL, should load without errors  
- [ ] **Database**: Check Vercel Functions logs, no connection errors
- [ ] **R2 Storage**: Try uploading an image in admin (if UI ready)
- [ ] **Shopify**: Install app on development store, should work
- [ ] **Sentry**: Trigger test error, should appear in Sentry

### Final Checklist
- [ ] All Vercel deployments successful
- [ ] No red error indicators in any dashboards
- [ ] Environment variables set correctly
- [ ] Database connected and migrated
- [ ] Shopify app installable

---

## 🎯 You're Done!

**Total Time**: ~60 minutes

### Your Live URLs:
- **Admin Dashboard**: `https://your-admin-url.vercel.app`
- **Public Sites**: `https://your-public-url.vercel.app/g/[site-id]`

### Next Steps (Optional):
1. **Custom Domains**: Add `admin.yourdomain.com` and `links.yourdomain.com`
2. **Analytics**: Enable Vercel Analytics
3. **Monitoring**: Set up Sentry alerts
4. **Backup**: Configure database backups

### Having Issues?
1. Check Vercel Function logs
2. Verify environment variables are set
3. Ensure no typos in connection strings
4. Refer to full `DEPLOYMENT-GUIDE.md` for troubleshooting

**🎉 Congratulations! Your MINIMALL platform is live!**