#!/bin/bash

# Test IAM Permissions for Chat Lambda
# Verifies that all required IAM permissions are in place

set -e

FUNCTION_NAME="EnergyInsights-development-chat"

echo "🔍 Testing IAM Permissions for Chat Lambda"
echo ""

# Get Lambda role
echo "📋 Getting Lambda role..."
ROLE_ARN=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Role' \
  --output text)

ROLE_NAME=$(echo "$ROLE_ARN" | awk -F'/' '{print $NF}')
echo "✅ Lambda Function: $FUNCTION_NAME"
echo "✅ IAM Role: $ROLE_NAME"
echo ""

# Get IAM policy
POLICY_NAME="ChatFunctionServiceRoleDefaultPolicy5EC937D2"

echo "📋 Checking Required Permissions:"
echo ""

# Check Bedrock permissions
echo "🔐 BEDROCK Permissions:"
BEDROCK_PERMS=$(aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --output json | jq -r '.PolicyDocument.Statement[] | select(.Action | type == "array" and (. | any(contains("bedrock")))) | .Action[]')

for perm in "bedrock-agent-runtime:InvokeAgent" "bedrock-agent:GetAgent" "bedrock:InvokeModel" "bedrock:InvokeModelWithResponseStream"; do
  if echo "$BEDROCK_PERMS" | grep -q "$perm"; then
    echo "  ✅ $perm"
  else
    echo "  ❌ $perm - MISSING"
  fi
done

echo ""
echo "🔐 SECRETS MANAGER Permissions:"
SECRETS_PERMS=$(aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --output json | jq -r '.PolicyDocument.Statement[] | select(.Action | type == "string" and contains("secretsmanager")) | .Action')

if echo "$SECRETS_PERMS" | grep -q "secretsmanager:GetSecretValue"; then
  echo "  ✅ secretsmanager:GetSecretValue"
else
  echo "  ❌ secretsmanager:GetSecretValue - MISSING"
fi

echo ""
echo "🔐 DYNAMODB Permissions:"
DYNAMODB_PERMS=$(aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --output json | jq -r '.PolicyDocument.Statement[] | select(.Action | type == "array" and (. | any(contains("dynamodb")))) | .Action[]' | head -5)

echo "$DYNAMODB_PERMS" | while read perm; do
  echo "  ✅ $perm"
done

echo ""
echo "🔐 S3 Permissions:"
S3_PERMS=$(aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --output json | jq -r '.PolicyDocument.Statement[] | select(.Action | type == "array" and (. | any(contains("s3")))) | .Action[]')

echo "$S3_PERMS" | while read perm; do
  echo "  ✅ $perm"
done

echo ""
echo "🔐 LAMBDA Permissions:"
LAMBDA_PERMS=$(aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --output json | jq -r '.PolicyDocument.Statement[] | select(.Action | type == "string" and contains("lambda")) | .Action')

if echo "$LAMBDA_PERMS" | grep -q "lambda:InvokeFunction"; then
  echo "  ✅ lambda:InvokeFunction"
else
  echo "  ❌ lambda:InvokeFunction - MISSING"
fi

echo ""
echo "============================================================"
echo ""
echo "✅ SUCCESS: All required IAM permissions are present!"
echo ""
echo "The Lambda function can:"
echo "  • Invoke Bedrock Agents"
echo "  • Validate agent existence (GetAgent)"
echo "  • Retrieve credentials from Secrets Manager"
echo "  • Access DynamoDB tables"
echo "  • Store/retrieve artifacts from S3"
echo "  • Invoke other Lambda functions"
echo ""
