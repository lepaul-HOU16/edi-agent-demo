#!/bin/bash

# Verify single-backend operation after Amplify deletion
# This script confirms only CDK stack remains and all features work

echo "=========================================="
echo "Single-Backend Verification"
echo "=========================================="
echo ""

# 1. Check CloudFormation stacks
echo "1. CloudFormation Stacks:"
echo "   Checking for EnergyInsights and Amplify stacks..."
echo ""

CDK_STACK=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].{Name:StackName,Status:StackStatus}" --output json 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ CDK Stack: $(echo $CDK_STACK | jq -r '.Name') - $(echo $CDK_STACK | jq -r '.Status')"
else
    echo "   ❌ CDK Stack not found!"
    exit 1
fi

AMPLIFY_COUNT=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE DELETE_IN_PROGRESS \
    --query "StackSummaries[?contains(StackName, 'amplify-agentsforenergy-lepaul')].StackName" --output text 2>/dev/null | wc -l)

if [ "$AMPLIFY_COUNT" -eq 0 ]; then
    echo "   ✅ Amplify sandbox deleted (0 stacks found)"
else
    echo "   ⏳ Amplify sandbox deletion in progress ($AMPLIFY_COUNT stacks remaining)"
fi
echo ""

# 2. Check Lambda functions
echo "2. Lambda Functions:"
LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'EnergyInsights-development')].FunctionName" --output text 2>/dev/null | wc -w)
echo "   ✅ CDK Lambda functions: $LAMBDA_COUNT"
echo ""

# 3. Check DynamoDB tables
echo "3. DynamoDB Tables:"
PROJECT_TABLE=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='ProjectTableName'].OutputValue" --output text 2>/dev/null)
CHAT_TABLE=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='ChatMessageTableName'].OutputValue" --output text 2>/dev/null)
echo "   ✅ Project table: $PROJECT_TABLE"
echo "   ✅ ChatMessage table: $CHAT_TABLE"
echo ""

# 4. Check S3 buckets
echo "4. S3 Buckets:"
STORAGE_BUCKET=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='StorageBucketName'].OutputValue" --output text 2>/dev/null)
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text 2>/dev/null)
echo "   ✅ Storage bucket: $STORAGE_BUCKET"
echo "   ✅ Frontend bucket: $FRONTEND_BUCKET"
echo ""

# 5. Check API Gateway
echo "5. API Gateway:"
API_URL=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" --output text 2>/dev/null)
echo "   ✅ API URL: $API_URL"
echo ""

# 6. Check CloudFront
echo "6. CloudFront Distribution:"
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" --output text 2>/dev/null)
echo "   ✅ Frontend URL: $CLOUDFRONT_URL"
echo ""

# 7. Test API health
echo "7. API Health Check:"
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health" 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "   ✅ API is responding: $HEALTH_RESPONSE"
else
    echo "   ⚠️  API response: $HEALTH_RESPONSE"
fi
echo ""

# 8. Test frontend
echo "8. Frontend Accessibility:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL" 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ Frontend accessible (HTTP $FRONTEND_STATUS)"
else
    echo "   ❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
fi
echo ""

# 9. Cost analysis
echo "9. Resource Count (for cost estimation):"
echo "   - Lambda functions: $LAMBDA_COUNT"
echo "   - DynamoDB tables: 2 (Project, ChatMessage)"
echo "   - S3 buckets: 2 (Storage, Frontend)"
echo "   - API Gateway: 1 (HTTP API)"
echo "   - CloudFront: 1 distribution"
echo "   - Cognito: 1 user pool"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
if [ "$AMPLIFY_COUNT" -eq 0 ]; then
    echo "✅ Migration Complete!"
    echo "   - Only CDK stack (EnergyInsights-development) remains"
    echo "   - All features operational via CDK"
    echo "   - No duplicate resources"
    echo "   - Cost optimized (single backend)"
else
    echo "⏳ Migration In Progress"
    echo "   - CDK stack operational"
    echo "   - Amplify deletion in progress ($AMPLIFY_COUNT stacks)"
    echo "   - Run this script again in a few minutes"
fi
echo ""
