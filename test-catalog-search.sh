#!/bin/bash

# Test Catalog Search API Endpoint
# This script tests the catalog search functionality

API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"
ENDPOINT="/api/catalog/search"

echo "🧪 Testing Catalog Search API"
echo "================================"
echo ""
echo "API URL: $API_URL$ENDPOINT"
echo ""

# Get auth token (you'll need to replace this with actual token)
echo "⚠️  Note: You need to provide a valid JWT token"
echo "To get a token:"
echo "1. Open browser console on the app"
echo "2. Run: localStorage.getItem('idToken')"
echo "3. Copy the token and set it below"
echo ""

# Prompt for token
read -p "Enter JWT token (or press Enter to skip): " TOKEN

if [ -z "$TOKEN" ]; then
  echo "❌ No token provided. Using mock token for testing..."
  TOKEN="mock-token-for-testing"
fi

echo ""
echo "📤 Sending test request..."
echo ""

# Test request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "show me wells",
    "existingContext": null
  }')

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📡 Response Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS!"
  echo ""
  echo "Response Body:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ AUTHENTICATION FAILED"
  echo ""
  echo "The token is invalid or expired."
  echo "Please get a fresh token from the browser console."
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ FORBIDDEN"
  echo ""
  echo "You don't have permission to access this endpoint."
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ NOT FOUND"
  echo ""
  echo "The endpoint doesn't exist. Check the API Gateway configuration."
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ SERVER ERROR"
  echo ""
  echo "Response Body:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ UNEXPECTED STATUS CODE"
  echo ""
  echo "Response Body:"
  echo "$BODY"
fi

echo ""
echo "================================"
echo "🔍 Debugging Tips:"
echo ""
echo "1. Check CloudWatch Logs:"
echo "   aws logs tail /aws/lambda/catalog-search --follow"
echo ""
echo "2. Check API Gateway Logs:"
echo "   aws logs tail /aws/apigateway/digital-assistant-api --follow"
echo ""
echo "3. Verify Lambda exists:"
echo "   aws lambda get-function --function-name catalog-search"
echo ""
echo "4. Test Lambda directly:"
echo "   aws lambda invoke --function-name catalog-search \\"
echo "     --payload '{\"body\":\"{\\\"prompt\\\":\\\"show me wells\\\"}\"}' \\"
echo "     response.json"
echo ""
