#!/bin/bash

# Quick Test Script - Fast error checking before deployment
# This is your go-to script for rapid feedback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME=${1:-"all"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_title() {
    echo -e "\n${CYAN}$1${NC}"
}

# Quick validation functions
quick_type_check() {
    log_title "🔍 Quick Type Check"
    
    if [ "$APP_NAME" != "all" ]; then
        if npx turbo type-check --filter=@minimall/$APP_NAME --no-cache 2>/dev/null; then
            log_success "TypeScript validation passed for $APP_NAME"
            return 0
        else
            log_error "TypeScript errors in $APP_NAME"
            return 1
        fi
    else
        if npm run type-check 2>/dev/null; then
            log_success "TypeScript validation passed for all apps"
            return 0
        else
            log_error "TypeScript errors found"
            return 1
        fi
    fi
}

quick_lint_check() {
    log_title "🧹 Quick Lint Check"
    
    if [ "$APP_NAME" != "all" ]; then
        if npx turbo lint --filter=@minimall/$APP_NAME --no-cache 2>/dev/null; then
            log_success "Linting passed for $APP_NAME"
            return 0
        else
            log_warning "Linting issues in $APP_NAME"
            return 1
        fi
    else
        if npm run lint 2>/dev/null; then
            log_success "Linting passed for all apps"
            return 0
        else
            log_warning "Linting issues found"
            return 1
        fi
    fi
}

check_build_readiness() {
    log_title "🏗️ Build Readiness Check"
    
    local issues=0
    
    # Check for common build-breaking patterns
    if grep -r "console.log" apps/ --include="*.tsx" --include="*.ts" | grep -v "// TODO" >/dev/null 2>&1; then
        log_warning "console.log statements found (may cause build warnings)"
        issues=$((issues + 1))
    fi
    
    # Check for missing dependencies
    if [ "$APP_NAME" != "all" ]; then
        local app_path="apps/$APP_NAME"
        if [ -f "$app_path/package.json" ]; then
            # Basic dependency check
            if node -e "require('./$app_path/package.json')" 2>/dev/null; then
                log_success "Package.json is valid for $APP_NAME"
            else
                log_error "Package.json has issues in $APP_NAME"
                issues=$((issues + 1))
            fi
        fi
    fi
    
    # Check for environment variable usage
    if grep -r "process.env\." apps/ --include="*.tsx" --include="*.ts" | grep -v "NEXT_PUBLIC_" >/dev/null 2>&1; then
        log_warning "Non-public environment variables used (ensure they're available in production)"
    fi
    
    if [ $issues -eq 0 ]; then
        log_success "Build readiness check passed"
        return 0
    else
        log_warning "Build readiness check found $issues potential issues"
        return 1
    fi
}

quick_dependency_check() {
    log_title "📦 Quick Dependency Check"
    
    # Check for high-severity vulnerabilities
    if npm audit --audit-level=high --silent 2>/dev/null; then
        log_success "No high-severity vulnerabilities"
    else
        log_warning "High-severity vulnerabilities found (run 'npm audit' for details)"
    fi
    
    # Check lock file integrity
    if npm ci --dry-run --silent 2>/dev/null; then
        log_success "Dependencies are consistent"
    else
        log_warning "Dependency issues detected"
    fi
}

estimate_build_time() {
    log_title "⏱️ Build Time Estimation"
    
    local start_time=$(date +%s)
    
    # Quick build test (just compilation, no actual build)
    if [ "$APP_NAME" != "all" ]; then
        npx turbo build --filter=@minimall/$APP_NAME --dry-run 2>/dev/null || true
    else
        npx turbo build --dry-run 2>/dev/null || true
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Estimate actual build time (typically 3-5x dry run time)
    local estimated_build=$((duration * 4))
    
    if [ $estimated_build -lt 60 ]; then
        log_success "Estimated build time: ${estimated_build}s"
    elif [ $estimated_build -lt 300 ]; then
        log_warning "Estimated build time: ${estimated_build}s (consider optimization)"
    else
        log_warning "Estimated build time: ${estimated_build}s (slow build detected)"
    fi
}

# Main function
main() {
    local start_time=$(date +%s)
    
    echo -e "${CYAN}⚡ MINIMALL Quick Test${NC}"
    log_info "Running fast pre-deployment checks..."
    
    cd "$PROJECT_ROOT"
    
    local passed=0
    local total=0
    
    # Run checks
    total=$((total + 1))
    if quick_type_check; then passed=$((passed + 1)); fi
    
    total=$((total + 1))
    if quick_lint_check; then passed=$((passed + 1)); fi
    
    total=$((total + 1))
    if check_build_readiness; then passed=$((passed + 1)); fi
    
    total=$((total + 1))
    if quick_dependency_check; then passed=$((passed + 1)); fi
    
    estimate_build_time
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    if [ $passed -eq $total ]; then
        log_success "✨ All quick checks passed! ($duration seconds)"
        log_info "🚀 Ready for deployment or full validation"
        echo ""
        log_info "Next steps:"
        log_info "  • Run 'npm run validate' for full validation"
        log_info "  • Run 'npm run deploy:simulate' to test locally"
        log_info "  • Deploy to Vercel when ready"
    else
        log_warning "⚠️ $passed/$total checks passed ($duration seconds)"
        log_info "🔧 Fix issues before deploying"
        echo ""
        log_info "Quick fixes:"
        log_info "  • Run 'npm run lint:fix' to auto-fix linting"
        log_info "  • Check TypeScript errors with 'npm run type-check'"
        log_info "  • Run 'npm run validate' for detailed error info"
    fi
}

# Handle script arguments
case "${1:-all}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [app_name]"
        echo ""
        echo "Arguments:"
        echo "  all     - Check all apps (default)"
        echo "  admin   - Check only admin app"
        echo "  public  - Check only public app"
        echo "  help    - Show this help message"
        echo ""
        echo "This script runs quick checks to catch common issues fast."
        echo "For full validation, use 'npm run validate' instead."
        exit 0
        ;;
    "admin"|"public"|"all")
        APP_NAME=$1
        main
        ;;
    *)
        log_error "Invalid app name. Use: all, admin, public, or help"
        exit 1
        ;;
esac
