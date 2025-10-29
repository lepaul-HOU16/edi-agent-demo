#!/bin/bash

echo "=== OSDU Authentication Diagnostics ==="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -E "^EDI_" .env.local | xargs)
fi

PLATFORM_URL="${EDI_PLATFORM_URL}"
echo "Platform: $PLATFORM_URL"
echo ""

# Try different OAuth endpoints
endpoints=(
    "/api/entitlements/v2/token"
    "/oauth/token"
    "/auth/token"
    "/api/v1/token"
    "/token"
)

echo "Testing different OAuth endpoints..."
echo ""

for endpoint in "${endpoints[@]}"; do
    url="${PLATFORM_URL}${endpoint}"
    echo "Trying: $endpoint"
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password&username=${EDI_USERNAME}&password=${EDI_PASSWORD}&client_id=${EDI_CLIENT_ID}&client_secret=${EDI_CLIENT_SECRET}" \
      2>&1)
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ SUCCESS! Use this endpoint: $endpoint"
        echo ""
        echo "Update your configuration to use:"
        echo "EDI_TOKEN_ENDPOINT=${endpoint}"
        exit 0
    elif [ "$http_code" = "401" ]; then
        echo "  ❌ 401 Unauthorized (endpoint exists but credentials rejected)"
    elif [ "$http_code" = "404" ]; then
        echo "  ⚠️  404 Not Found (endpoint doesn't exist)"
    else
        echo "  ⚠️  $http_code (unexpected response)"
    fi
done

echo ""
echo "=== None of the standard endpoints worked ==="
echo ""
echo "Next steps:"
echo "1. Log into the OSDU web interface: $PLATFORM_URL"
echo "2. Look for API documentation or developer settings"
echo "3. Find the correct OAuth/token endpoint"
echo "4. Verify your credentials work in the web interface"
echo ""
echo "Alternative: Try without OSDU"
echo "The EDIcraft agent can work with just Minecraft if you:"
echo "1. Comment out OSDU validation in the handler"
echo "2. Use local well data instead of OSDU"
echo "3. Focus on Minecraft visualization only"
