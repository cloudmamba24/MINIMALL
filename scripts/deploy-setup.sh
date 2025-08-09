#!/bin/bash

# MINIMALL Dual Deployment Setup Script
# This script helps automate the deployment configuration process

set -e

echo "🚀 MINIMALL Dual Deployment Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_step "Checking deployment configuration files..."

if [[ ! -f "vercel.json" ]]; then
    print_error "vercel.json not found! This file is required for public app deployment."
    exit 1
fi

if [[ ! -f "vercel-admin.json" ]]; then
    print_error "vercel-admin.json not found! This file is required for admin app deployment."
    exit 1
fi

if [[ ! -f "shopify.app.toml" ]]; then
    print_error "shopify.app.toml not found! This file is required for Shopify app configuration."
    exit 1
fi

print_success "All deployment configuration files found!"

# Check for environment template
print_step "Checking environment template..."

if [[ ! -f "docs/deployment/quick-start/ENVIRONMENT-TEMPLATE.env" ]]; then
    print_warning "Environment template not found. You may need to create environment variables manually."
else
    print_success "Environment template found!"
fi

# Validate package.json workspaces
print_step "Validating monorepo structure..."

if [[ ! -d "apps/public" ]]; then
    print_error "apps/public directory not found!"
    exit 1
fi

if [[ ! -d "apps/admin" ]]; then
    print_error "apps/admin directory not found!"  
    exit 1
fi

if [[ ! -f "apps/public/package.json" ]]; then
    print_error "apps/public/package.json not found!"
    exit 1
fi

if [[ ! -f "apps/admin/package.json" ]]; then
    print_error "apps/admin/package.json not found!"
    exit 1
fi

print_success "Monorepo structure is valid!"

# Test build commands
print_step "Testing build commands..."

echo "Testing public app build..."
if npm run build --workspace=@minimall/public; then
    print_success "Public app builds successfully!"
else
    print_error "Public app build failed!"
    exit 1
fi

echo "Testing admin app build..."
if npm run build --workspace=@minimall/admin; then
    print_success "Admin app builds successfully!"
else
    print_error "Admin app build failed!"
    exit 1
fi

# Check for required dependencies
print_step "Checking required dependencies..."

if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Install it with: npm i -g vercel"
else
    print_success "Vercel CLI is installed!"
fi

if ! command -v git &> /dev/null; then
    print_error "Git is required but not found!"
    exit 1
else
    print_success "Git is available!"
fi

# Check git status
print_step "Checking git repository status..."

if ! git status &> /dev/null; then
    print_error "Not in a git repository!"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    print_warning "You have uncommitted changes. Consider committing them before deployment."
    git status --short
else
    print_success "Git working directory is clean!"
fi

# Check remote origin
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -z "$REMOTE_URL" ]]; then
    print_warning "No git remote origin configured. You'll need to push to GitHub for automatic deployments."
else
    print_success "Git remote origin: $REMOTE_URL"
fi

# Summary
echo ""
echo "🎯 DEPLOYMENT SETUP SUMMARY"
echo "==========================="
echo ""
print_success "✓ All configuration files are present"
print_success "✓ Monorepo structure is valid"  
print_success "✓ Both apps build successfully"
print_success "✓ Git repository is ready"
echo ""

print_step "NEXT STEPS:"
echo "1. Create two Vercel projects from your GitHub repo:"
echo "   - minimall-public (uses vercel.json)"
echo "   - minimall-admin (uses vercel-admin.json)"
echo ""
echo "2. Configure environment variables in both projects"
echo "   - See: docs/deployment/DUAL-DEPLOYMENT-GUIDE.md"
echo ""
echo "3. Set up DNS records for your domains:"
echo "   - yourdomain.com → public app"
echo "   - admin.yourdomain.com → admin app"
echo ""
echo "4. Update Shopify Partner Dashboard with admin domain"
echo ""
echo "5. Test both deployments after setup"

echo ""
print_success "Setup validation complete! 🚀"