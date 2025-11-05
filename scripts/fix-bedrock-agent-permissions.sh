#!/bin/bash

# Fix Bedrock Agent Permissions
# This script adds the missing bedrock:InvokeAgent permission to the Lambda role

set -e

echo "🔧 === FIXING BEDROCK AGENT PERMISSIONS ==="
echo ""

# Step 1: Get the Lambda function name
echo "📋 Step 1: Finding agent Lambda function..."
LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'digitalassistant') && contains(FunctionName, 'agentlambda')].FunctionName" --output text)

if [ -z "$LAMBDA_NAME" ]; then
  echo "❌ ERROR: Agent Lambda function not found!"
  exit 1
fi

echo "✅ Found Lambda: $LAMBDA_NAME"
echo ""

# Step 2: Get the Lambda role ARN
echo "📋 Step 2: Getting Lambda role..."
ROLE_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.Role" --output text)
ROLE_NAME=$(echo "$ROLE_ARN" | awk -F'/' '{print $NF}')

echo "✅ Found Role: $ROLE_NAME"
echo ""

# Step 3: Create inline policy with correct permissions
echo "📋 Step 3: Adding bedrock:InvokeAgent permission..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > /tmp/bedrock-agent-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock-agent-runtime:InvokeAgent",
        "bedrock-agent:GetAgent",
        "bedrock-agent:GetAgentAlias"
      ],
      "Resource": [
        "arn:aws:bedrock:*:${ACCOUNT_ID}:agent/*",
        "arn:aws:bedrock:*:${ACCOUNT_ID}:agent-alias/*/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "BedrockAgentInvokePolicy" \
  --policy-document file:///tmp/bedrock-agent-policy.json

echo "✅ Permission added"
echo ""

# Step 4: Verify the policy was added
echo "📋 Step 4: Verifying policy..."
aws iam get-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "BedrockAgentInvokePolicy" \
  --query "PolicyDocument.Statement[0].Action" \
  --output table

echo ""
echo "🎉 === PERMISSIONS FIXED ==="
echo ""
echo "The Lambda role now has permission to invoke Bedrock Agents."
echo ""
echo "Next steps:"
echo "1. Test again: 'calculate porosity for well-001'"
echo "2. If still fails, restart sandbox: npx ampx sandbox"
echo ""
