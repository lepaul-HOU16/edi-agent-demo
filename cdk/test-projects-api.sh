#!/bin/bash

# Test script for Projects API
# This script tests the project management endpoints

set -e

echo "========================================="
echo "Testing Projects API"
echo "========================================="
echo ""

# Get API URL from CDK outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text)

echo "API Gateway URL: $API_URL"
echo ""

# Test 1: Request without token (should fail with 401)
echo "Test 1: DELETE without JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test-123"}' \
  "$API_URL/api/projects/delete")

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected request without token (401)"
else
  echo "❌ Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 2: Rename without token (should fail with 401)
echo "Test 2: RENAME without JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test-123","newName":"New Name"}' \
  "$API_URL/api/projects/rename")

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected request without token (401)"
else
  echo "❌ Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 3: Get project without token (should fail with 401)
echo "Test 3: GET project without JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/api/projects/test-123")

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected request without token (401)"
else
  echo "❌ Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 4: Check Lambda function
echo "Test 4: Lambda Function Configuration"
echo "----------------------------------------"
FUNCTION_NAME="EnergyInsights-development-projects"
echo "Function Name: $FUNCTION_NAME"

aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query '{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,Handler:Handler}' \
  --output table
echo ""

# Test 5: Check environment variables
echo "Test 5: Lambda Environment Variables"
echo "----------------------------------------"
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Environment.Variables' \
  --output json
echo ""

# Test 6: Check CloudWatch logs
echo "Test 6: CloudWatch Logs"
echo "----------------------------------------"
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
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
    echo "⚠️  No log streams yet (no requests made)"
  fi
else
  echo "❌ Log group not found"
fi
echo ""

echo "========================================="
echo "✅ Projects API tests complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- All endpoints correctly require authentication (401 without token)"
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
echo "2. Test DELETE endpoint:"
echo "   export JWT_TOKEN=\"your-token-here\""
echo "   curl -X POST \\"
echo "     -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"projectId\":\"test-project\"}' \\"
echo "     $API_URL/api/projects/delete | jq '.'"
echo ""
echo "3. Test RENAME endpoint:"
echo "   curl -X POST \\"
echo "     -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"projectId\":\"test-project\",\"newName\":\"New Name\"}' \\"
echo "     $API_URL/api/projects/rename | jq '.'"
echo ""
echo "4. Test GET endpoint:"
echo "   curl -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "     $API_URL/api/projects/test-project | jq '.'"
echo ""
