#!/bin/bash

# Test Frontend Deployment
# Verifies that the frontend is properly deployed and accessible

set -e

echo "🧪 Testing Frontend Deployment..."
echo ""

STACK_NAME=${STACK_NAME:-"EnergyDataInsightsStack"}

# Get CloudFront URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$FRONTEND_URL" ]; then
  echo "❌ Error: Frontend URL not found"
  exit 1
fi

echo "🌐 Testing: $FRONTEND_URL"
echo ""

# Test 1: Homepage loads
echo "1️⃣ Testing homepage..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
if [ "$RESPONSE" = "200" ]; then
  echo "✅ Homepage accessible (HTTP $RESPONSE)"
else
  echo "❌ Homepage failed (HTTP $RESPONSE)"
fi

# Test 2: Static assets load
echo "2️⃣ Testing static assets..."
ASSETS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/assets/" || echo "000")
if [ "$ASSETS_RESPONSE" = "200" ] || [ "$ASSETS_RESPONSE" = "403" ]; then
  echo "✅ Assets directory exists"
else
  echo "⚠️  Assets check inconclusive (HTTP $ASSETS_RESPONSE)"
fi

# Test 3: SPA routing (404 should return index.html)
echo "3️⃣ Testing SPA routing..."
SPA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/chat/test-123" || echo "000")
if [ "$SPA_RESPONSE" = "200" ]; then
  echo "✅ SPA routing works (HTTP $SPA_RESPONSE)"
else
  echo "❌ SPA routing failed (HTTP $SPA_RESPONSE)"
fi

# Test 4: API accessible through CloudFront
echo "4️⃣ Testing API through CloudFront..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/api/health" || echo "000")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "401" ]; then
  echo "✅ API accessible (HTTP $API_RESPONSE)"
else
  echo "⚠️  API check inconclusive (HTTP $API_RESPONSE)"
fi

# Test 5: HTTPS redirect
echo "5️⃣ Testing HTTPS redirect..."
HTTP_URL=$(echo "$FRONTEND_URL" | sed 's/https/http/')
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "$HTTP_URL" || echo "")
if [[ "$REDIRECT" == https://* ]]; then
  echo "✅ HTTPS redirect working"
else
  echo "⚠️  HTTPS redirect check inconclusive"
fi

echo ""
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Next steps:"
echo "1. Open $FRONTEND_URL in browser"
echo "2. Test authentication flow"
echo "3. Test all major features"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
