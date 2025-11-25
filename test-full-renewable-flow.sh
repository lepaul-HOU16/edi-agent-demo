#!/bin/bash

echo "🧪 Testing Full Renewable Agent Flow"
echo "===================================="
echo ""

# Test via actual UI endpoint
API_URL="https://t4begsixg2.execute-api.us-east-1.amazonaws.com/api/chat/message"
SESSION_ID="test-$(date +%s)"

echo "📍 API Endpoint: $API_URL"
echo "🆔 Session ID: $SESSION_ID"
echo ""

# Make request
echo "📤 Sending terrain analysis request..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-mock-user-id: test-user" \
  -d "{
    \"message\": \"Analyze terrain for wind farm at 35.067482, -101.395466\",
    \"chatSessionId\": \"$SESSION_ID\"
  }")

echo "📥 Response received"
echo ""

# Parse response
echo "🔍 Analyzing response..."
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check for success indicators
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ API returned success"
else
  echo "❌ API did not return success"
fi

if echo "$RESPONSE" | grep -q '"artifacts"'; then
  ARTIFACT_COUNT=$(echo "$RESPONSE" | jq '.response.artifacts | length' 2>/dev/null)
  if [ "$ARTIFACT_COUNT" -gt 0 ]; then
    echo "✅ Response contains $ARTIFACT_COUNT artifact(s)"
  else
    echo "⚠️  Response has artifacts field but count is 0"
  fi
else
  echo "❌ No artifacts in response"
fi

if echo "$RESPONSE" | grep -q "No response generated"; then
  echo "❌ Got 'No response generated' message"
fi

echo ""
echo "🔬 Checking CloudWatch logs for errors..."
sleep 2

# Check orchestrator logs for errors
ERRORS=$(aws logs filter-log-events \
  --log-group-name /aws/lambda/EnergyInsights-development-renewable-orchestrator \
  --start-time $(($(date +%s) - 60))000 \
  --filter-pattern "ERROR" \
  --query 'events[].message' \
  --output text 2>/dev/null | head -5)

if [ -z "$ERRORS" ]; then
  echo "✅ No errors in orchestrator logs"
else
  echo "❌ Errors found in orchestrator logs:"
  echo "$ERRORS"
fi

echo ""
echo "===================================="
echo "Test complete"
