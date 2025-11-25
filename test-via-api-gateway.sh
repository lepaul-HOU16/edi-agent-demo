#!/bin/bash

# Get API endpoint from CDK outputs
API_URL="https://t4begsixg2.execute-api.us-east-1.amazonaws.com/api/chat/message"

echo "🚀 Testing DEPLOYED Lambda via API Gateway"
echo "📍 Endpoint: $API_URL"
echo ""

# Make request with mock auth header
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token-for-testing" \
  -d '{
    "message": "Analyze terrain for wind farm at 35.067482, -101.395466",
    "chatSessionId": "test-'$(date +%s)'",
    "agentType": "renewable"
  }')

echo "📄 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check for artifacts
if echo "$RESPONSE" | grep -q '"artifacts"'; then
  echo ""
  echo "✅ SUCCESS: Response contains artifacts!"
  ARTIFACT_COUNT=$(echo "$RESPONSE" | jq '.artifacts | length' 2>/dev/null)
  echo "📊 Artifact count: $ARTIFACT_COUNT"
else
  echo ""
  echo "❌ FAILURE: No artifacts in response"
fi

# Check for duplicate messages
if echo "$RESPONSE" | grep -q "Analysis in Progress"; then
  echo "⚠️  WARNING: Contains 'Analysis in Progress' message"
else
  echo "✅ No duplicate 'Analysis in Progress' message"
fi
