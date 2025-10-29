#!/bin/bash

echo "=== Testing OSDU Platform Connection ==="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -E "^EDI_" .env.local | xargs)
else
    echo "❌ .env.local not found"
    exit 1
fi

# Check if variables are set
if [ -z "$EDI_PLATFORM_URL" ]; then
    echo "❌ EDI_PLATFORM_URL not set"
    exit 1
fi

echo "Testing connection to: $EDI_PLATFORM_URL"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic Connectivity"
if curl -s --connect-timeout 5 "$EDI_PLATFORM_URL" > /dev/null 2>&1; then
    echo "✅ Platform URL is reachable"
else
    echo "❌ Cannot reach platform URL"
    echo "   Check if URL is correct and accessible"
    exit 1
fi

# Test 2: OAuth token endpoint
echo ""
echo "Test 2: OAuth Token Endpoint"
TOKEN_URL="${EDI_PLATFORM_URL}/api/entitlements/v2/token"
echo "Trying: $TOKEN_URL"

response=$(curl -s -w "\n%{http_code}" -X POST "$TOKEN_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=${EDI_USERNAME}&password=${EDI_PASSWORD}&client_id=${EDI_CLIENT_ID}&client_secret=${EDI_CLIENT_SECRET}" \
  2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ Authentication successful!"
    echo "Token received (first 50 chars):"
    echo "$body" | head -c 50
    echo "..."
elif [ "$http_code" = "401" ]; then
    echo "❌ Authentication failed (401 Unauthorized)"
    echo "   Check your credentials:"
    echo "   - EDI_USERNAME"
    echo "   - EDI_PASSWORD"
    echo "   - EDI_CLIENT_ID"
    echo "   - EDI_CLIENT_SECRET"
elif [ "$http_code" = "404" ]; then
    echo "❌ Token endpoint not found (404)"
    echo "   The OAuth endpoint might be different for your OSDU platform"
    echo "   Common alternatives:"
    echo "   - /oauth/token"
    echo "   - /auth/token"
    echo "   - /api/v1/token"
else
    echo "❌ Unexpected response: $http_code"
    echo "Response body:"
    echo "$body"
fi

echo ""
echo "=== Troubleshooting Tips ==="
echo ""
echo "If authentication fails:"
echo "1. Verify credentials in OSDU platform web interface"
echo "2. Check if OAuth endpoint URL is correct"
echo "3. Ensure client_id and client_secret are for API access"
echo "4. Check if your account has API access permissions"
echo ""
echo "Common OSDU OAuth endpoints:"
echo "- AWS EDI: /api/entitlements/v2/token"
echo "- Azure OSDU: /oauth/token"
echo "- Generic: /auth/token"
