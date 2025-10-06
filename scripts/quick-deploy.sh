#!/bin/bash

# Quick Deploy Script for Multi-Agent System
# Checks prerequisites and runs deployment

set -e

echo "=========================================="
echo "Multi-Agent System Quick Deploy"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check AWS CLI
echo "Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI found${NC}"

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo "   Account: $ACCOUNT_ID"
echo "   Region: $REGION"

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.12+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"

# Check required Python packages
echo "Checking Python packages..."

# Only check boto3 (critical for deployment)
if ! python3 -c "import boto3" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  boto3 not found, installing...${NC}"
    python3 -m pip install boto3 --user --quiet
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install boto3. Please install manually:${NC}"
        echo "   python3 -m pip install boto3 --user"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Python packages ready${NC}"
echo -e "${YELLOW}Note: Additional packages will be installed in Docker containers during deployment${NC}"

# Check disk space
echo "Checking disk space..."
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "   Available: $AVAILABLE_SPACE"

echo ""
echo "=========================================="
echo "Prerequisites Check Complete!"
echo "=========================================="
echo ""
echo "Ready to deploy:"
echo "  - Lambda Function with MCP tools"
echo "  - AgentCore Gateway"
echo "  - AgentCore Runtime with Strands Agent"
echo ""
echo "Estimated time: 10-15 minutes"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "Starting Deployment..."
echo "=========================================="
echo ""

# Authenticate Docker with ECR Public
echo "🔐 Authenticating Docker with AWS ECR Public..."
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker authenticated${NC}"
else
    echo -e "${YELLOW}⚠️  ECR Public authentication failed (may not be critical)${NC}"
fi

# Run deployment
python3 scripts/deploy-complete-system.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo "=========================================="
    echo ""
    echo "Configuration stored in:"
    echo "  - Parameter Store: /nrel-mcp/gateway-url"
    echo "  - Parameter Store: /nrel-mcp/runtime-arn"
    echo "  - Secrets Manager: workshop/cognito/credentials"
    echo ""
    echo "Next steps:"
    echo "  1. Test the gateway with MCP client"
    echo "  2. Invoke the agent runtime"
    echo "  3. Monitor CloudWatch logs"
    echo ""
    echo "See docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md for details"
else
    echo ""
    echo "=========================================="
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo "=========================================="
    echo ""
    echo "Check the error messages above for details."
    echo "See docs/MULTI_AGENT_DEPLOYMENT_GUIDE.md for troubleshooting."
    exit 1
fi
