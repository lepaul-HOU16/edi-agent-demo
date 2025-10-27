#!/bin/bash

###############################################################################
# End-to-End Renewable Workflow Test Runner
#
# This script runs the complete E2E workflow test and provides helpful
# output and diagnostics.
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  End-to-End Renewable Workflow Test Runner${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher required. Current: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI $(aws --version | cut -d' ' -f1)${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured or invalid.${NC}"
    echo -e "${YELLOW}   Run: aws configure${NC}"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-$(aws configure get region)}
echo -e "${GREEN}✅ AWS Account: ${AWS_ACCOUNT}${NC}"
echo -e "${GREEN}✅ AWS Region: ${AWS_REGION}${NC}"

# Check if orchestrator Lambda exists
echo ""
echo -e "${YELLOW}Checking Lambda deployment...${NC}"

ORCHESTRATOR=$(aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" \
    --output text 2>/dev/null || echo "")

if [ -z "$ORCHESTRATOR" ]; then
    echo -e "${RED}❌ Renewable orchestrator Lambda not found.${NC}"
    echo -e "${YELLOW}   Please deploy the backend:${NC}"
    echo -e "${YELLOW}   cd $PROJECT_ROOT${NC}"
    echo -e "${YELLOW}   npx ampx sandbox${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Orchestrator Lambda: ${ORCHESTRATOR}${NC}"

# Check tool Lambdas
TERRAIN=$(aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" \
    --output text 2>/dev/null || echo "")

LAYOUT=$(aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" \
    --output text 2>/dev/null || echo "")

SIMULATION=$(aws lambda list-functions \
    --region "$AWS_REGION" \
    --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" \
    --output text 2>/dev/null || echo "")

if [ -z "$TERRAIN" ] || [ -z "$LAYOUT" ] || [ -z "$SIMULATION" ]; then
    echo -e "${YELLOW}⚠️  Some tool Lambdas not found. Test may fail.${NC}"
    [ -z "$TERRAIN" ] && echo -e "${YELLOW}   Missing: Terrain Tool${NC}"
    [ -z "$LAYOUT" ] && echo -e "${YELLOW}   Missing: Layout Tool${NC}"
    [ -z "$SIMULATION" ] && echo -e "${YELLOW}   Missing: Simulation Tool${NC}"
else
    echo -e "${GREEN}✅ Tool Lambdas deployed${NC}"
fi

# Run the test
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Running E2E Workflow Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

cd "$SCRIPT_DIR"

# Make test executable
chmod +x e2e-renewable-workflow-complete.js

# Run test
if node e2e-renewable-workflow-complete.js; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "  1. Review detailed results: ${BLUE}tests/e2e-workflow-test-results.json${NC}"
    echo -e "  2. Perform manual browser testing (see E2E_WORKFLOW_TEST_GUIDE.md)"
    echo -e "  3. Have users validate the workflow"
    echo ""
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ TESTS FAILED${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  1. Review test output above"
    echo -e "  2. Check detailed results: ${BLUE}tests/e2e-workflow-test-results.json${NC}"
    echo -e "  3. Check CloudWatch logs for Lambda errors:"
    echo -e "     ${BLUE}aws logs tail /aws/lambda/${ORCHESTRATOR} --follow${NC}"
    echo -e "  4. Review troubleshooting guide: ${BLUE}tests/E2E_WORKFLOW_TEST_GUIDE.md${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo -e "  - Missing perimeter: Check terrain handler deployment"
    echo -e "  - Missing terrain in layout: Check layout handler deployment"
    echo -e "  - Missing wake heat map: Check simulation handler and S3 permissions"
    echo -e "  - Missing action buttons: Check orchestrator formatArtifacts function"
    echo ""
    exit $EXIT_CODE
fi
