#!/bin/bash

# Deploy NREL HTTPS Fix
# Rebuilds and redeploys simulation Lambda with HTTPS URL

set -e

echo "🚀 Deploying NREL HTTPS Fix..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify the fix is in place
echo "📋 Step 1: Verifying HTTPS fix in code..."
if grep -q "https://developer.nrel.gov" amplify/functions/renewableTools/nrel_wind_client.py; then
    echo -e "${GREEN}✅ HTTPS URL found in nrel_wind_client.py${NC}"
else
    echo -e "${RED}❌ HTTPS URL not found - fix not applied${NC}"
    exit 1
fi

# Step 2: Check if sandbox is running
echo ""
echo "📋 Step 2: Checking sandbox status..."
if pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Sandbox is running${NC}"
    echo "   The fix will be deployed when you restart the sandbox"
    echo ""
    echo "   To deploy now:"
    echo "   1. Stop sandbox (Ctrl+C)"
    echo "   2. Run: npx ampx sandbox"
    echo "   3. Wait for deployment to complete"
    echo "   4. Run: node tests/test-nrel-https-fix.js"
else
    echo -e "${YELLOW}⚠️  Sandbox is not running${NC}"
    echo "   Starting sandbox to deploy the fix..."
    echo ""
    npx ampx sandbox &
    SANDBOX_PID=$!
    
    echo "   Waiting for deployment to complete (this may take 5-10 minutes)..."
    echo "   Press Ctrl+C to stop waiting and check manually"
    
    # Wait for deployment
    sleep 300
    
    echo ""
    echo -e "${GREEN}✅ Deployment should be complete${NC}"
    echo "   Run: node tests/test-nrel-https-fix.js"
fi

echo ""
echo "📝 Summary:"
echo "   - Fixed: HTTP → HTTPS in NREL API URL"
echo "   - File: amplify/functions/renewableTools/nrel_wind_client.py"
echo "   - Next: Test with node tests/test-nrel-https-fix.js"
