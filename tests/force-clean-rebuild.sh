#!/bin/bash

echo "=========================================="
echo "Force Clean Rebuild of Amplify Functions"
echo "=========================================="
echo ""

echo "This will:"
echo "1. Clear all Amplify build caches"
echo "2. Clear TypeScript build info"
echo "3. Clear node_modules cache"
echo "4. Force a complete rebuild"
echo ""

read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Clearing Amplify artifacts..."
rm -rf .amplify/artifacts
rm -rf .amplify/tsconfig.tsbuildinfo
echo "✅ Cleared Amplify artifacts"

echo ""
echo "Step 2: Clearing node_modules cache..."
rm -rf node_modules/.cache
echo "✅ Cleared node_modules cache"

echo ""
echo "Step 3: Clearing any TypeScript build info..."
find . -name "tsconfig.tsbuildinfo" -delete
find . -name "*.tsbuildinfo" -delete
echo "✅ Cleared TypeScript build info"

echo ""
echo "Step 4: Checking for duplicate function definitions..."
echo ""

# Check if renewableTools is defined in multiple places
DEFINITIONS=$(grep -r "export.*renewableTools.*defineFunction" amplify/ 2>/dev/null | wc -l | tr -d ' ')

if [ "$DEFINITIONS" -gt 1 ]; then
    echo "⚠️  WARNING: Found $DEFINITIONS definitions of renewableTools function:"
    grep -r "export.*renewableTools.*defineFunction" amplify/ 2>/dev/null
    echo ""
    echo "This might cause deployment issues. Only ONE definition should exist."
    echo "The one in amplify/data/resource.ts is the one being used."
    echo ""
fi

echo ""
echo "=========================================="
echo "Clean Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure sandbox is stopped (Ctrl+C if running)"
echo "2. Run: npx ampx sandbox"
echo "3. Wait for 'Deployed' message (may take 5-10 minutes)"
echo "4. Test deletion again"
echo "5. Run: bash tests/verify-new-code-deployed.sh"
echo ""
