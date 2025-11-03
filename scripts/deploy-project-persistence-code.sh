#!/bin/bash

# Deploy Project Persistence Code Changes
# Task 15.4: Deploy updated orchestrator Lambda, tool Lambdas, frontend changes, and run smoke tests

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING PROJECT PERSISTENCE CODE CHANGES"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pre-deployment checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1: Pre-Deployment Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please configure AWS credentials and try again"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials configured${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"

# Check if TypeScript compiles without errors
echo ""
echo "Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo "Please fix TypeScript errors before deploying"
    exit 1
fi

echo ""

# Step 2: Build frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  Step 2: Building Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Building Next.js application..."
if npm run build; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Deploy backend changes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☁️  Step 3: Deploying Backend Changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "This will deploy:"
echo "  • Updated orchestrator Lambda with project persistence"
echo "  • Updated tool Lambdas (terrain, layout, simulation, report)"
echo "  • DynamoDB session context table"
echo "  • AWS Location Service place index"
echo "  • IAM permissions for S3, DynamoDB, and Location Service"
echo ""

# Check if sandbox is already running
if pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Amplify sandbox is already running${NC}"
    echo "Please stop the current sandbox (Ctrl+C) and restart it to apply changes"
    echo ""
    echo "Run: npx ampx sandbox"
    echo ""
    exit 0
fi

echo -e "${YELLOW}⚠️  Backend deployment requires restarting Amplify sandbox${NC}"
echo ""
echo "To deploy backend changes:"
echo "  1. Stop current sandbox if running (Ctrl+C)"
echo "  2. Run: npx ampx sandbox"
echo "  3. Wait for deployment to complete (~5-10 minutes)"
echo "  4. Run smoke tests: npm run test:project-persistence-smoke"
echo ""

# Ask user if they want to start sandbox now
read -p "Start Amplify sandbox now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Amplify sandbox..."
    echo ""
    echo -e "${YELLOW}Note: This will run in the foreground. Press Ctrl+C to stop.${NC}"
    echo ""
    npx ampx sandbox
else
    echo ""
    echo -e "${YELLOW}Skipping sandbox deployment${NC}"
    echo "Remember to restart sandbox manually to apply backend changes"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT SCRIPT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
