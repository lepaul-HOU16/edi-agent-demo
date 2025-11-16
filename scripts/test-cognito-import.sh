#!/bin/bash

# Test script to verify Cognito User Pool import
# This script:
# 1. Checks if the CDK stack is deployed
# 2. Invokes the test Lambda function
# 3. Verifies the response

set -e

echo "🔍 Testing Cognito User Pool Import..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the Lambda function name
FUNCTION_NAME="EnergyInsights-development-verify-cognito"

echo -e "${YELLOW}Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name "$FUNCTION_NAME" &> /dev/null; then
    echo -e "${GREEN}✅ Lambda function found${NC}"
else
    echo -e "${RED}❌ Lambda function not found${NC}"
    echo "Please deploy the CDK stack first:"
    echo "  cd cdk && npx cdk deploy"
    exit 1
fi

echo ""
echo -e "${YELLOW}Invoking test Lambda function...${NC}"

# Invoke the Lambda
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/cognito-test-response.json \
    > /dev/null

# Check the response
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda invoked successfully${NC}"
    echo ""
    echo -e "${YELLOW}Response:${NC}"
    cat /tmp/cognito-test-response.json | jq '.'
    
    # Parse the response
    STATUS_CODE=$(cat /tmp/cognito-test-response.json | jq -r '.statusCode')
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo ""
        echo -e "${GREEN}✅ Cognito User Pool import verified successfully!${NC}"
        echo ""
        echo "User Pool Details:"
        cat /tmp/cognito-test-response.json | jq -r '.body' | jq '.userPool'
        
        # Clean up
        rm /tmp/cognito-test-response.json
        exit 0
    else
        echo ""
        echo -e "${RED}❌ Test failed with status code: $STATUS_CODE${NC}"
        echo "Error details:"
        cat /tmp/cognito-test-response.json | jq -r '.body' | jq '.'
        
        # Clean up
        rm /tmp/cognito-test-response.json
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to invoke Lambda${NC}"
    exit 1
fi
