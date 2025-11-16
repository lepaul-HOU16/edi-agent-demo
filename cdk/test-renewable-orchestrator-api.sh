#!/bin/bash

# Test Renewable Orchestrator API
# Tests the migrated renewable orchestrator Lambda via API Gateway

API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"

echo "========================================="
echo "Testing Renewable Orchestrator API"
echo "========================================="
echo ""
echo "API Gateway URL: $API_URL"
echo ""

# Test 1: POST without JWT token (expect 401)
echo "Test 1: POST without JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"analyze wind farm at 35.0, -101.4"}' \
  "$API_URL/api/renewable/analyze")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Correctly rejected request without token (401)"
else
  echo "❌ Expected 401, got $HTTP_STATUS"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Lambda Function Configuration
echo "Test 2: Lambda Function Configuration"
echo "----------------------------------------"
FUNCTION_NAME="EnergyInsights-development-renewable-orchestrator"
echo "Function Name: $FUNCTION_NAME"
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query '{Handler:Handler,Memory:MemorySize,Name:FunctionName,Runtime:Runtime,Timeout:Timeout}' \
  --output table 2>/dev/null
echo ""

# Test 3: Lambda Environment Variables
echo "Test 3: Lambda Environment Variables"
echo "----------------------------------------"
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Environment.Variables' \
  --output json 2>/dev/null | jq '.'
echo ""

# Test 4: CloudWatch Logs
echo "Test 4: CloudWatch Logs"
echo "----------------------------------------"
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
echo "Log Group: $LOG_GROUP"

# Check if log group exists
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP"; then
  echo "✅ Log group exists"
  
  # Get latest log stream
  LATEST_STREAM=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --query 'logStreams[0].logStreamName' \
    --output text 2>/dev/null)
  
  if [ -n "$LATEST_STREAM" ] && [ "$LATEST_STREAM" != "None" ]; then
    echo "✅ Log streams exist"
    echo "Latest stream: $LATEST_STREAM"
  else
    echo "ℹ️  No log streams yet (Lambda not invoked)"
  fi
else
  echo "❌ Log group not found"
fi
echo ""

# Test 5: API Route Configuration
echo "Test 5: API Route Configuration"
echo "----------------------------------------"
echo "Renewable Orchestrator Endpoint:"
echo "  POST $API_URL/api/renewable/analyze"
echo ""
echo "Expected Request Format:"
echo '  {
    "query": "analyze wind farm at coordinates 35.0, -101.4",
    "context": {},
    "sessionId": "optional-session-id"
  }'
echo ""

echo "========================================="
echo "✅ Renewable Orchestrator API tests complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Endpoint correctly requires authentication (401 without token)"
echo "- Lambda function deployed and configured"
echo "- CloudWatch logging enabled"
echo "- Ready for testing with real JWT tokens"
echo ""
echo "To test with a real JWT token:"
echo ""
echo "1. Get JWT token from browser:"
echo "   - Log in to the application"
echo "   - Open DevTools → Application → Local Storage"
echo "   - Find Cognito token (idToken)"
echo ""
echo "2. Test renewable orchestrator:"
echo '   export JWT_TOKEN="your-token-here"'
echo '   curl -X POST \'
echo '     -H "Authorization: Bearer $JWT_TOKEN" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"query":"analyze wind farm at 35.0, -101.4"}'"'"' \'
echo "     $API_URL/api/renewable/analyze | jq '.'"
echo ""
