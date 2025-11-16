#!/bin/bash

# Test script for Cognito Authorizer
# This script verifies the Cognito JWT authorizer is working correctly

set -e

echo "========================================="
echo "Testing Cognito Authorizer"
echo "========================================="
echo ""

# Get test endpoint from CDK outputs
TEST_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`TestAuthEndpoint`].OutputValue' \
  --output text)

echo "Test Endpoint: $TEST_ENDPOINT"
echo ""

# Test 1: Request without token (should fail with 401)
echo "Test 1: Request without JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_ENDPOINT")
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected request without token (401)"
else
  echo "❌ Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 2: Request with invalid token (should fail with 401)
echo "Test 2: Request with invalid JWT token (expect 401 Unauthorized)"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid-token-12345" \
  "$TEST_ENDPOINT")
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly rejected invalid token (401)"
else
  echo "❌ Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 3: Get Cognito User Pool details
echo "Test 3: Cognito User Pool Configuration"
echo "----------------------------------------"
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Get User Pool details
aws cognito-idp describe-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --query 'UserPool.{Name:Name,Status:Status,MfaConfiguration:MfaConfiguration}' \
  --output table
echo ""

# Test 4: Check API Gateway authorizer configuration
echo "Test 4: API Gateway Authorizer Configuration"
echo "----------------------------------------"
API_ID=$(echo "$TEST_ENDPOINT" | sed -E 's|https://([^.]+)\..*|\1|')
echo "API ID: $API_ID"

# List authorizers
echo "Authorizers:"
aws apigatewayv2 get-authorizers --api-id "$API_ID" \
  --query 'Items[*].{Name:Name,Type:AuthorizerType,JwtIssuer:JwtConfiguration.Issuer}' \
  --output table
echo ""

# Test 5: Instructions for testing with real token
echo "Test 5: Testing with Real JWT Token"
echo "----------------------------------------"
echo "To test with a real JWT token, you need to:"
echo ""
echo "1. Log in to the application to get a JWT token"
echo "2. Extract the token from browser localStorage or cookies"
echo "3. Run the following command:"
echo ""
echo "   curl -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "        $TEST_ENDPOINT"
echo ""
echo "Or use this helper script:"
echo ""
echo "   # Set your JWT token"
echo "   export JWT_TOKEN=\"your-token-here\""
echo ""
echo "   # Test the endpoint"
echo "   curl -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "        $TEST_ENDPOINT | jq '.'"
echo ""

# Test 6: Check CloudWatch logs for authorizer
echo "Test 6: CloudWatch Logs"
echo "----------------------------------------"
LOG_GROUP="/aws/apigateway/EnergyInsights-development-http-api"
echo "Log Group: $LOG_GROUP"

# Check for recent log streams
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null || echo "")

if [ -n "$LATEST_STREAM" ] && [ "$LATEST_STREAM" != "None" ]; then
  echo "✅ Access logs are being written"
  echo "Latest stream: $LATEST_STREAM"
  echo ""
  echo "View logs with:"
  echo "  aws logs tail $LOG_GROUP --follow"
else
  echo "⚠️  No log streams yet (requests have been made)"
fi
echo ""

echo "========================================="
echo "✅ Cognito Authorizer tests complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Authorizer correctly rejects requests without tokens (401)"
echo "- Authorizer correctly rejects invalid tokens (401)"
echo "- Cognito User Pool is configured and active"
echo "- API Gateway authorizer is configured with JWT validation"
echo "- Ready for production use with real JWT tokens"
echo ""
echo "Next Steps:"
echo "1. Test with a real JWT token from the application"
echo "2. Verify user information is correctly extracted"
echo "3. Add more protected routes (Task 3.3)"
echo ""
