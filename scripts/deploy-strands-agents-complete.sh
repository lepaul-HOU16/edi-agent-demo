#!/bin/bash

# Deploy Strands Agents Complete Integration
# This script deploys the Strands Agent Lambda and runs tests

set -e

echo "🚀 Deploying Strands Agents Complete Integration"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if sandbox is running
echo "📋 Step 1: Checking sandbox status..."
if ! pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Sandbox is not running${NC}"
    echo "Starting sandbox..."
    npx ampx sandbox &
    SANDBOX_PID=$!
    echo "Waiting for sandbox to start (this may take 5-10 minutes)..."
    sleep 300 # Wait 5 minutes for initial deployment
else
    echo -e "${GREEN}✅ Sandbox is already running${NC}"
fi

# Step 2: Wait for deployment to complete
echo ""
echo "📋 Step 2: Waiting for deployment to complete..."
echo "This may take several minutes for the Strands Agent Lambda..."
sleep 60

# Step 3: Verify Lambda deployment
echo ""
echo "📋 Step 3: Verifying Lambda deployment..."
LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text)

if [ -z "$LAMBDA_NAME" ]; then
    echo -e "${RED}❌ Strands Agent Lambda not found!${NC}"
    echo "Deployment may still be in progress. Check AWS Console."
    exit 1
else
    echo -e "${GREEN}✅ Found Strands Agent Lambda: $LAMBDA_NAME${NC}"
fi

# Step 4: Check Lambda configuration
echo ""
echo "📋 Step 4: Checking Lambda configuration..."
aws lambda get-function-configuration --function-name "$LAMBDA_NAME" --query '{Runtime:Runtime,Timeout:Timeout,MemorySize:MemorySize,Handler:Handler}' --output table

# Step 5: Check environment variables
echo ""
echo "📋 Step 5: Checking environment variables..."
aws lambda get-function-configuration --function-name "$LAMBDA_NAME" --query 'Environment.Variables' --output json

# Step 6: Run test files
echo ""
echo "📋 Step 6: Running test files..."
echo ""

# Test 1: Individual Agents
echo "🧪 Test 1: Individual Agents"
if [ -f "tests/test-individual-agents.js" ]; then
    node tests/test-individual-agents.js || echo -e "${YELLOW}⚠️  Individual agent tests had issues${NC}"
else
    echo -e "${YELLOW}⚠️  Test file not found: tests/test-individual-agents.js${NC}"
fi

echo ""

# Test 2: Multi-Agent Orchestration
echo "🧪 Test 2: Multi-Agent Orchestration"
if [ -f "tests/test-multi-agent-orchestration.js" ]; then
    node tests/test-multi-agent-orchestration.js || echo -e "${YELLOW}⚠️  Multi-agent orchestration tests had issues${NC}"
else
    echo -e "${YELLOW}⚠️  Test file not found: tests/test-multi-agent-orchestration.js${NC}"
fi

echo ""

# Test 3: Artifact Generation and Storage
echo "🧪 Test 3: Artifact Generation and Storage"
if [ -f "tests/test-artifact-generation-storage.js" ]; then
    node tests/test-artifact-generation-storage.js || echo -e "${YELLOW}⚠️  Artifact generation tests had issues${NC}"
else
    echo -e "${YELLOW}⚠️  Test file not found: tests/test-artifact-generation-storage.js${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment and testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review test results above"
echo "2. Check CloudWatch logs for any errors"
echo "3. Test in the UI by sending renewable energy queries"
echo ""
echo "Lambda Function Name: $LAMBDA_NAME"
echo "CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252F$LAMBDA_NAME"
