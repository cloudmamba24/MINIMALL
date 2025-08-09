#!/bin/bash

# MINIMALL Deployment Verification Script
# Tests both public and admin deployments after setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Get domains from user
echo "🧪 MINIMALL Deployment Verification"
echo "==================================="
echo ""

if [[ -z "$PUBLIC_DOMAIN" ]]; then
    echo "Enter your public domain (e.g., yourdomain.com):"
    read -r PUBLIC_DOMAIN
fi

if [[ -z "$ADMIN_DOMAIN" ]]; then
    echo "Enter your admin domain (e.g., admin.yourdomain.com):"
    read -r ADMIN_DOMAIN
fi

echo ""
print_step "Testing deployments for:"
echo "  Public: https://$PUBLIC_DOMAIN"
echo "  Admin:  https://$ADMIN_DOMAIN"
echo ""

# Test function
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    print_step "Testing: $description"
    
    if command -v curl &> /dev/null; then
        local status_code
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        
        if [[ "$status_code" == "$expected_status" ]]; then
            print_success "$url → $status_code"
        else
            print_error "$url → $status_code (expected $expected_status)"
            return 1
        fi
    else
        print_warning "curl not available, skipping HTTP tests"
        return 0
    fi
}

# Test DNS resolution
test_dns() {
    local domain="$1"
    local description="$2"
    
    print_step "Testing: $description DNS resolution"
    
    if command -v nslookup &> /dev/null; then
        if nslookup "$domain" &> /dev/null; then
            print_success "$domain resolves successfully"
        else
            print_error "$domain DNS resolution failed"
            return 1
        fi
    else
        print_warning "nslookup not available, skipping DNS tests"
        return 0
    fi
}

# Test SSL certificate
test_ssl() {
    local domain="$1"
    local description="$2"
    
    print_step "Testing: $description SSL certificate"
    
    if command -v openssl &> /dev/null; then
        if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0"; then
            print_success "$domain SSL certificate is valid"
        else
            print_warning "$domain SSL certificate may have issues"
            return 0  # Non-critical
        fi
    else
        print_warning "openssl not available, skipping SSL tests"
        return 0
    fi
}

# Initialize test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

run_test() {
    if "$@"; then
        ((TESTS_PASSED++))
    else
        if [[ $? == 2 ]]; then
            ((TESTS_WARNED++))
        else
            ((TESTS_FAILED++))
        fi
    fi
}

echo "🌐 DNS AND SSL TESTS"
echo "===================="
run_test test_dns "$PUBLIC_DOMAIN" "Public app"
run_test test_dns "$ADMIN_DOMAIN" "Admin app"
run_test test_ssl "$PUBLIC_DOMAIN" "Public app"
run_test test_ssl "$ADMIN_DOMAIN" "Admin app"

echo ""
echo "📱 PUBLIC APP TESTS"
echo "==================="
run_test test_endpoint "https://$PUBLIC_DOMAIN" "200" "Homepage"
run_test test_endpoint "https://$PUBLIC_DOMAIN/api/health" "200" "Health check API"
run_test test_endpoint "https://$PUBLIC_DOMAIN/g/demo" "200" "Demo page"
run_test test_endpoint "https://$PUBLIC_DOMAIN/test" "200" "Test page"

echo ""
echo "⚙️  ADMIN APP TESTS"
echo "==================="
run_test test_endpoint "https://$ADMIN_DOMAIN" "200" "Admin homepage"
run_test test_endpoint "https://$ADMIN_DOMAIN/api/auth/session" "401" "Auth session (should be unauthorized)"

# Shopify-specific tests (if endpoints exist)
echo ""
echo "🛒 SHOPIFY INTEGRATION TESTS"
echo "============================"
run_test test_endpoint "https://$ADMIN_DOMAIN/api/auth/shopify/install" "302" "Shopify install redirect"

# Test webhook endpoints (should return 405 Method Not Allowed for GET requests)
print_step "Testing webhook endpoints (should return 405 for GET)..."
run_test test_endpoint "https://$ADMIN_DOMAIN/api/webhooks/app/uninstalled" "405" "App uninstalled webhook"
run_test test_endpoint "https://$ADMIN_DOMAIN/api/webhooks/products/create" "405" "Product create webhook"

# Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $TESTS_WARNED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo ""
    print_success "🎉 All critical tests passed! Your deployment looks good."
    
    echo ""
    print_step "NEXT STEPS:"
    echo "1. Test Shopify app installation from Shopify Partners Dashboard"
    echo "2. Create a test configuration in the admin app"
    echo "3. Verify the public link-in-bio experience"
    echo "4. Monitor logs for any errors"
    
    exit 0
else
    echo ""
    print_error "❌ Some tests failed. Please review the errors above."
    print_step "Common issues:"
    echo "• DNS not fully propagated (wait up to 48 hours)"
    echo "• SSL certificates still provisioning (wait a few hours)"
    echo "• Environment variables not configured correctly"
    echo "• Vercel deployment configuration issues"
    
    exit 1
fi