#!/bin/bash

# Deploy and Test Orchestrator Flow
# 
# This script:
# 1. Deploys changes to sandbox environment
# 2. Waits for deployment to complete
# 3. Runs orchestrator invocation flow test
# 4. Reports results

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 DEPLOY AND TEST ORCHESTRATOR FLOW"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in sandbox mode
if [ -z "$AWS_BRANCH" ]; then
  echo -e "${YELLOW}⚠️  Not in sandbox mode. Starting sandbox...${NC}"
  echo ""
  echo "Please run this script in a separate terminal while sandbox is running:"
  echo "  Terminal 1: npx ampx sandbox"
  echo "  Terminal 2: ./scripts/deploy-and-test-orchestrator.sh"
  echo ""
  exit 1
fi

echo "✅ Sandbox mode detected"
echo ""

# Step 1: Check deployment status
echo "───────────────────────────────────────────────────────────"
echo "📦 STEP 1: Checking Deployment Status"
echo "───────────────────────────────────────────────────────────"
echo ""

# Get function names from environment
ORCHESTRATOR_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1)
TERRAIN_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableTerrainTool')].FunctionName" --output text | head -1)

if [ -z "$ORCHESTRATOR_FUNCTION" ]; then
  echo -e "${RED}❌ Orchestrator function not found${NC}"
  echo "Please ensure sandbox is running and functions are deployed"
  exit 1
fi

if [ -z "$TERRAIN_FUNCTION" ]; then
  echo -e "${RED}❌ Terrain tool function not found${NC}"
  echo "Please ensure sandbox is running and functions are deployed"
  exit 1
fi

echo -e "${GREEN}✅ Orchestrator function: $ORCHESTRATOR_FUNCTION${NC}"
echo -e "${GREEN}✅ Terrain tool function: $TERRAIN_FUNCTION${NC}"
echo ""

# Export function names for test script
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=$ORCHESTRATOR_FUNCTION
export RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=$TERRAIN_FUNCTION

# Step 2: Run orchestrator invocation flow test
echo "───────────────────────────────────────────────────────────"
echo "🧪 STEP 2: Running Orchestrator Invocation Flow Test"
echo "───────────────────────────────────────────────────────────"
echo ""

node scripts/test-orchestrator-invocation-flow.js

TEST_EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════════"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "Next steps:"
  echo "  1. Review CloudWatch logs for detailed execution traces"
  echo "  2. Test through UI to verify end-to-end flow"
  echo "  3. Proceed to task 15 (feature count restoration)"
  exit 0
else
  echo -e "${RED}❌ TESTS FAILED${NC}"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "Troubleshooting steps:"
  echo "  1. Check CloudWatch logs for errors:"
  echo "     - /aws/lambda/$ORCHESTRATOR_FUNCTION"
  echo "     - /aws/lambda/$TERRAIN_FUNCTION"
  echo "  2. Verify environment variables are set correctly"
  echo "  3. Check IAM permissions for Lambda invocation"
  echo "  4. Review test output above for specific failures"
  exit 1
fi
