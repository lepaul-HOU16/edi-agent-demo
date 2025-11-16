#!/bin/bash

# Verification script for renewable project deletion permissions
# This script checks if the renewableToolsFunction has the necessary S3 permissions

echo "🔍 Verifying Renewable Tools Function S3 Permissions..."
echo ""

# Get the function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableTools')].FunctionName" --output text 2>/dev/null)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ ERROR: renewableToolsFunction not found"
    echo "   Make sure you've deployed with: npx ampx sandbox"
    exit 1
fi

echo "✅ Found function: $FUNCTION_NAME"
echo ""

# Get the IAM role
ROLE_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --query "Configuration.Role" --output text 2>/dev/null)

if [ -z "$ROLE_ARN" ]; then
    echo "❌ ERROR: Could not get IAM role for function"
    exit 1
fi

ROLE_NAME=$(echo "$ROLE_ARN" | awk -F'/' '{print $NF}')
echo "✅ IAM Role: $ROLE_NAME"
echo ""

# Get environment variables
echo "📋 Environment Variables:"
S3_BUCKET=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables.S3_BUCKET" --output text 2>/dev/null)
RENEWABLE_S3_BUCKET=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables.RENEWABLE_S3_BUCKET" --output text 2>/dev/null)

if [ "$S3_BUCKET" != "None" ] && [ -n "$S3_BUCKET" ]; then
    echo "   ✅ S3_BUCKET = $S3_BUCKET"
else
    echo "   ❌ S3_BUCKET not set"
fi

if [ "$RENEWABLE_S3_BUCKET" != "None" ] && [ -n "$RENEWABLE_S3_BUCKET" ]; then
    echo "   ✅ RENEWABLE_S3_BUCKET = $RENEWABLE_S3_BUCKET"
else
    echo "   ❌ RENEWABLE_S3_BUCKET not set"
fi

echo ""

# Check IAM policies
echo "🔐 Checking IAM Policies..."

# Get inline policies
INLINE_POLICIES=$(aws iam list-role-policies --role-name "$ROLE_NAME" --query "PolicyNames" --output text 2>/dev/null)

if [ -z "$INLINE_POLICIES" ]; then
    echo "   ⚠️  No inline policies found"
else
    echo "   ✅ Inline policies: $INLINE_POLICIES"
    
    # Check each inline policy for S3 permissions
    for POLICY_NAME in $INLINE_POLICIES; do
        echo ""
        echo "   📄 Policy: $POLICY_NAME"
        
        POLICY_DOC=$(aws iam get-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" --query "PolicyDocument" --output json 2>/dev/null)
        
        # Check for S3 permissions
        HAS_LIST=$(echo "$POLICY_DOC" | grep -c "s3:ListBucket" || true)
        HAS_GET=$(echo "$POLICY_DOC" | grep -c "s3:GetObject" || true)
        HAS_PUT=$(echo "$POLICY_DOC" | grep -c "s3:PutObject" || true)
        HAS_DELETE=$(echo "$POLICY_DOC" | grep -c "s3:DeleteObject" || true)
        
        if [ "$HAS_LIST" -gt 0 ]; then
            echo "      ✅ s3:ListBucket"
        else
            echo "      ❌ s3:ListBucket (MISSING)"
        fi
        
        if [ "$HAS_GET" -gt 0 ]; then
            echo "      ✅ s3:GetObject"
        else
            echo "      ❌ s3:GetObject (MISSING)"
        fi
        
        if [ "$HAS_PUT" -gt 0 ]; then
            echo "      ✅ s3:PutObject"
        else
            echo "      ❌ s3:PutObject (MISSING)"
        fi
        
        if [ "$HAS_DELETE" -gt 0 ]; then
            echo "      ✅ s3:DeleteObject"
        else
            echo "      ❌ s3:DeleteObject (MISSING - REQUIRED FOR DELETION)"
        fi
    done
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"

# Final verdict
if [ "$S3_BUCKET" != "None" ] && [ -n "$S3_BUCKET" ] && [ "$HAS_DELETE" -gt 0 ]; then
    echo "✅ ALL CHECKS PASSED - Deletion should work"
    echo ""
    echo "Next steps:"
    echo "1. Open project dashboard in browser"
    echo "2. Try deleting a project"
    echo "3. Check browser console for logs"
    echo "4. Verify project is removed from S3"
    exit 0
else
    echo "❌ SOME CHECKS FAILED - Deletion will NOT work"
    echo ""
    echo "Required fixes:"
    if [ "$S3_BUCKET" == "None" ] || [ -z "$S3_BUCKET" ]; then
        echo "- Add S3_BUCKET environment variable in amplify/backend.ts"
    fi
    if [ "$HAS_DELETE" -eq 0 ]; then
        echo "- Add s3:DeleteObject permission in amplify/backend.ts"
    fi
    echo ""
    echo "Then redeploy: npx ampx sandbox"
    exit 1
fi
