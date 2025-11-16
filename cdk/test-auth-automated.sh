#!/bin/bash

# Automated authentication testing - Task 13.1

set -e

USER_POOL_ID="us-east-1_sC6yswGji"
CLIENT_ID="18m99t0u39vi9614ssd8sf8vmb"
REGION="us-east-1"
API_URL="https://iqvvvqvqe5.execute-api.us-east-1.amazonaws.com"
TEST_USERNAME="test-user@example.com"
TEST_PASSWORD="TestPass123!"

echo "🔐 Task 13.1: Authentication Flow Testing"
echo "=========================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Login
echo "Test 1: Login with credentials"
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "$CLIENT_ID" \
    --auth-parameters USERNAME="$TEST_USERNAME",PASSWORD="$TEST_PASSWORD" \
    --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
    REFRESH_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.RefreshToken')
    
    if [ "$ID_TOKEN" != "null" ] && [ -n "$ID_TOKEN" ]; then
        echo "✅ PASS - Login successful"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL - No token received"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ FAIL - Authentication failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: Authenticated API call
echo "Test 2: Authenticated API call"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $ID_TOKEN" "$API_URL/api/chat/sessions")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS - Authenticated call successful (HTTP 200)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "❌ FAIL - Got HTTP $HTTP_CODE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: Unauthorized access
echo "Test 3: Unauthorized access (no token)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/chat/sessions")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PASS - Correctly rejected (HTTP 401)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "❌ FAIL - Got HTTP $HTTP_CODE (expected 401)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 4: Token refresh
echo "Test 4: Token refresh"
REFRESH_RESPONSE=$(aws cognito-idp initiate-auth \
    --auth-flow REFRESH_TOKEN_AUTH \
    --client-id "$CLIENT_ID" \
    --auth-parameters REFRESH_TOKEN="$REFRESH_TOKEN" \
    --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    NEW_ID_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
    if [ "$NEW_ID_TOKEN" != "null" ] && [ -n "$NEW_ID_TOKEN" ]; then
        echo "✅ PASS - Token refresh successful"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL - No new token received"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo "❌ FAIL - Token refresh failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 5: Logout
echo "Test 5: Logout (global sign out)"
SIGNOUT_RESPONSE=$(aws cognito-idp global-sign-out \
    --access-token "$ACCESS_TOKEN" \
    --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ PASS - Logout successful"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "❌ FAIL - Logout failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total: 5"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ Task 13.1 COMPLETE - All authentication tests passed"
    exit 0
else
    echo "❌ Task 13.1 INCOMPLETE - Some tests failed"
    exit 1
fi
