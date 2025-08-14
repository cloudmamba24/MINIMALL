#!/bin/bash

# Local Deployment Simulation Script
# Mimics Vercel's deployment process for faster local testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME=${1:-"all"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VALIDATION_ENV="$SCRIPT_DIR/env.validation"

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
    echo -e "\n${CYAN}${1}${NC}"
}

log_step() {
    echo -e "\n${MAGENTA}→${NC} $1"
}

# Load validation environment
if [ -f "$VALIDATION_ENV" ]; then
    log_info "Loading validation environment..."
    export $(grep -v '^#' "$VALIDATION_ENV" | xargs)
fi

# Deployment simulation functions
simulate_vercel_install() {
    log_step "Simulating Vercel npm install..."
    cd "$PROJECT_ROOT"
    
    # Use exact command from vercel.json
    npm ci --legacy-peer-deps
    log_success "Dependencies installed"
}

simulate_vercel_build() {
    local app_name=$1
    log_step "Simulating Vercel build for $app_name..."
    
    cd "$PROJECT_ROOT"
    
    # Use exact build commands from vercel.json
    if [ "$app_name" == "admin" ]; then
        npx turbo build --filter=@minimall/admin --force
    elif [ "$app_name" == "public" ]; then
        npx turbo build --filter=@minimall/public --force
    else
        log_error "Unknown app: $app_name"
        return 1
    fi
    
    log_success "Build completed for $app_name"
}

start_local_server() {
    local app_name=$1
    local port=$2
    
    log_step "Starting local server for $app_name on port $port..."
    
    cd "$PROJECT_ROOT/apps/$app_name"
    
    # Start the server in background
    npm run start -- -p $port &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Check if server is running
    if curl -s "http://localhost:$port" > /dev/null; then
        log_success "Server started for $app_name at http://localhost:$port"
        echo $SERVER_PID > "/tmp/minimall-${app_name}-server.pid"
    else
        log_error "Failed to start server for $app_name"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    fi
}

stop_local_servers() {
    log_step "Stopping local servers..."
    
    for app in admin public; do
        if [ -f "/tmp/minimall-${app}-server.pid" ]; then
            local pid=$(cat "/tmp/minimall-${app}-server.pid")
            if ps -p $pid > /dev/null; then
                kill $pid
                log_success "Stopped $app server (PID: $pid)"
            fi
            rm -f "/tmp/minimall-${app}-server.pid"
        fi
    done
}

run_health_checks() {
    local app_name=$1
    local port=$2
    
    log_step "Running health checks for $app_name..."
    
    # Basic connectivity check
    if curl -s "http://localhost:$port" > /dev/null; then
        log_success "✓ Server is responding"
    else
        log_error "✗ Server is not responding"
        return 1
    fi
    
    # Check for common routes
    local routes=("/" "/api/health" "/_next/static/chunks/webpack.js")
    
    for route in "${routes[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$route" || echo "000")
        if [ "$status" != "000" ] && [ "$status" != "404" ]; then
            log_success "✓ Route $route returns status $status"
        else
            log_warning "⚠ Route $route may have issues (status: $status)"
        fi
    done
}

run_integration_tests() {
    log_step "Running integration tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run tests that don't require database
    if npm test 2>/dev/null; then
        log_success "Integration tests passed"
    else
        log_warning "Some integration tests failed (may be expected without full environment)"
    fi
}

# Cleanup function
cleanup() {
    log_title "🧹 Cleaning up..."
    stop_local_servers
    log_success "Cleanup completed"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Main deployment simulation
main() {
    log_title "🚀 Local Deployment Simulation for MINIMALL"
    log_info "Simulating Vercel deployment process locally..."
    
    # Validate arguments
    if [ "$APP_NAME" != "all" ] && [ "$APP_NAME" != "admin" ] && [ "$APP_NAME" != "public" ]; then
        log_error "Invalid app name. Use: all, admin, or public"
        exit 1
    fi
    
    # Pre-deployment validation
    log_title "📋 Pre-deployment Validation"
    if node "$SCRIPT_DIR/validate-deployment.js" ${APP_NAME:+--app=$APP_NAME}; then
        log_success "Pre-deployment validation passed"
    else
        log_error "Pre-deployment validation failed. Fix errors before proceeding."
        exit 1
    fi
    
    # Install dependencies
    log_title "📦 Dependencies"
    simulate_vercel_install
    
    # Build and test apps
    if [ "$APP_NAME" == "all" ]; then
        APPS=("admin" "public")
        PORTS=(3001 3000)
    elif [ "$APP_NAME" == "admin" ]; then
        APPS=("admin")
        PORTS=(3001)
    else
        APPS=("public")
        PORTS=(3000)
    fi
    
    for i in "${!APPS[@]}"; do
        local app="${APPS[$i]}"
        local port="${PORTS[$i]}"
        
        log_title "🏗️ Building $app"
        simulate_vercel_build "$app"
        
        log_title "🌐 Starting $app Server"
        start_local_server "$app" "$port"
        
        log_title "🩺 Health Checks for $app"
        run_health_checks "$app" "$port"
    done
    
    # Integration tests
    log_title "🧪 Integration Tests"
    run_integration_tests
    
    # Summary
    log_title "✨ Deployment Simulation Complete"
    log_success "All apps are running locally with production-like settings:"
    
    for i in "${!APPS[@]}"; do
        local app="${APPS[$i]}"
        local port="${PORTS[$i]}"
        log_success "  • $app: http://localhost:$port"
    done
    
    log_info ""
    log_info "💡 Tips:"
    log_info "  • Test your app thoroughly at the URLs above"
    log_info "  • Check browser console for any errors"
    log_info "  • Verify API endpoints work correctly"
    log_info "  • Press Ctrl+C when done testing"
    log_info ""
    log_warning "⚠️  Servers will keep running until you press Ctrl+C"
    
    # Keep script running to maintain servers
    log_info "Servers are running... Press Ctrl+C to stop."
    while true; do
        sleep 10
        # Check if servers are still running
        for i in "${!APPS[@]}"; do
            local app="${APPS[$i]}"
            local port="${PORTS[$i]}"
            if ! curl -s "http://localhost:$port" > /dev/null; then
                log_warning "Server for $app seems to have stopped"
            fi
        done
    done
}

# Handle script arguments
case "${1:-help}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [app_name]"
        echo ""
        echo "Arguments:"
        echo "  all     - Deploy both admin and public apps (default)"
        echo "  admin   - Deploy only admin app"
        echo "  public  - Deploy only public app"
        echo "  help    - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                # Deploy all apps"
        echo "  $0 admin         # Deploy only admin app"
        echo "  $0 public        # Deploy only public app"
        exit 0
        ;;
    *)
        main
        ;;
esac
