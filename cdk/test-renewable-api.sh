#!/bin/bash

# Test script for Renewable API Lambda
# Tests all endpoints after deployment

set -e

echo "🧪 Testing Renewable API Lambda"
echo "================================"
echo ""

# Get API URL from CDK output
echo "📡 Getting API URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name MainStack \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
  --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
  echo "❌ Could not get API URL. Is the stack deployed?"
  exit 1
fi

echo "✅ API URL: $API_URL"
echo ""

# Get Cognito token
echo "🔐 Getting Cognito token..."
if [ ! -f "./get-cognito-token.sh" ]; then
  echo "❌ get-cognito-token.sh not found"
  exit 1
fi

TOKEN=$(./get-cognito-token.sh 2>/dev/null | tail -1)

if [ -z "$TOKEN" ]; then
  echo "❌ Could not get Cognito token"
  exit 1
fi

echo "✅ Token obtained"
echo ""

# Test 1: Health check (full)
echo "Test 1: GET /api/renewable/health (full)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/renewable/health")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
  echo "✅ Test 1 passed"
else
  echo "❌ Test 1 failed (expected 200 or 503, got $HTTP_CODE)"
fi
echo ""

# Test 2: Health check (ready)
echo "Test 2: GET /api/renewable/health?type=ready"
echo "--------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/renewable/health?type=ready")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
  echo "✅ Test 2 passed"
else
  echo "❌ Test 2 failed (expected 200 or 503, got $HTTP_CODE)"
fi
echo ""

# Test 3: Health check (live)
echo "Test 3: GET /api/renewable/health?type=live"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/renewable/health?type=live")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 3 passed"
else
  echo "❌ Test 3 failed (expected 200, got $HTTP_CODE)"
fi
echo ""

# Test 4: Debug endpoint
echo "Test 4: GET /api/renewable/debug"
echo "--------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/renewable/debug")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 4 passed"
else
  echo "❌ Test 4 failed (expected 200, got $HTTP_CODE)"
fi
echo ""

# Test 5: Deployment health
echo "Test 5: GET /api/renewable/health/deployment"
echo "--------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/renewable/health/deployment")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 5 passed"
else
  echo "❌ Test 5 failed (expected 200, got $HTTP_CODE)"
fi
echo ""

# Test 6: Energy production (POST)
echo "Test 6: POST /api/renewable/energy-production"
echo "---------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  "$API_URL/api/renewable/energy-production")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 6 passed"
else
  echo "❌ Test 6 failed (expected 200, got $HTTP_CODE)"
fi
echo ""

# Test 7: Wind data (POST)
echo "Test 7: POST /api/renewable/wind-data"
echo "-------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  "$API_URL/api/renewable/wind-data")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Status: $HTTP_CODE"
echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Test 7 passed"
else
  echo "❌ Test 7 failed (expected 200, got $HTTP_CODE)"
fi
echo ""

echo "================================"
echo "✅ All tests completed!"
echo ""
echo "Check CloudWatch Logs:"
echo "aws logs tail /aws/lambda/MainStack-api-renewable --follow"
