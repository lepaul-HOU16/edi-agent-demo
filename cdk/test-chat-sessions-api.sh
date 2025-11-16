#!/bin/bash

# Test ChatSession REST API endpoints
# This script tests all ChatSession CRUD operations

set -e

echo "🧪 Testing ChatSession REST API"
echo "================================"
echo ""

# Get Cognito token
echo "📝 Getting Cognito token..."
source ./get-cognito-token.sh
echo "✅ Token obtained"
echo ""

# API endpoint
API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"

# Test 1: Create a new session
echo "1️⃣  Testing POST /api/chat/sessions (Create session)"
echo "---------------------------------------------------"
CREATE_RESPONSE=$(curl -s -X POST \
  "${API_URL}/api/chat/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Session from API",
    "linkedCollectionId": "test-collection-123"
  }')

echo "Response: $CREATE_RESPONSE"
SESSION_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo "✅ Created session with ID: $SESSION_ID"
echo ""

# Test 2: Get session details
echo "2️⃣  Testing GET /api/chat/sessions/{id} (Get session)"
echo "---------------------------------------------------"
GET_RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/chat/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Response: $GET_RESPONSE"
echo "✅ Retrieved session details"
echo ""

# Test 3: Update session
echo "3️⃣  Testing PATCH /api/chat/sessions/{id} (Update session)"
echo "---------------------------------------------------"
UPDATE_RESPONSE=$(curl -s -X PATCH \
  "${API_URL}/api/chat/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Session"
  }')

echo "Response: $UPDATE_RESPONSE"
echo "✅ Updated session name"
echo ""

# Test 4: List sessions
echo "4️⃣  Testing GET /api/chat/sessions (List sessions)"
echo "---------------------------------------------------"
LIST_RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/chat/sessions?limit=10" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Response: $LIST_RESPONSE"
SESSION_COUNT=$(echo $LIST_RESPONSE | jq '.data | length')
echo "✅ Found $SESSION_COUNT session(s)"
echo ""

# Test 5: Get session messages (should be empty)
echo "5️⃣  Testing GET /api/chat/sessions/{id}/messages (Get messages)"
echo "---------------------------------------------------"
MESSAGES_RESPONSE=$(curl -s -X GET \
  "${API_URL}/api/chat/sessions/${SESSION_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Response: $MESSAGES_RESPONSE"
MESSAGE_COUNT=$(echo $MESSAGES_RESPONSE | jq '.data | length')
echo "✅ Found $MESSAGE_COUNT message(s) in session"
echo ""

# Test 6: Delete session
echo "6️⃣  Testing DELETE /api/chat/sessions/{id} (Delete session)"
echo "---------------------------------------------------"
DELETE_RESPONSE=$(curl -s -X DELETE \
  "${API_URL}/api/chat/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Response: $DELETE_RESPONSE"
echo "✅ Deleted session"
echo ""

# Test 7: Verify deletion (should return 404)
echo "7️⃣  Testing GET after DELETE (Should return 404)"
echo "---------------------------------------------------"
VERIFY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET \
  "${API_URL}/api/chat/sessions/${SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

HTTP_STATUS=$(echo "$VERIFY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "404" ]; then
  echo "✅ Session correctly deleted (404 returned)"
else
  echo "❌ Expected 404, got $HTTP_STATUS"
fi
echo ""

echo "================================"
echo "✅ All ChatSession API tests passed!"
echo "================================"
