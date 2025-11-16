#!/bin/bash

# Create a test user in Cognito for API testing

set -e

USER_POOL_ID="us-east-1_sC6yswGji"
USERNAME="test-user@example.com"
TEMP_PASSWORD="TempPass123!"
PERMANENT_PASSWORD="TestPass123!"

echo "🔐 Creating Cognito Test User"
echo "=============================="
echo ""
echo "User Pool ID: $USER_POOL_ID"
echo "Username: $USERNAME"
echo ""

# Check if user already exists
echo "🔍 Checking if user exists..."
USER_EXISTS=$(aws cognito-idp admin-get-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$USERNAME" \
  --region us-east-1 2>&1 || echo "NOT_FOUND")

if [[ "$USER_EXISTS" != *"NOT_FOUND"* ]] && [[ "$USER_EXISTS" != *"UserNotFoundException"* ]]; then
  echo "✅ User already exists: $USERNAME"
  echo ""
  echo "To use this user for testing:"
  echo "  Username: $USERNAME"
  echo "  Password: $PERMANENT_PASSWORD"
  echo ""
  echo "To get a token, run:"
  echo "  ./get-cognito-token.sh"
  exit 0
fi

# Create user
echo "📝 Creating user..."
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$USERNAME" \
  --temporary-password "$TEMP_PASSWORD" \
  --user-attributes Name=email,Value="$USERNAME" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region us-east-1

echo "✅ User created"
echo ""

# Set permanent password
echo "🔑 Setting permanent password..."
aws cognito-idp admin-set-user-password \
  --user-pool-id "$USER_POOL_ID" \
  --username "$USERNAME" \
  --password "$PERMANENT_PASSWORD" \
  --permanent \
  --region us-east-1

echo "✅ Password set"
echo ""

echo "=============================="
echo "✅ Test user created successfully!"
echo ""
echo "Credentials:"
echo "  Username: $USERNAME"
echo "  Password: $PERMANENT_PASSWORD"
echo ""
echo "To get a token for testing, run:"
echo "  ./get-cognito-token.sh"
echo ""
echo "Or use these credentials directly in the app:"
echo "  https://d36sq31aqkfe46.cloudfront.net"
echo "=============================="
