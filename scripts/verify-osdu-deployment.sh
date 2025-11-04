#!/bin/bash

# OSDU Integration Deployment Verification Script
# This script verifies that the OSDU integration is properly deployed

set -e

echo "🔍 OSDU Integration Deployment Verification"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Check Lambda function exists
echo "1. Checking Lambda function deployment..."
LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'osduProxy')].FunctionName" --output text)

if [ -n "$LAMBDA_NAME" ]; then
    print_status 0 "Lambda function found: $LAMBDA_NAME"
else
    print_status 1 "Lambda function not found"
    exit 1
fi

echo ""

# 2. Check environment variables
echo "2. Checking environment variables..."
ENV_VARS=$(aws lambda get-function-configuration --function-name "$LAMBDA_NAME" --query "Environment.Variables" --output json)

OSDU_API_URL=$(echo "$ENV_VARS" | jq -r '.OSDU_API_URL // empty')
OSDU_API_KEY=$(echo "$ENV_VARS" | jq -r '.OSDU_API_KEY // empty')

if [ -n "$OSDU_API_URL" ]; then
    print_status 0 "OSDU_API_URL is set: $OSDU_API_URL"
else
    print_status 1 "OSDU_API_URL is not set"
fi

if [ -n "$OSDU_API_KEY" ] && [ "$OSDU_API_KEY" != "null" ]; then
    print_status 0 "OSDU_API_KEY is set (length: ${#OSDU_API_KEY})"
else
    print_status 1 "OSDU_API_KEY is not set"
    echo -e "${YELLOW}⚠️  To set the API key, run:${NC}"
    echo "aws lambda update-function-configuration --function-name $LAMBDA_NAME --environment 'Variables={OSDU_API_URL=$OSDU_API_URL,OSDU_API_KEY=YOUR_API_KEY_HERE,AMPLIFY_SSM_ENV_CONFIG=\"{}\"}'"
    exit 1
fi

echo ""

# 3. Check Lambda function state
echo "3. Checking Lambda function state..."
LAMBDA_STATE=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.State" --output text)
LAST_UPDATE=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.LastUpdateStatus" --output text)

if [ "$LAMBDA_STATE" = "Active" ]; then
    print_status 0 "Lambda state: $LAMBDA_STATE"
else
    print_status 1 "Lambda state: $LAMBDA_STATE (expected: Active)"
fi

if [ "$LAST_UPDATE" = "Successful" ]; then
    print_status 0 "Last update status: $LAST_UPDATE"
else
    print_status 1 "Last update status: $LAST_UPDATE"
fi

echo ""

# 4. Check CloudWatch logs
echo "4. Checking CloudWatch logs..."
LOG_GROUP="/aws/lambda/$LAMBDA_NAME"

# Check if log group exists
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query "logGroups[0].logGroupName" --output text &>/dev/null; then
    print_status 0 "CloudWatch log group exists: $LOG_GROUP"
    
    # Check for recent errors
    RECENT_ERRORS=$(aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time $(($(date +%s) * 1000 - 3600000)) \
        --filter-pattern "ERROR" \
        --max-items 5 \
        --query "events[*].message" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$RECENT_ERRORS" ]; then
        print_status 0 "No recent errors in CloudWatch logs"
    else
        print_status 1 "Recent errors found in CloudWatch logs:"
        echo "$RECENT_ERRORS"
    fi
else
    print_status 1 "CloudWatch log group not found"
fi

echo ""

# 5. Check GraphQL schema
echo "5. Checking GraphQL schema..."
if [ -f "amplify_outputs.json" ]; then
    print_status 0 "amplify_outputs.json exists"
    
    # Check if osduSearch query is in the schema
    if grep -q "osduSearch" amplify_outputs.json 2>/dev/null; then
        print_status 0 "osduSearch query found in schema"
    else
        print_status 1 "osduSearch query not found in schema"
    fi
else
    print_status 1 "amplify_outputs.json not found"
fi

echo ""

# Summary
echo "==========================================="
echo "✅ OSDU Integration Deployment Verification Complete"
echo ""
echo "Next steps:"
echo "1. Test the integration with: node tests/test-osdu-catalog-integration.js"
echo "2. Open the catalog page and try an OSDU search query"
echo "3. Monitor CloudWatch logs: aws logs tail $LOG_GROUP --follow"
