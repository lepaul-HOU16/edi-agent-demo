#!/bin/bash

# Simple Renewable Energy Backend Deployment Script
# This script deploys the renewable energy multi-agent system to AWS Bedrock AgentCore

set -e

echo "🌱 Renewable Energy Backend Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
PROJECT_NAME="renewable-wind-farm"
WORKSHOP_DIR="agentic-ai-for-renewable-site-design-mainline/workshop-assets"

echo -e "${BLUE}Configuration:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  Project: $PROJECT_NAME"
echo "  Workshop Directory: $WORKSHOP_DIR"
echo ""

# Check prerequisites
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo "-----------------------------------"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found${NC}"
    echo "  Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI installed${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    echo "  Please install Python 3.9 or later"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 installed${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "  Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Check workshop directory
if [ ! -d "$WORKSHOP_DIR" ]; then
    echo -e "${RED}✗ Workshop directory not found: $WORKSHOP_DIR${NC}"
    echo "  Please ensure the renewable energy demo repository is cloned"
    exit 1
fi
echo -e "${GREEN}✓ Workshop directory found${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    echo "  Please configure AWS CLI: aws configure"
    exit 1
fi
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials configured (Account: $AWS_ACCOUNT_ID)${NC}"

echo ""

# Navigate to workshop directory
cd "$WORKSHOP_DIR"

echo -e "${BLUE}Step 2: Setting Up Python Environment${NC}"
echo "---------------------------------------"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ requirements.txt not found, skipping${NC}"
fi

echo ""

echo -e "${BLUE}Step 3: Deploying to AgentCore${NC}"
echo "--------------------------------"

# Check if lab3 notebook exists
if [ ! -f "lab3_agentcore_tutorial.ipynb" ]; then
    echo -e "${RED}✗ lab3_agentcore_tutorial.ipynb not found${NC}"
    echo "  This file contains the AgentCore deployment code"
    exit 1
fi

echo -e "${YELLOW}Note: Full AgentCore deployment requires running the Jupyter notebook${NC}"
echo ""
echo "To complete the deployment:"
echo "  1. Start Jupyter: jupyter notebook lab3_agentcore_tutorial.ipynb"
echo "  2. Run all cells in the notebook"
echo "  3. Note the AgentCore endpoint URL from the output"
echo ""
echo "Alternatively, you can use the Python deployment script:"
echo "  python ../scripts/deploy-renewable-backend.py"
echo ""

# Provide quick deployment option
echo -e "${BLUE}Quick Deployment Option:${NC}"
echo "Would you like to run the automated Python deployment? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Running automated deployment..."
    
    # Check if deployment script exists
    if [ -f "../../scripts/deploy-renewable-backend.py" ]; then
        python ../../scripts/deploy-renewable-backend.py
    else
        echo -e "${YELLOW}⚠ Automated deployment script not found${NC}"
        echo "  Please run the Jupyter notebook manually"
    fi
else
    echo ""
    echo -e "${YELLOW}Manual deployment selected${NC}"
    echo "Please run: jupyter notebook lab3_agentcore_tutorial.ipynb"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Complete the AgentCore deployment (Jupyter notebook or Python script)"
echo "  2. Save the AgentCore endpoint URL"
echo "  3. Update .env.local with the endpoint URL"
echo "  4. Run: ./scripts/validate-renewable-integration.sh"
echo ""

