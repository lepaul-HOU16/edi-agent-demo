#!/bin/bash

# Deploy Strands Agent Integration
# This script deploys the complete Strands Agent system to AWS

set -e

echo "=================================="
echo "Strands Agent Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if sandbox is running
echo "Checking sandbox status..."
if pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Sandbox is already running${NC}"
    echo "The deployment will happen automatically through the running sandbox"
else
    echo -e "${RED}❌ Sandbox is not running${NC}"
    echo ""
    echo "To deploy the Strands Agent system, you need to:"
    echo "1. Start the sandbox: npx ampx sandbox"
    echo "2. Wait for deployment to complete (5-10 minutes)"
    echo "3. Run the test suite: node tests/test-strands-agents-complete.js"
    echo ""
    echo "Starting sandbox now..."
    echo ""
    
    # Start sandbox in background
    npx ampx sandbox &
    SANDBOX_PID=$!
    
    echo "Sandbox started with PID: $SANDBOX_PID"
    echo ""
    echo "Waiting for deployment to complete..."
    echo "This may take 5-10 minutes..."
    echo ""
    
    # Wait for deployment
    sleep 30
    
    echo "Checking deployment status..."
    
    # Check if Lambda exists
    MAX_ATTEMPTS=20
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if aws lambda list-functions --region us-west-2 --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text | grep -q "RenewableAgentsFunction"; then
            echo -e "${GREEN}✅ Strands Agent Lambda deployed successfully!${NC}"
            break
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Lambda not yet deployed, waiting..."
        sleep 30
    done
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Deployment timed out${NC}"
        echo "Please check the sandbox logs for errors"
        exit 1
    fi
fi

echo ""
echo "=================================="
echo "Deployment Status"
echo "=================================="
echo ""

# Check Lambda functions
echo "Checking deployed Lambda functions..."
echo ""

AGENT_LAMBDA=$(aws lambda list-functions --region us-west-2 --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text | head -1)

if [ -n "$AGENT_LAMBDA" ]; then
    echo -e "${GREEN}✅ Strands Agent Lambda: $AGENT_LAMBDA${NC}"
    
    # Get Lambda configuration
    echo ""
    echo "Lambda Configuration:"
    aws lambda get-function-configuration --function-name "$AGENT_LAMBDA" --region us-west-2 --query '{Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,Handler:Handler}' --output table
    
    # Check environment variables
    echo ""
    echo "Environment Variables:"
    aws lambda get-function-configuration --function-name "$AGENT_LAMBDA" --region us-west-2 --query 'Environment.Variables' --output table
else
    echo -e "${RED}❌ Strands Agent Lambda not found${NC}"
fi

echo ""

# Check orchestrator
ORCHESTRATOR=$(aws lambda list-functions --region us-west-2 --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1)

if [ -n "$ORCHESTRATOR" ]; then
    echo -e "${GREEN}✅ Orchestrator Lambda: $ORCHESTRATOR${NC}"
else
    echo -e "${YELLOW}⚠️  Orchestrator Lambda not found${NC}"
fi

echo ""
echo "=================================="
echo "Next Steps"
echo "=================================="
echo ""
echo "1. Run the test suite:"
echo "   node tests/test-strands-agents-complete.js"
echo ""
echo "2. Check CloudWatch logs for any errors:"
echo "   aws logs tail /aws/lambda/$AGENT_LAMBDA --follow"
echo ""
echo "3. Test in the UI:"
echo "   - Open the chat interface"
echo "   - Try: 'Analyze terrain at 35.067482, -101.395466 with project_id test123'"
echo ""

