#!/bin/bash

# Fix IAM Roles for Standalone Renewable Energy Lambdas
# This script creates new IAM roles and updates the Lambda functions

set -e

ACCOUNT_ID="484907533441"
REGION="us-east-1"

echo "═══════════════════════════════════════════════════════════"
echo "🔧 Fixing IAM Roles for Standalone Lambda Functions"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Function to create IAM role and update Lambda
fix_lambda_iam() {
  local LAMBDA_NAME=$1
  local ROLE_NAME="${LAMBDA_NAME}-role"
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  
  echo "📦 Processing: ${LAMBDA_NAME}"
  echo "   Role: ${ROLE_NAME}"
  
  # Check if role already exists
  if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
    echo "   ✅ Role already exists"
  else
    echo "   📝 Creating IAM role..."
    
    # Create trust policy document
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # Create the role
    aws iam create-role \
      --role-name "${ROLE_NAME}" \
      --assume-role-policy-document file:///tmp/trust-policy.json \
      --description "IAM role for ${LAMBDA_NAME} Lambda function" \
      >/dev/null
    
    echo "   ✅ Role created"
    
    # Attach basic Lambda execution policy
    echo "   📝 Attaching basic execution policy..."
    aws iam attach-role-policy \
      --role-name "${ROLE_NAME}" \
      --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
      >/dev/null
    
    echo "   ✅ Basic execution policy attached"
    
    # Attach S3 access policy (needed for renewable energy tools)
    echo "   📝 Attaching S3 access policy..."
    aws iam attach-role-policy \
      --role-name "${ROLE_NAME}" \
      --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" \
      >/dev/null
    
    echo "   ✅ S3 access policy attached"
    
    # Wait for role to be available
    echo "   ⏳ Waiting for role to propagate..."
    sleep 10
  fi
  
  # Update Lambda function configuration
  echo "   📝 Updating Lambda function..."
  aws lambda update-function-configuration \
    --function-name "${LAMBDA_NAME}" \
    --role "${ROLE_ARN}" \
    >/dev/null
  
  echo "   ✅ Lambda function updated"
  echo ""
}

# Fix all three standalone Lambdas
fix_lambda_iam "renewable-terrain-simple"
fix_lambda_iam "renewable-layout-simple"
fix_lambda_iam "renewable-simulation-simple"

echo "═══════════════════════════════════════════════════════════"
echo "✅ All Lambda IAM roles fixed successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "   • renewable-terrain-simple   → renewable-terrain-simple-role"
echo "   • renewable-layout-simple    → renewable-layout-simple-role"
echo "   • renewable-simulation-simple → renewable-simulation-simple-role"
echo ""
echo "🔍 Verifying Lambda configurations..."
echo ""

# Verify each Lambda
for LAMBDA in "renewable-terrain-simple" "renewable-layout-simple" "renewable-simulation-simple"; do
  ROLE=$(aws lambda get-function-configuration --function-name "${LAMBDA}" --query 'Role' --output text)
  STATE=$(aws lambda get-function-configuration --function-name "${LAMBDA}" --query 'State' --output text)
  echo "   ${LAMBDA}:"
  echo "      Role: ${ROLE}"
  echo "      State: ${STATE}"
  echo ""
done

echo "✅ Verification complete!"
echo ""
echo "🧪 Next step: Run the end-to-end test"
echo "   cd cdk && node test-terrain-e2e.js"
