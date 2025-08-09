# 🔥 **SHOPIFY INSIDER SETUP GUIDE**

*The real process that actually works - no BS, just the cheat codes*

---

## 🎯 **THE FULL SHOPIFY DEVELOPER SETUP PROCESS**

### **PHASE 1: Partner Dashboard Setup** 
**🔗 URL:** `https://partners.shopify.com/`

#### **Step 1: Create Partner Account**
```bash
# 🔑 INSIDER TIP: Use a business email, not Gmail
# Shopify flags personal emails for manual review
```

1. **Sign up** at partners.shopify.com
2. **Choose "Build apps"** (not "Sell themes")
3. **Business Info:** Use real business details
4. **Tax Info:** You'll need this for payouts later

#### **Step 2: Create Your App** 
1. **Dashboard** → **Apps** → **Create App**
2. **App Type:** Choose **"Public App"** (for App Store)
   - *Or "Custom App" for private use*
3. **App Name:** "MiniMall" (or whatever you want)
4. **App URL:** `https://admin.yourdomain.com`
5. **Allowed Redirection URLs:** 
   ```
   https://admin.yourdomain.com/api/auth/shopify/callback
   ```

---

### **PHASE 2: App Configuration** 

#### **Critical Settings in Partner Dashboard:**

**🔐 App Setup Tab:**
- **App URL:** `https://admin.yourdomain.com`
- **Allowed redirection URLs:** `https://admin.yourdomain.com/api/auth/shopify/callback`
- **Webhooks:** `https://admin.yourdomain.com/api/webhooks/`

**🔑 App Credentials (SAVE THESE!):**
```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
```

**📋 Required Scopes:** (Add these in Partner Dashboard)
```
read_products
write_products
read_themes
write_script_tags
read_orders
```

---

### **PHASE 3: Shopify CLI Setup** 

#### **Install Shopify CLI:**
```bash
npm install -g @shopify/cli @shopify/theme
```

#### **🔑 CHEAT CODE: Skip the CLI bullshit**
Most tutorials make you use Shopify CLI for everything. **You don't need it** if you:
1. Manually configure your Partner Dashboard (above)
2. Deploy to your own domains (Vercel)
3. Handle OAuth yourself (which you already do)

**CLI is only needed for:**
- Theme development
- GraphiQL debugging
- Shopify Functions (advanced)

---

### **PHASE 4: Testing Your App**

#### **Step 1: Create Development Store**
1. **Partner Dashboard** → **Stores** → **Create development store**
2. **Purpose:** "Test my app"
3. **Store type:** "Development store"

#### **Step 2: Install Your App**
1. **Partner Dashboard** → **Apps** → **[Your App]** → **Test on development store**
2. **OR** navigate to: `https://your-dev-store.myshopify.com/admin/apps`
3. **Install** your app

#### **🔑 INSIDER SECRET:**
Your app's install URL format:
```
https://{shop}.myshopify.com/admin/oauth/authorize?client_id={api_key}&scope={scopes}&redirect_uri={redirect_url}
```

---

### **PHASE 5: Going Live (Production)**

#### **Requirements for App Store:**
1. **App must be public** (not development)
2. **Privacy policy** required
3. **GDPR compliance** required  
4. **Support email** required
5. **App listing** with screenshots

#### **🔥 CHEAT CODE: Skip App Store Initially**
You can distribute privately by:
1. Sharing your app's install URL directly
2. Adding specific stores to your "Development stores" list
3. No App Store approval needed!

---

### **PHASE 6: Production Deployment Checklist**

#### **✅ Shopify Partner Dashboard:**
- [ ] App created with production URLs
- [ ] Scopes configured
- [ ] Webhooks configured  
- [ ] App reviewed and approved (if going to App Store)

#### **✅ Your Deployment:**
- [ ] Admin app deployed: `https://admin.yourdomain.com`
- [ ] Public app deployed: `https://link.yourdomain.com`
- [ ] Environment variables set
- [ ] Database connected
- [ ] SSL certificates active

#### **✅ DNS & Domains:**
- [ ] Custom domain connected to Vercel
- [ ] SSL working on both domains
- [ ] Redirect URLs updated in Partner Dashboard

---

### **🚨 COMMON GOTCHAS & SOLUTIONS**

#### **Problem 1: "App installation failed"**
**Solution:** Check your redirect URL exactly matches Partner Dashboard

#### **Problem 2: "Invalid scope"** 
**Solution:** Scopes in code must match Partner Dashboard exactly

#### **Problem 3: "Webhook delivery failed"**
**Solution:** Your webhook endpoints must return 200 status

#### **Problem 4: "App not loading in admin"**
**Solution:** Check Content Security Policy and iframe settings

---

### **🔧 Environment Variables Needed**

```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# Your App URLs  
SHOPIFY_APP_URL=https://admin.yourdomain.com
PUBLIC_APP_URL=https://link.yourdomain.com

# Database
DATABASE_URL=your_database_url

# Other services
SENTRY_DSN=your_sentry_dsn
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
```

---

### **🎯 Quick Test Commands**

```bash
# Test your OAuth flow
curl "https://admin.yourdomain.com/api/auth/shopify/install?shop=test.myshopify.com"

# Test webhook delivery
curl -X POST https://admin.yourdomain.com/api/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

**💡 Remember:** Shopify development is 70% configuration, 30% code. Get the Partner Dashboard right and everything else falls into place!