#!/bin/bash

# Test OSDU search endpoint
# This script tests the OSDU search API to verify it's working

echo "🔍 Testing OSDU Search API..."
echo ""

# Get the API endpoint
API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"
ENDPOINT="/api/osdu/search"

# Get a mock token (for testing)
TOKEN="mock-dev-token"

echo "📡 Calling: POST ${API_URL}${ENDPOINT}"
echo "🔑 Using mock token for development"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${ENDPOINT}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "show me wells",
    "dataPartition": "osdu",
    "maxResults": 10
  }')

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Response Status: ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS! OSDU search is working"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "503" ]; then
  echo "❌ OSDU API not configured (503)"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Check Lambda environment variables:"
  echo "   aws lambda get-function-configuration --function-name EnergyInsights-development-osdu --query 'Environment.Variables'"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️  Authentication issue (401)"
  echo ""
  echo "This is expected in development. The backend needs to accept mock tokens."
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Unexpected response: ${HTTP_CODE}"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "🔧 To check Lambda configuration:"
echo "   aws lambda get-function-configuration --function-name EnergyInsights-development-osdu"
