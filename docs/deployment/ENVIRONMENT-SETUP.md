# Environment Variables Setup

## Required Environment Variables

### Database Configuration (Critical)
```bash
# PostgreSQL database connection
DATABASE_URL="postgresql://username:password@host:port/database"
```

### R2 Storage Configuration (Critical)
```bash
# Cloudflare R2 credentials
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY="your-access-key"
R2_SECRET="your-secret-key"
R2_BUCKET_NAME="minimall-configs"
```

### Shopify Integration (For cart functionality)
```bash
# Shopify Storefront API
SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-storefront-token"
SHOPIFY_DOMAIN="your-shop.myshopify.com"

# For admin app
SHOPIFY_API_KEY="your-api-key"
SHOPIFY_API_SECRET="your-api-secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders"
```

### Authentication & Security
```bash
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above with your actual values
4. Deploy to activate the new environment variables

## Local Development

Create `.env.local` in both apps:

```bash
# Copy the variables above with your development values
DATABASE_URL="postgresql://localhost:5432/minimall_dev"
R2_ENDPOINT="https://dev-account.r2.cloudflarestorage.com"
# ... etc
```

## Database Setup

1. Create PostgreSQL database
2. Run migrations: `cd packages/db && npm run db:push`
3. Verify connection with debug endpoints

## R2 Storage Setup

1. Create Cloudflare R2 bucket named `minimall-configs`
2. Generate API tokens with read/write permissions
3. Test connection with debug endpoints

## Testing Connectivity

- Database: `/api/debug/db` 
- R2 Storage: `/api/debug/r2`
- Full system: `/api/debug/health`