#!/bin/bash
set -e

# Environment Setup Script for MINIMALL
# Automates environment configuration and validation

echo "🚀 MINIMALL Environment Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_warning ".env.local not found. Creating from template..."
    cp .env.example .env.local
    print_status "Created .env.local from .env.example"
    echo
    print_warning "Please edit .env.local with your actual configuration values"
    echo "Required variables to configure:"
    echo "- DATABASE_URL"
    echo "- R2_* variables (Cloudflare R2)"
    echo "- SHOPIFY_* variables"
    echo "- NEXTAUTH_SECRET"
    echo
    read -p "Press Enter to continue after configuring .env.local..."
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "🔍 Validating Environment Configuration"
echo "======================================"

# Validation functions
validate_required_var() {
    if [ -z "${!1}" ]; then
        print_error "$1 is not set"
        return 1
    else
        print_status "$1 is configured"
        return 0
    fi
}

validate_url() {
    if [[ "${!1}" =~ ^https?:// ]]; then
        print_status "$1 is a valid URL"
        return 0
    else
        print_error "$1 is not a valid URL: ${!1}"
        return 1
    fi
}

# Core validation
VALIDATION_FAILED=false

# Required variables
for var in NODE_ENV NEXT_PUBLIC_BASE_URL DATABASE_URL NEXTAUTH_SECRET; do
    if ! validate_required_var $var; then
        VALIDATION_FAILED=true
    fi
done

# URL validations
for var in NEXT_PUBLIC_BASE_URL R2_ENDPOINT; do
    if [ ! -z "${!var}" ]; then
        if ! validate_url $var; then
            VALIDATION_FAILED=true
        fi
    fi
done

# Database connection test
echo
echo "🔌 Testing Database Connection"
echo "============================="

if command -v psql > /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_warning "Database connection failed - please check DATABASE_URL"
        echo "  Tip: Ensure PostgreSQL is running and credentials are correct"
    fi
else
    print_warning "psql not found - skipping database connection test"
fi

# R2 Storage validation
echo
echo "☁️  Validating R2 Storage Configuration"
echo "======================================"

if [ ! -z "$R2_ENDPOINT" ] && [ ! -z "$R2_ACCESS_KEY" ] && [ ! -z "$R2_SECRET" ]; then
    print_status "R2 credentials configured"
    
    # Test R2 connection (basic check)
    if command -v curl > /dev/null; then
        if curl -s --head "$R2_ENDPOINT" > /dev/null; then
            print_status "R2 endpoint is reachable"
        else
            print_warning "R2 endpoint might not be reachable"
        fi
    fi
else
    print_warning "R2 storage not fully configured"
fi

# Node.js and npm version check
echo
echo "🔧 Checking Development Environment"
echo "=================================="

if command -v node > /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if Node.js version is 18 or higher
    if node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)"; then
        print_status "Node.js version is compatible"
    else
        print_error "Node.js version should be 18 or higher"
        VALIDATION_FAILED=true
    fi
else
    print_error "Node.js is not installed"
    VALIDATION_FAILED=true
fi

if command -v npm > /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
else
    print_error "npm is not installed"
    VALIDATION_FAILED=true
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo
    print_warning "node_modules not found. Installing dependencies..."
    npm ci --legacy-peer-deps
    print_status "Dependencies installed"
fi

# Generate development certificates if needed
echo
echo "🔐 Setting up Development Environment"
echo "===================================="

# Create uploads directory
mkdir -p uploads/temp
print_status "Created uploads directory"

# Set up git hooks (if in git repo)
if [ -d ".git" ]; then
    if [ ! -f ".git/hooks/pre-commit" ]; then
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Run linting before commit
npm run lint-staged
EOF
        chmod +x .git/hooks/pre-commit
        print_status "Set up git pre-commit hook"
    fi
fi

# Final validation summary
echo
echo "📊 Environment Setup Summary"
echo "==========================="

if [ "$VALIDATION_FAILED" = true ]; then
    print_error "Environment setup completed with warnings"
    echo
    echo "❗ Please address the above issues before proceeding"
    echo "   Run this script again after making corrections"
    exit 1
else
    print_status "Environment setup completed successfully!"
    echo
    echo "🎉 You're ready to start development!"
    echo
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start the development server"
    echo "2. Visit http://localhost:3000 to see your app"
    echo "3. Check the README.md for additional setup instructions"
fi