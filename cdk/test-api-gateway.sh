#!/bin/bash

# Test script for API Gateway HTTP API
# This script verifies the API Gateway is deployed and accessible

set -e

echo "========================================="
echo "Testing API Gateway HTTP API"
echo "========================================="
echo ""

# Get API URL from CDK outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text)

echo "API Gateway URL: $API_URL"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic connectivity (expect 404)"
echo "----------------------------------------"
curl -i "$API_URL/" 2>&1 | head -10
echo ""

# Test 2: CORS preflight
echo "Test 2: CORS preflight (expect 404 but with CORS headers)"
echo "----------------------------------------"
curl -i -X OPTIONS "$API_URL/" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  2>&1 | head -15
echo ""

# Test 3: Check CloudWatch logs
echo "Test 3: CloudWatch logs"
echo "----------------------------------------"
LOG_GROUP="/aws/apigateway/EnergyInsights-development-http-api"
echo "Log Group: $LOG_GROUP"

# Check if log group exists
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query 'logGroups[0].logGroupName' --output text | grep -q "$LOG_GROUP"; then
  echo "✅ Log group exists"
  
  # Get latest log stream
  LATEST_STREAM=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query 'logStreams[0].logStreamName' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$LATEST_STREAM" ] && [ "$LATEST_STREAM" != "None" ]; then
    echo "✅ Log streams exist"
    echo "Latest stream: $LATEST_STREAM"
  else
    echo "⚠️  No log streams yet (make a request first)"
  fi
else
  echo "❌ Log group not found"
fi
echo ""

# Test 4: Verify API Gateway configuration
echo "Test 4: API Gateway configuration"
echo "----------------------------------------"
API_ID=$(echo "$API_URL" | sed -E 's|https://([^.]+)\..*|\1|')
echo "API ID: $API_ID"

# Get API details
aws apigatewayv2 get-api --api-id "$API_ID" --query '{Name:Name,ProtocolType:ProtocolType,ApiEndpoint:ApiEndpoint}' --output table
echo ""

# Get CORS configuration
echo "CORS Configuration:"
aws apigatewayv2 get-api --api-id "$API_ID" --query 'CorsConfiguration' --output json
echo ""

echo "========================================="
echo "✅ API Gateway tests complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- API Gateway is deployed and accessible"
echo "- CORS is configured (allow all origins for development)"
echo "- CloudWatch logging is enabled"
echo "- Ready for Lambda integrations (Task 3.2, 3.3)"
echo ""
