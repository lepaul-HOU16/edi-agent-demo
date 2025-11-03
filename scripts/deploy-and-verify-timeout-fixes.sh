#!/bin/bash

# Deploy and Verify Timeout Fixes
# This script deploys changes and verifies they're actually applied

set -e

echo "=========================================="
echo "DEPLOYMENT AND VERIFICATION SCRIPT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Record start time
START_TIME=$(date +%s)

echo "📋 BEFORE DEPLOYMENT - Current Configuration:"
echo "----------------------------------------------"

# Get current timeouts
REPORT_TIMEOUT_BEFORE=$(aws lambda get-function-configuration --function-name amplify-digitalassistant--RenewableReportToolB3B5E-JRhfq69yq1WC --query 'Timeout' --output text 2>/dev/null || echo "N/A")
ORCHESTRATOR_TIMEOUT_BEFORE=$(aws lambda get-function-configuration --function-name amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE --query 'Timeout' --output text 2>/dev/null || echo "N/A")

echo "Report Lambda timeout: ${REPORT_TIMEOUT_BEFORE}s"
echo "Orchestrator timeout: ${ORCHESTRATOR_TIMEOUT_BEFORE}s"
echo ""

echo "🚀 STARTING DEPLOYMENT..."
echo "----------------------------------------------"
echo "This will take 5-10 minutes. Please wait..."
echo ""

# Start deployment in background and capture output
npx ampx sandbox > /tmp/amplify-deploy.log 2>&1 &
DEPLOY_PID=$!

echo "Deployment PID: $DEPLOY_PID"
echo "Monitoring deployment progress..."
echo ""

# Monitor for completion
TIMEOUT=600  # 10 minutes
ELAPSED=0
LAST_SIZE=0

while kill -0 $DEPLOY_PID 2>/dev/null; do
    sleep 10
    ELAPSED=$((ELAPSED + 10))
    
    # Check log file size to show activity
    if [ -f /tmp/amplify-deploy.log ]; then
        CURRENT_SIZE=$(wc -c < /tmp/amplify-deploy.log)
        if [ $CURRENT_SIZE -gt $LAST_SIZE ]; then
            echo -e "${YELLOW}⏳ Still deploying... (${ELAPSED}s elapsed)${NC}"
            LAST_SIZE=$CURRENT_SIZE
            
            # Show last few lines of log
            tail -3 /tmp/amplify-deploy.log | sed 's/^/   /'
        fi
    fi
    
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo -e "${RED}❌ Deployment timeout after ${TIMEOUT}s${NC}"
        kill $DEPLOY_PID 2>/dev/null || true
        exit 1
    fi
done

# Wait for process to fully complete
wait $DEPLOY_PID
DEPLOY_EXIT_CODE=$?

echo ""
if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment command completed${NC}"
else
    echo -e "${RED}❌ Deployment failed with exit code: $DEPLOY_EXIT_CODE${NC}"
    echo "Last 20 lines of deployment log:"
    tail -20 /tmp/amplify-deploy.log
    exit 1
fi

echo ""
echo "⏱️  Waiting 30 seconds for AWS to propagate changes..."
sleep 30

echo ""
echo "🔍 VERIFICATION - Checking Deployed Configuration:"
echo "----------------------------------------------"

# Function to check Lambda timeout
check_lambda_timeout() {
    local FUNCTION_NAME=$1
    local EXPECTED_TIMEOUT=$2
    local LAMBDA_DISPLAY_NAME=$3
    
    echo -n "Checking $LAMBDA_DISPLAY_NAME... "
    
    ACTUAL_TIMEOUT=$(aws lambda get-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --query 'Timeout' \
        --output text 2>/dev/null)
    
    LAST_MODIFIED=$(aws lambda get-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --query 'LastModified' \
        --output text 2>/dev/null)
    
    if [ "$ACTUAL_TIMEOUT" = "$EXPECTED_TIMEOUT" ]; then
        echo -e "${GREEN}✅ VERIFIED${NC}"
        echo "   Timeout: ${ACTUAL_TIMEOUT}s (expected ${EXPECTED_TIMEOUT}s)"
        echo "   Last Modified: $LAST_MODIFIED"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Expected: ${EXPECTED_TIMEOUT}s"
        echo "   Actual: ${ACTUAL_TIMEOUT}s"
        echo "   Last Modified: $LAST_MODIFIED"
        return 1
    fi
}

# Check each Lambda
VERIFICATION_FAILED=0

check_lambda_timeout \
    "amplify-digitalassistant--RenewableReportToolB3B5E-JRhfq69yq1WC" \
    "300" \
    "Report Lambda" || VERIFICATION_FAILED=1

echo ""

check_lambda_timeout \
    "amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE" \
    "300" \
    "Orchestrator Lambda" || VERIFICATION_FAILED=1

echo ""
echo "=========================================="

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_TIME / 60))
SECONDS=$((TOTAL_TIME % 60))

if [ $VERIFICATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL AND VERIFIED${NC}"
    echo ""
    echo "Summary:"
    echo "  - Report Lambda: ${REPORT_TIMEOUT_BEFORE}s → 300s"
    echo "  - Orchestrator: ${ORCHESTRATOR_TIMEOUT_BEFORE}s → 300s"
    echo "  - Total time: ${MINUTES}m ${SECONDS}s"
    echo ""
    echo "✅ You can now test in the UI:"
    echo "   1. 'Perform financial analysis and ROI calculation'"
    echo "   2. 'Generate comprehensive executive report'"
    echo ""
    echo "Both should now work without timeout errors."
else
    echo -e "${RED}❌ DEPLOYMENT VERIFICATION FAILED${NC}"
    echo ""
    echo "The deployment completed but timeouts were not updated correctly."
    echo "This might mean:"
    echo "  1. Changes didn't deploy (check amplify/functions/*/resource.ts)"
    echo "  2. AWS needs more time to propagate"
    echo "  3. Sandbox needs to be restarted"
    echo ""
    echo "Try running this script again in 2 minutes."
    exit 1
fi

echo "=========================================="
