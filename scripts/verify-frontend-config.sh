#!/bin/bash

# Verify Frontend CDK Configuration
# This script checks that the frontend is properly configured to use CDK API

echo "🔍 Verifying Frontend CDK Configuration..."
echo ""

# Check .env.local exists and has VITE_API_URL
echo "1. Checking environment configuration..."
if [ -f ".env.local" ]; then
    if grep -q "VITE_API_URL" .env.local; then
        API_URL=$(grep "VITE_API_URL" .env.local | cut -d'=' -f2)
        echo "   ✅ VITE_API_URL found: $API_URL"
    else
        echo "   ❌ VITE_API_URL not found in .env.local"
        exit 1
    fi
else
    echo "   ❌ .env.local file not found"
    exit 1
fi

# Check for Amplify AppSync references (excluding docs and backups)
echo ""
echo "2. Checking for Amplify AppSync references..."
APPSYNC_REFS=$(grep -r "AppSync\|appsync\|generateClient" src/ --include="*.ts" --include="*.tsx" --exclude="*.backup" --exclude="*.md" 2>/dev/null | wc -l)
if [ "$APPSYNC_REFS" -eq 0 ]; then
    echo "   ✅ No Amplify AppSync references found in source code"
else
    echo "   ❌ Found $APPSYNC_REFS Amplify AppSync references in source code"
    grep -r "AppSync\|appsync\|generateClient" src/ --include="*.ts" --include="*.tsx" --exclude="*.backup" --exclude="*.md" 2>/dev/null
    exit 1
fi

# Check API client configuration
echo ""
echo "3. Checking API client configuration..."
if grep -q "VITE_API_URL" src/lib/api/client.ts; then
    echo "   ✅ API client uses VITE_API_URL"
else
    echo "   ❌ API client does not use VITE_API_URL"
    exit 1
fi

# Check type definitions exist
echo ""
echo "4. Checking type definitions..."
if [ -f "src/types/api.ts" ]; then
    echo "   ✅ REST API type definitions found"
else
    echo "   ❌ REST API type definitions not found"
    exit 1
fi

# Try to build
echo ""
echo "5. Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

echo ""
echo "✅ All checks passed! Frontend is configured for CDK API."
echo ""
echo "Next steps:"
echo "  1. Deploy frontend: npm run build && aws s3 sync dist/ s3://energyinsights-development-frontend-development/"
echo "  2. Test in browser: https://d36sq31aqkfe46.cloudfront.net"
echo "  3. Verify all features work"
