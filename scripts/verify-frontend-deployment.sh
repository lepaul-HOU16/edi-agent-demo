#!/bin/bash

# Frontend Deployment Verification Script
# This script verifies that the frontend is properly built and ready for deployment

set -e

echo "🔍 Frontend Deployment Verification"
echo "===================================="
echo ""

# Check if build exists
echo "✓ Checking build output..."
if [ ! -d ".next" ]; then
    echo "❌ Build directory .next not found. Run 'npm run build' first."
    exit 1
fi

if [ ! -d ".next/standalone" ]; then
    echo "❌ Standalone build not found. Check next.config.js output setting."
    exit 1
fi

echo "✅ Build output exists"
echo ""

# Check critical files
echo "✓ Checking critical files..."
CRITICAL_FILES=(
    ".next/standalone/server.js"
    ".next/standalone/package.json"
    ".next/standalone/amplify_outputs.json"
    "amplify_outputs.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing critical file: $file"
        exit 1
    fi
    echo "  ✓ $file"
done

echo "✅ All critical files present"
echo ""

# Check Amplify configuration
echo "✓ Checking Amplify configuration..."
if ! grep -q "catalogSearch" amplify_outputs.json; then
    echo "❌ catalogSearch mutation not found in amplify_outputs.json"
    exit 1
fi

echo "✅ Amplify configuration valid"
echo ""

# Check Lambda deployment
echo "✓ Checking Lambda deployment..."
CATALOG_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'CatalogSearchFunction')].FunctionName" --output text 2>/dev/null || echo "")

if [ -z "$CATALOG_LAMBDA" ]; then
    echo "⚠️  Warning: catalogSearch Lambda not found in AWS"
    echo "   Make sure sandbox is running: npx ampx sandbox"
else
    echo "✅ catalogSearch Lambda deployed: $CATALOG_LAMBDA"
fi

echo ""

# Check frontend pages
echo "✓ Checking frontend pages..."
PAGES=(
    ".next/server/app/page.js"
    ".next/server/app/catalog/page.js"
    ".next/server/app/auth/page.js"
)

for page in "${PAGES[@]}"; do
    if [ ! -f "$page" ]; then
        echo "⚠️  Warning: Page not found: $page"
    else
        echo "  ✓ $page"
    fi
done

echo ""

# Summary
echo "===================================="
echo "✅ Frontend Deployment Verification Complete"
echo ""
echo "Next steps:"
echo "1. Ensure sandbox is running: npx ampx sandbox"
echo "2. Test locally: npm run dev"
echo "3. Deploy to Amplify: git push (if using Amplify Hosting)"
echo ""
echo "Deployment checklist:"
echo "  ✓ Build completed successfully"
echo "  ✓ Standalone output generated"
echo "  ✓ Amplify configuration valid"
echo "  ✓ catalogSearch mutation available"
if [ -n "$CATALOG_LAMBDA" ]; then
    echo "  ✓ Backend Lambda deployed"
else
    echo "  ⚠️  Backend Lambda not deployed (start sandbox)"
fi
echo ""
