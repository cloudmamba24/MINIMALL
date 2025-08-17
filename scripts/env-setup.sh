#!/bin/bash

# Environment Setup Script
# Helps developers set up their local environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}MINIMALL Environment Setup${NC}"
echo "============================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
fi

# Copy from example
if [ -f .env.example ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Created .env.local from .env.example"
else
    echo "Error: .env.example not found"
    exit 1
fi

# Helper function to prompt for value
prompt_for_value() {
    local var_name=$1
    local description=$2
    local is_secret=${3:-false}
    local current_value=$(grep "^$var_name=" .env.local | cut -d'=' -f2)
    
    echo ""
    echo -e "${BLUE}$description${NC}"
    
    if [ "$is_secret" = true ]; then
        read -s -p "Enter $var_name: " value
        echo ""
    else
        read -p "Enter $var_name [$current_value]: " value
        value=${value:-$current_value}
    fi
    
    if [ -n "$value" ]; then
        # Escape special characters for sed
        escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "s|^$var_name=.*|$var_name=$escaped_value|" .env.local
        echo -e "${GREEN}✓${NC} Set $var_name"
    fi
}

echo ""
echo "Let's configure your environment variables:"
echo "==========================================="

# Required variables
echo ""
echo -e "${YELLOW}Required Configuration:${NC}"

prompt_for_value "DATABASE_URL" "PostgreSQL connection string (e.g., postgresql://user:pass@host/db)" true
prompt_for_value "NEXTAUTH_SECRET" "NextAuth secret (generate with: openssl rand -base64 32)" true

# Shopify Configuration
echo ""
echo -e "${YELLOW}Shopify Configuration:${NC}"
echo "Get these from your Shopify Partner Dashboard"

prompt_for_value "SHOPIFY_API_KEY" "Shopify API Key"
prompt_for_value "SHOPIFY_API_SECRET" "Shopify API Secret" true
prompt_for_value "SHOPIFY_DOMAIN" "Shopify store domain (e.g., mystore.myshopify.com)"
prompt_for_value "SHOPIFY_STOREFRONT_ACCESS_TOKEN" "Storefront Access Token" true
prompt_for_value "SHOPIFY_WEBHOOK_SECRET" "Webhook Secret" true

# R2 Storage
echo ""
echo -e "${YELLOW}Cloudflare R2 Storage:${NC}"
echo "Get these from your Cloudflare Dashboard"

prompt_for_value "R2_ENDPOINT" "R2 Endpoint URL"
prompt_for_value "R2_ACCESS_KEY" "R2 Access Key"
prompt_for_value "R2_SECRET" "R2 Secret Key" true
prompt_for_value "R2_BUCKET_NAME" "R2 Bucket Name"
prompt_for_value "R2_PUBLIC_URL" "R2 Public URL"

# Optional services
echo ""
echo -e "${YELLOW}Optional Services:${NC}"

read -p "Configure Sentry error tracking? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    prompt_for_value "SENTRY_DSN" "Sentry DSN (from sentry.io)"
    prompt_for_value "SENTRY_ORG" "Sentry Organization"
    prompt_for_value "SENTRY_PROJECT" "Sentry Project"
fi

# Generate tokens
echo ""
echo -e "${YELLOW}Generating secure tokens...${NC}"

INTERNAL_TOKEN=$(openssl rand -hex 32)
sed -i "s|^INTERNAL_API_TOKEN=.*|INTERNAL_API_TOKEN=$INTERNAL_TOKEN|" .env.local
echo -e "${GREEN}✓${NC} Generated INTERNAL_API_TOKEN"

CRON_TOKEN=$(openssl rand -hex 32)
sed -i "s|^CRON_SECRET=.*|CRON_SECRET=$CRON_TOKEN|" .env.local
echo -e "${GREEN}✓${NC} Generated CRON_SECRET"

# Set development defaults
echo ""
echo -e "${YELLOW}Setting development defaults...${NC}"

sed -i "s|^NODE_ENV=.*|NODE_ENV=development|" .env.local
sed -i "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=http://localhost:3000|" .env.local
sed -i "s|^NEXT_PUBLIC_ADMIN_URL=.*|NEXT_PUBLIC_ADMIN_URL=http://localhost:3001|" .env.local
sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://localhost:3001|" .env.local

echo -e "${GREEN}✓${NC} Set development URLs"

# Feature flags
echo ""
read -p "Enable all feature flags for development? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    sed -i "s|^FEATURE_ADVANCED_ANALYTICS=.*|FEATURE_ADVANCED_ANALYTICS=true|" .env.local
    sed -i "s|^FEATURE_SOCIAL_IMPORT=.*|FEATURE_SOCIAL_IMPORT=true|" .env.local
    sed -i "s|^FEATURE_PERFORMANCE_MONITORING=.*|FEATURE_PERFORMANCE_MONITORING=true|" .env.local
    echo -e "${GREEN}✓${NC} Enabled all feature flags"
fi

# Validate configuration
echo ""
echo -e "${YELLOW}Validating configuration...${NC}"

# Check for empty required fields
missing_vars=()
for var in DATABASE_URL SHOPIFY_API_KEY SHOPIFY_API_SECRET NEXTAUTH_SECRET; do
    value=$(grep "^$var=" .env.local | cut -d'=' -f2)
    if [ -z "$value" ]; then
        missing_vars+=($var)
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${YELLOW}Warning: The following required variables are not set:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "You'll need to set these before running the application."
else
    echo -e "${GREEN}✓${NC} All required variables are set"
fi

# Create other necessary env files
echo ""
echo -e "${YELLOW}Creating additional environment files...${NC}"

# Admin app env
mkdir -p apps/admin
if [ ! -f apps/admin/.env.local ]; then
    echo "# Admin app specific environment" > apps/admin/.env.local
    echo -e "${GREEN}✓${NC} Created apps/admin/.env.local"
fi

# Public app env
mkdir -p apps/public
if [ ! -f apps/public/.env.local ]; then
    echo "# Public app specific environment" > apps/public/.env.local
    echo -e "${GREEN}✓${NC} Created apps/public/.env.local"
fi

echo ""
echo -e "${GREEN}Environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review .env.local and fill in any missing values"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run db:migrate' to set up the database"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo -e "${YELLOW}Remember: Never commit .env.local to version control!${NC}"