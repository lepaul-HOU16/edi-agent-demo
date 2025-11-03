#!/bin/bash

# ============================================================================
# Deploy Strands Agent Fix and Test Cold Start Performance
# ============================================================================
#
# This script:
# 1. Verifies the Dockerfile fix is in place
# 2. Provides instructions for sandbox restart
# 3. Waits for deployment to complete
# 4. Runs cold start performance test
# 5. Analyzes results and provides recommendations
#
# Usage:
#   ./scripts/deploy-and-test-cold-start.sh
#
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "Task 2: Deploy and Test Cold Start Performance"
echo "============================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify Dockerfile fix
echo -e "${BLUE}Step 1: Verifying Dockerfile fix...${NC}"
echo ""

DOCKERFILE="amplify/functions/renewableAgents/Dockerfile"

if grep -q "COPY lazy_imports.py" "$DOCKERFILE"; then
    echo -e "${GREEN}✅ Dockerfile includes lazy_imports.py${NC}"
else
    echo -e "${RED}❌ Dockerfile missing lazy_imports.py${NC}"
    echo "Please add: COPY lazy_imports.py ."
    exit 1
fi

if grep -q "COPY cloudwatch_metrics.py" "$DOCKERFILE"; then
    echo -e "${GREEN}✅ Dockerfile includes cloudwatch_metrics.py${NC}"
else
    echo -e "${RED}❌ Dockerfile missing cloudwatch_metrics.py${NC}"
    echo "Please add: COPY cloudwatch_metrics.py ."
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Dockerfile fix verified${NC}"
echo ""

# Step 2: Check if sandbox is running
echo -e "${BLUE}Step 2: Checking sandbox status...${NC}"
echo ""

# Check for ampx process
if pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Sandbox is currently running${NC}"
    echo ""
    echo "To deploy the Dockerfile fix, you need to restart the sandbox:"
    echo ""
    echo "1. Stop the current sandbox (Ctrl+C in the terminal running it)"
    echo "2. Restart sandbox: npx ampx sandbox"
    echo "3. Wait for 'Deployed' message (10-15 minutes)"
    echo "4. Run this script again"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Sandbox is not running${NC}"
    echo ""
    echo "To deploy the Dockerfile fix:"
    echo ""
    echo "1. Start sandbox: npx ampx sandbox"
    echo "2. Wait for 'Deployed' message (10-15 minutes)"
    echo "3. Run this script again"
    echo ""
    exit 0
fi

# Step 3: Verify Lambda deployment
echo -e "${BLUE}Step 3: Verifying Lambda deployment...${NC}"
echo ""

# Find Lambda function
FUNCTION_NAME=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" \
    --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}❌ Strands Agent Lambda not found${NC}"
    echo "Please ensure sandbox has deployed successfully"
    exit 1
fi

echo -e "${GREEN}✅ Found Lambda: $FUNCTION_NAME${NC}"

# Check last modified time
LAST_MODIFIED=$(aws lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --query 'Configuration.LastModified' \
    --output text)

echo "   Last Modified: $LAST_MODIFIED"
echo ""

# Step 4: Run cold start performance test
echo -e "${BLUE}Step 4: Running cold start performance test...${NC}"
echo ""
echo "This will invoke the Lambda and measure cold start performance."
echo "Expected duration: 2-5 minutes for cold start"
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

echo ""
echo "🚀 Starting cold start test..."
echo ""

# Run the test
if node tests/test-strands-cold-start.js; then
    TEST_RESULT="PASSED"
else
    TEST_RESULT="FAILED"
fi

echo ""
echo "============================================================================"
echo "Test Results"
echo "============================================================================"
echo ""

if [ "$TEST_RESULT" = "PASSED" ]; then
    echo -e "${GREEN}✅ Cold start test PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review test output above for performance metrics"
    echo "2. Document results in tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md"
    echo "3. Mark Task 2 as complete in tasks.md"
    echo "4. Proceed to Task 3: Test warm start performance"
    echo ""
else
    echo -e "${RED}❌ Cold start test FAILED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review error output above"
    echo "2. Check CloudWatch logs for detailed error information"
    echo "3. Fix any issues found"
    echo "4. Re-run this script"
    echo ""
    
    # Provide CloudWatch logs command
    echo "View CloudWatch logs:"
    echo "  LOG_GROUP=\"/aws/lambda/$FUNCTION_NAME\""
    echo "  aws logs tail \$LOG_GROUP --follow"
    echo ""
fi

echo "============================================================================"
