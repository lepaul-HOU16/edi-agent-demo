#!/bin/bash

# Deploy Async Renewable Jobs Implementation
# This script deploys all changes for the async renewable jobs pattern

set -e

echo "=========================================="
echo "Deploying Async Renewable Jobs Pattern"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check TypeScript compilation
echo -e "${YELLOW}Step 1: Checking TypeScript compilation...${NC}"
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    exit 1
fi
echo ""

# Step 2: Run tests
echo -e "${YELLOW}Step 2: Running tests...${NC}"
npm test -- --run --testPathPattern="(useRenewableJobPolling|useRenewableJobStatus|RenewableJobProcessingIndicator)" 2>&1 | tee /tmp/test-output.log
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
echo ""

# Step 3: Deploy to Amplify sandbox
echo -e "${YELLOW}Step 3: Deploying to Amplify sandbox...${NC}"
echo "This will take several minutes..."
echo ""

# Start deployment
npx ampx sandbox --once 2>&1 | tee /tmp/deploy-output.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo "Check /tmp/deploy-output.log for details"
    exit 1
fi
echo ""

# Step 4: Verify deployment
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"

# Check if Lambda functions exist
echo "Checking Lambda functions..."
aws lambda get-function --function-name renewableOrchestrator --region us-east-1 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ renewableOrchestrator Lambda exists${NC}"
else
    echo -e "${RED}✗ renewableOrchestrator Lambda not found${NC}"
fi

# Check DynamoDB permissions
echo "Checking DynamoDB permissions..."
aws lambda get-function-configuration --function-name renewableOrchestrator --region us-east-1 --query 'Environment.Variables' > /tmp/lambda-env.json 2>&1
if grep -q "CHAT_MESSAGE_TABLE" /tmp/lambda-env.json; then
    echo -e "${GREEN}✓ CHAT_MESSAGE_TABLE environment variable set${NC}"
else
    echo -e "${YELLOW}⚠ CHAT_MESSAGE_TABLE environment variable not found${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test with a real terrain query"
echo "2. Verify no timeout errors"
echo "3. Verify results display correctly"
echo ""
echo "Run validation script:"
echo "  node scripts/validate-async-renewable-deployment.js"
echo ""
