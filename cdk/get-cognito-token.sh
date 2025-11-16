#!/bin/bash

# Helper script to get a Cognito JWT token for testing
# You'll need to provide your username and password

echo "🔐 Cognito Token Helper"
echo "======================="
echo ""
echo "User Pool ID: us-east-1_sC6yswGji"
echo "Client ID: 18m99t0u39vi9614ssd8sf8vmb"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "   Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Prompt for credentials
read -p "Username: " USERNAME
read -sp "Password: " PASSWORD
echo ""

# Authenticate and get tokens
echo "🔄 Authenticating..."
RESPONSE=$(aws cognito-idp initiate-auth \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id 18m99t0u39vi9614ssd8sf8vmb \
    --auth-parameters USERNAME="$USERNAME",PASSWORD="$PASSWORD" \
    --region us-east-1 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed:"
    echo "$RESPONSE"
    exit 1
fi

# Extract ID token
ID_TOKEN=$(echo "$RESPONSE" | jq -r '.AuthenticationResult.IdToken')

if [ "$ID_TOKEN" = "null" ] || [ -z "$ID_TOKEN" ]; then
    echo "❌ Failed to extract ID token"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Authentication successful!"
echo ""
echo "Your JWT token (valid for 1 hour):"
echo "=================================="
echo "$ID_TOKEN"
echo "=================================="
echo ""
echo "To use in tests, run:"
echo "export TOKEN=\"$ID_TOKEN\""
echo ""
echo "Or test directly:"
echo "TOKEN=\"$ID_TOKEN\" ./test-collections-api.sh"
