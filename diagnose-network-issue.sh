#!/bin/bash
echo "🔍 Network & Deployment Diagnostic Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

echo -e "\n${YELLOW}1. Basic Connectivity Check${NC}"
echo "----------------------------"
# Internet connectivity
ping -c 3 google.com > /dev/null 2>&1
check_command "Internet connectivity"

# DNS resolution
nslookup t4begsixg2.execute-api.us-east-1.amazonaws.com > /dev/null 2>&1
check_command "DNS resolution for API endpoint"

echo -e "\n${YELLOW}2. API Endpoint Check${NC}"
echo "----------------------"
# Test API endpoint
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://t4begsixg2.execute-api.us-east-1.amazonaws.com/api/health 2>/dev/null)
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ API endpoint reachable (HTTP $API_RESPONSE)${NC}"
else
    echo -e "${RED}❌ API endpoint unreachable (HTTP $API_RESPONSE)${NC}"
fi

echo -e "\n${YELLOW}3. AWS Configuration${NC}"
echo "--------------------"
# AWS credentials
aws sts get-caller-identity > /dev/null 2>&1
check_command "AWS credentials configured"

# AWS region
if [ -n "$AWS_DEFAULT_REGION" ]; then
    echo -e "${GREEN}✅ AWS region set: $AWS_DEFAULT_REGION${NC}"
else
    echo -e "${YELLOW}⚠️  AWS region not set in environment${NC}"
fi

echo -e "\n${YELLOW}4. Local Development Server${NC}"
echo "----------------------------"
# Check if Vite is running
if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✅ Vite dev server is running${NC}"
    echo "   PID: $(pgrep -f vite)"
else
    echo -e "${RED}❌ Vite dev server not running${NC}"
fi

# Check Node.js processes
NODE_COUNT=$(pgrep -f node | wc -l)
echo -e "${GREEN}ℹ️  Node.js processes running: $NODE_COUNT${NC}"

echo -e "\n${YELLOW}5. Environment Configuration${NC}"
echo "-----------------------------"
# Check for .env files
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local file exists${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
fi

echo -e "\n${YELLOW}6. Proxy Configuration${NC}"
echo "-----------------------"
if [ -n "$HTTP_PROXY" ]; then
    echo -e "${YELLOW}⚠️  HTTP_PROXY set: $HTTP_PROXY${NC}"
else
    echo -e "${GREEN}✅ No HTTP proxy configured${NC}"
fi

if [ -n "$HTTPS_PROXY" ]; then
    echo -e "${YELLOW}⚠️  HTTPS_PROXY set: $HTTPS_PROXY${NC}"
else
    echo -e "${GREEN}✅ No HTTPS proxy configured${NC}"
fi

echo -e "\n${YELLOW}7. Quick Fixes to Try${NC}"
echo "---------------------"
echo "1. Restart dev server: npm run dev"
echo "2. Clear cache: rm -rf node_modules/.vite && npm run dev"
echo "3. Check AWS credentials: aws configure"
echo "4. Test API directly: curl https://t4begsixg2.execute-api.us-east-1.amazonaws.com"

echo -e "\n${YELLOW}Diagnostic Complete!${NC}"
echo "===================="
