#!/bin/bash

# OSDU Configuration Verification Script
# This script checks if OSDU API environment variables are properly configured

echo "🔍 OSDU Configuration Verification"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found"
    echo "   Create it by copying .env.local.example"
    exit 1
fi

echo "✅ .env.local file exists"
echo ""

# Check for OSDU_API_URL
if grep -q "OSDU_API_URL=" .env.local; then
    OSDU_URL=$(grep "OSDU_API_URL=" .env.local | cut -d '=' -f2)
    if [ -z "$OSDU_URL" ] || [ "$OSDU_URL" = "https://api.osdu.example.com/search" ]; then
        echo "⚠️  OSDU_API_URL is set to example value"
        echo "   Current: $OSDU_URL"
        echo "   Update with your actual OSDU API endpoint"
    else
        echo "✅ OSDU_API_URL is configured"
        echo "   URL: $OSDU_URL"
    fi
else
    echo "❌ OSDU_API_URL not found in .env.local"
    echo "   Add: OSDU_API_URL=https://your-osdu-api-url.com/search"
fi

echo ""

# Check for OSDU_API_KEY
if grep -q "OSDU_API_KEY=" .env.local; then
    OSDU_KEY=$(grep "OSDU_API_KEY=" .env.local | cut -d '=' -f2)
    if [ -z "$OSDU_KEY" ] || [ "$OSDU_KEY" = "your-osdu-api-key-here" ]; then
        echo "❌ OSDU_API_KEY is not set or using placeholder"
        echo "   Current: $OSDU_KEY"
        echo "   Update with your actual OSDU API key"
    else
        KEY_LENGTH=${#OSDU_KEY}
        echo "✅ OSDU_API_KEY is configured"
        echo "   Length: $KEY_LENGTH characters"
        echo "   Preview: ${OSDU_KEY:0:8}...${OSDU_KEY: -4}"
    fi
else
    echo "❌ OSDU_API_KEY not found in .env.local"
    echo "   Add: OSDU_API_KEY=your-actual-api-key"
fi

echo ""
echo "===================================="
echo "📋 Configuration Summary"
echo "===================================="

# Count issues
ISSUES=0

if ! grep -q "OSDU_API_URL=" .env.local; then
    ISSUES=$((ISSUES + 1))
fi

if ! grep -q "OSDU_API_KEY=" .env.local; then
    ISSUES=$((ISSUES + 1))
fi

OSDU_URL=$(grep "OSDU_API_URL=" .env.local 2>/dev/null | cut -d '=' -f2)
if [ "$OSDU_URL" = "https://api.osdu.example.com/search" ]; then
    ISSUES=$((ISSUES + 1))
fi

OSDU_KEY=$(grep "OSDU_API_KEY=" .env.local 2>/dev/null | cut -d '=' -f2)
if [ -z "$OSDU_KEY" ] || [ "$OSDU_KEY" = "your-osdu-api-key-here" ]; then
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All OSDU configuration looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to sandbox: npx ampx sandbox"
    echo "2. Test OSDU search in catalog interface"
    echo "3. Check CloudWatch logs for API calls"
else
    echo "⚠️  Found $ISSUES configuration issue(s)"
    echo ""
    echo "Action required:"
    echo "1. Update .env.local with actual OSDU API credentials"
    echo "2. Run this script again to verify"
    echo "3. Deploy to sandbox: npx ampx sandbox"
fi

echo ""
