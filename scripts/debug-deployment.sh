#!/bin/bash

# MINIMALL Deployment Debug Script
# Usage: ./scripts/debug-deployment.sh <vercel-url>

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Vercel deployment URL"
    echo "Usage: ./scripts/debug-deployment.sh https://your-site.vercel.app"
    exit 1
fi

SITE_URL=$1
echo "🔍 Testing deployment: $SITE_URL"
echo "==========================================="

# Remove trailing slash
SITE_URL=$(echo $SITE_URL | sed 's/\/$//') 

echo "📋 Running deployment tests..."
echo ""

# Test 1: Static homepage
echo "1. Testing homepage (/)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Homepage: OK ($HTTP_CODE)"
else
    echo "   ❌ Homepage: FAILED ($HTTP_CODE)"
fi

# Test 2: Static test page
echo "2. Testing static route (/test)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/test")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Static route: OK ($HTTP_CODE)"
else
    echo "   ❌ Static route: FAILED ($HTTP_CODE)"
fi

# Test 3: API health endpoint
echo "3. Testing API route (/api/health)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API route: OK ($HTTP_CODE)"
else
    echo "   ❌ API route: FAILED ($HTTP_CODE)"
fi

# Test 4: Demo page
echo "4. Testing demo route (/g/demo)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/g/demo")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Demo route: OK ($HTTP_CODE)"
else
    echo "   ❌ Demo route: FAILED ($HTTP_CODE)"
fi

# Test 5: R2 debug endpoint
echo "5. Testing R2 debug (/api/debug/r2)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/debug/r2")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ R2 debug: OK ($HTTP_CODE)"
else
    echo "   ❌ R2 debug: FAILED ($HTTP_CODE)"
fi

echo ""
echo "==========================================="

# Summary
FAILED_TESTS=0
[ "$HTTP_CODE" != "200" ] && ((FAILED_TESTS++))

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed! Deployment is working correctly."
else
    echo "⚠️  Some tests failed. Check TROUBLESHOOTING.md for solutions."
fi

echo ""
echo "📖 Manual test URLs:"
echo "   Homepage: $SITE_URL/"
echo "   Test page: $SITE_URL/test"  
echo "   API health: $SITE_URL/api/health"
echo "   Demo store: $SITE_URL/g/demo"
echo "   R2 debug: $SITE_URL/api/debug/r2"