#!/bin/bash

# Test script for Chat API endpoint
# Tests the migrated chat/agent Lambda function

set -e

echo "=========================================="
echo "Testing Chat API Endpoint"
echo "=========================================="
echo ""

# Get API endpoint from CDK outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`ChatEndpoint`].OutputValue' \
  --output text)

echo "API Endpoint: $API_URL"
echo ""

# Get Cognito User Pool ID and Client ID
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsights-development \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"
echo ""

# Check if we have credentials
if [ -z "$COGNITO_USERNAME" ] || [ -z "$COGNITO_PASSWORD" ]; then
  echo "⚠️  COGNITO_USERNAME and COGNITO_PASSWORD environment variables not set"
  echo "Please set them to test with authentication:"
  echo "  export COGNITO_USERNAME=your-email@example.com"
  echo "  export COGNITO_PASSWORD=your-password"
  echo ""
  echo "Skipping authenticated tests..."
  exit 0
fi

# Get Cognito Client ID (we need to look this up from the user pool)
CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id "$USER_POOL_ID" \
  --max-results 1 \
  --query 'UserPoolClients[0].ClientId' \
  --output text)

echo "Client ID: $CLIENT_ID"
echo ""

# Authenticate and get JWT token
echo "Authenticating with Cognito..."
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters USERNAME="$COGNITO_USERNAME",PASSWORD="$COGNITO_PASSWORD" \
  2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Authentication failed:"
  echo "$AUTH_RESPONSE"
  exit 1
fi

ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')

if [ "$ID_TOKEN" == "null" ] || [ -z "$ID_TOKEN" ]; then
  echo "❌ Failed to get ID token"
  echo "$AUTH_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful"
echo ""

# Test 1: Simple general knowledge query
echo "=========================================="
echo "Test 1: General Knowledge Query"
echo "=========================================="
echo ""

CHAT_SESSION_ID="test-session-$(date +%s)"

TEST1_PAYLOAD=$(cat <<EOF
{
  "chatSessionId": "$CHAT_SESSION_ID",
  "message": "What is petrophysics?",
  "agentType": "auto"
}
EOF
)

echo "Request:"
echo "$TEST1_PAYLOAD" | jq '.'
echo ""

echo "Sending request..."
TEST1_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TEST1_PAYLOAD")

echo "Response:"
echo "$TEST1_RESPONSE" | jq '.'
echo ""

# Check if response is successful
SUCCESS=$(echo "$TEST1_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo "✅ Test 1 PASSED: General knowledge query successful"
else
  echo "❌ Test 1 FAILED: Query was not successful"
  echo "Response: $TEST1_RESPONSE"
fi
echo ""

# Test 2: Petrophysics agent query
echo "=========================================="
echo "Test 2: Petrophysics Agent Query"
echo "=========================================="
echo ""

TEST2_PAYLOAD=$(cat <<EOF
{
  "chatSessionId": "$CHAT_SESSION_ID",
  "message": "Calculate porosity for WELL-001",
  "agentType": "petrophysics"
}
EOF
)

echo "Request:"
echo "$TEST2_PAYLOAD" | jq '.'
echo ""

echo "Sending request..."
TEST2_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TEST2_PAYLOAD")

echo "Response:"
echo "$TEST2_RESPONSE" | jq '.'
echo ""

# Check if response is successful
SUCCESS=$(echo "$TEST2_RESPONSE" | jq -r '.success')
AGENT_USED=$(echo "$TEST2_RESPONSE" | jq -r '.data.agentUsed')

if [ "$SUCCESS" == "true" ]; then
  echo "✅ Test 2 PASSED: Petrophysics query successful"
  echo "   Agent used: $AGENT_USED"
else
  echo "❌ Test 2 FAILED: Query was not successful"
fi
echo ""

# Test 3: Check for artifacts
echo "=========================================="
echo "Test 3: Artifact Generation"
echo "=========================================="
echo ""

ARTIFACT_COUNT=$(echo "$TEST2_RESPONSE" | jq -r '.data.artifacts | length')
echo "Artifacts generated: $ARTIFACT_COUNT"

if [ "$ARTIFACT_COUNT" -gt 0 ]; then
  echo "✅ Test 3 PASSED: Artifacts were generated"
  echo ""
  echo "Artifact types:"
  echo "$TEST2_RESPONSE" | jq -r '.data.artifacts[].type'
else
  echo "⚠️  Test 3: No artifacts generated (may be expected for this query)"
fi
echo ""

# Test 4: Check thought steps
echo "=========================================="
echo "Test 4: Thought Steps"
echo "=========================================="
echo ""

THOUGHT_STEP_COUNT=$(echo "$TEST2_RESPONSE" | jq -r '.data.thoughtSteps | length')
echo "Thought steps: $THOUGHT_STEP_COUNT"

if [ "$THOUGHT_STEP_COUNT" -gt 0 ]; then
  echo "✅ Test 4 PASSED: Thought steps were generated"
  echo ""
  echo "Thought step titles:"
  echo "$TEST2_RESPONSE" | jq -r '.data.thoughtSteps[].title'
else
  echo "ℹ️  Test 4: No thought steps (may be expected for simple queries)"
fi
echo ""

# Test 5: Test without authentication (should fail)
echo "=========================================="
echo "Test 5: Authentication Required"
echo "=========================================="
echo ""

echo "Sending request without authentication..."
TEST5_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST1_PAYLOAD")

echo "Response:"
echo "$TEST5_RESPONSE"
echo ""

# Check if request was rejected
if echo "$TEST5_RESPONSE" | grep -q "Unauthorized\|401\|Forbidden"; then
  echo "✅ Test 5 PASSED: Unauthenticated request was rejected"
else
  echo "❌ Test 5 FAILED: Unauthenticated request should have been rejected"
fi
echo ""

# Test 6: Check Lambda logs
echo "=========================================="
echo "Test 6: Lambda Execution Logs"
echo "=========================================="
echo ""

LAMBDA_NAME="EnergyInsights-development-chat"
LOG_GROUP="/aws/lambda/$LAMBDA_NAME"

echo "Fetching recent logs from $LOG_GROUP..."
echo ""

# Get the most recent log stream
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null)

if [ -n "$LOG_STREAM" ] && [ "$LOG_STREAM" != "None" ]; then
  echo "Most recent log stream: $LOG_STREAM"
  echo ""
  echo "Recent log events:"
  aws logs get-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$LOG_STREAM" \
    --limit 20 \
    --query 'events[*].message' \
    --output text | tail -20
  echo ""
  echo "✅ Test 6 PASSED: Lambda logs are accessible"
else
  echo "⚠️  Test 6: No log streams found yet (Lambda may not have been invoked)"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Chat API Endpoint: $API_URL"
echo "Lambda Function: $LAMBDA_NAME"
echo ""
echo "All tests completed!"
echo ""
echo "Next steps:"
echo "1. Check CloudWatch logs for detailed execution traces"
echo "2. Test with different agent types (maintenance, renewable, edicraft)"
echo "3. Test conversation history by sending multiple messages"
echo "4. Verify DynamoDB records are created in ChatMessage table"
