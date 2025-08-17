#!/bin/bash

# MINIMALL Deployment Script
# Uses environment variables for all configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_required_env() {
    local required_vars=(
        "DATABASE_URL"
        "SHOPIFY_API_KEY"
        "SHOPIFY_API_SECRET"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=($var)
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_info "All required environment variables are set"
}

# Load environment based on deployment target
load_environment() {
    local env_type=${1:-production}
    
    log_info "Loading environment: $env_type"
    
    if [ "$env_type" = "local" ]; then
        if [ -f .env.local ]; then
            export $(grep -v '^#' .env.local | xargs)
            log_info "Loaded .env.local"
        else
            log_warn ".env.local not found, using system environment"
        fi
    elif [ "$env_type" = "staging" ]; then
        if [ -f .env.staging ]; then
            export $(grep -v '^#' .env.staging | xargs)
            log_info "Loaded .env.staging"
        fi
    fi
    
    # Set NODE_ENV
    export NODE_ENV=$env_type
}

# Build the application
build_app() {
    log_info "Building application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run type checking
    log_info "Running type checks..."
    npm run typecheck || {
        log_error "Type checking failed"
        exit 1
    }
    
    # Run linting
    log_info "Running linter..."
    npm run lint || {
        log_error "Linting failed"
        exit 1
    }
    
    # Run tests
    log_info "Running tests..."
    npm test || {
        log_error "Tests failed"
        exit 1
    }
    
    # Build the application
    log_info "Building production bundle..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    log_info "Build completed successfully"
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    # Set Vercel environment variables
    log_info "Setting environment variables in Vercel..."
    
    # Production secrets (from GitHub secrets)
    vercel env add DATABASE_URL production < <(echo "$DATABASE_URL")
    vercel env add SHOPIFY_API_KEY production < <(echo "$SHOPIFY_API_KEY")
    vercel env add SHOPIFY_API_SECRET production < <(echo "$SHOPIFY_API_SECRET")
    vercel env add SHOPIFY_WEBHOOK_SECRET production < <(echo "$SHOPIFY_WEBHOOK_SECRET")
    vercel env add SHOPIFY_STOREFRONT_ACCESS_TOKEN production < <(echo "$SHOPIFY_STOREFRONT_ACCESS_TOKEN")
    vercel env add NEXTAUTH_SECRET production < <(echo "$NEXTAUTH_SECRET")
    vercel env add R2_ACCESS_KEY production < <(echo "$R2_ACCESS_KEY")
    vercel env add R2_SECRET production < <(echo "$R2_SECRET")
    vercel env add SENTRY_DSN production < <(echo "$SENTRY_DSN")
    vercel env add INTERNAL_API_TOKEN production < <(echo "$INTERNAL_API_TOKEN")
    vercel env add CRON_SECRET production < <(echo "$CRON_SECRET")
    
    # Deploy
    local deployment_url
    if [ "$NODE_ENV" = "production" ]; then
        deployment_url=$(vercel --prod --token="$VERCEL_TOKEN" --yes)
    else
        deployment_url=$(vercel --token="$VERCEL_TOKEN" --yes)
    fi
    
    log_info "Deployed to: $deployment_url"
    echo "$deployment_url" > deployment_url.txt
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    npm run db:migrate || {
        log_error "Database migrations failed"
        exit 1
    }
    
    log_info "Migrations completed"
}

# Verify deployment
verify_deployment() {
    local url=${1:-$(cat deployment_url.txt)}
    
    log_info "Verifying deployment at: $url"
    
    # Check if site is responding
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        log_info "Deployment verified successfully (HTTP $response)"
    else
        log_error "Deployment verification failed (HTTP $response)"
        exit 1
    fi
    
    # Run smoke tests
    if [ -n "$url" ]; then
        log_info "Running smoke tests..."
        PLAYWRIGHT_BASE_URL="$url" npm run test:e2e:smoke || {
            log_warn "Smoke tests failed"
        }
    fi
}

# Notify Sentry of deployment
notify_sentry() {
    if [ -n "$SENTRY_AUTH_TOKEN" ] && [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ]; then
        log_info "Notifying Sentry of deployment..."
        
        npx @sentry/cli releases new "$GITHUB_SHA"
        npx @sentry/cli releases set-commits "$GITHUB_SHA" --auto
        npx @sentry/cli releases finalize "$GITHUB_SHA"
        npx @sentry/cli releases deploys "$GITHUB_SHA" new -e production
        
        log_info "Sentry notified"
    else
        log_warn "Sentry configuration not found, skipping notification"
    fi
}

# Clean up old deployments
cleanup_old_deployments() {
    log_info "Cleaning up old Vercel deployments..."
    
    # Keep only last 5 deployments
    vercel ls --token="$VERCEL_TOKEN" | tail -n +2 | head -n -5 | awk '{print $1}' | while read -r deployment; do
        vercel rm "$deployment" --token="$VERCEL_TOKEN" --yes || true
    done
    
    log_info "Cleanup completed"
}

# Main deployment flow
main() {
    local env_type=${1:-production}
    
    log_info "Starting deployment to $env_type"
    
    # Load environment
    load_environment "$env_type"
    
    # Check requirements
    check_required_env
    
    # Build application
    build_app
    
    # Run migrations
    run_migrations
    
    # Deploy
    if [ -n "$VERCEL_TOKEN" ]; then
        deploy_vercel
    else
        log_warn "VERCEL_TOKEN not set, skipping Vercel deployment"
    fi
    
    # Verify
    if [ -f deployment_url.txt ]; then
        verify_deployment
    fi
    
    # Notify monitoring
    notify_sentry
    
    # Cleanup
    if [ "$env_type" = "production" ] && [ -n "$VERCEL_TOKEN" ]; then
        cleanup_old_deployments
    fi
    
    log_info "Deployment completed successfully!"
}

# Run main with all arguments
main "$@"