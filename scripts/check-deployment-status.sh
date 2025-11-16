#!/bin/bash

# Check deployment status across GitHub Actions and AWS
# Run this after pushing to main to monitor your deployment

set -e

echo "=========================================="
echo "Deployment Status Check"
echo "=========================================="
echo ""
echo "Checking deployment status after your push..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="EnergyInsights-development"
CLOUDFRONT_DIST_ID="E3O1QDG49S3NGP"
FRONTEND_URL="https://d36sq31aqkfe46.cloudfront.net"
API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"

# 1. Check GitHub Actions (if gh CLI is available)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. GitHub Actions Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v gh &> /dev/null; then
    echo "Fetching latest workflow runs..."
    gh run list --limit 3 --workflow=deploy-production.yml 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Could not fetch GitHub Actions status${NC}"
        echo "   Check manually: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    }
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed${NC}"
    echo ""
    echo "To check GitHub Actions status:"
    echo "1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/' 2>/dev/null || echo 'YOUR_REPO')/actions"
    echo "2. Look for 'Deploy to Production' workflow"
    echo "3. Check if it's running, succeeded, or failed"
fi

echo ""

# 2. Check AWS CloudFormation Stack
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. AWS CloudFormation Stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null)

LAST_UPDATED=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].LastUpdatedTime" \
    --output text 2>/dev/null)

if [ "$STACK_STATUS" = "UPDATE_COMPLETE" ] || [ "$STACK_STATUS" = "CREATE_COMPLETE" ]; then
    echo -e "${GREEN}✅ Stack Status: $STACK_STATUS${NC}"
elif [ "$STACK_STATUS" = "UPDATE_IN_PROGRESS" ]; then
    echo -e "${YELLOW}⏳ Stack Status: $STACK_STATUS${NC}"
    echo "   Backend deployment is in progress..."
else
    echo -e "${RED}❌ Stack Status: $STACK_STATUS${NC}"
fi

echo "   Last Updated: $LAST_UPDATED"
echo ""

# Check for recent stack events
echo "Recent stack events:"
aws cloudformation describe-stack-events \
    --stack-name "$STACK_NAME" \
    --max-items 5 \
    --query "StackEvents[*].{Time:Timestamp,Status:ResourceStatus,Resource:LogicalResourceId}" \
    --output table 2>/dev/null || echo "   Could not fetch stack events"

echo ""

# 3. Check Lambda Functions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Lambda Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LAMBDA_COUNT=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, 'EnergyInsights-development')].FunctionName" \
    --output text 2>/dev/null | wc -w)

echo -e "${GREEN}✅ Lambda Functions: $LAMBDA_COUNT deployed${NC}"

# Check last update time of a key Lambda
CHAT_LAMBDA_UPDATED=$(aws lambda get-function \
    --function-name EnergyInsights-development-chat \
    --query "Configuration.LastModified" \
    --output text 2>/dev/null || echo "N/A")

echo "   Chat Lambda last updated: $CHAT_LAMBDA_UPDATED"
echo ""

# 4. Check Frontend (S3 + CloudFront)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Frontend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check S3 bucket
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text 2>/dev/null)

if [ -n "$BUCKET_NAME" ]; then
    INDEX_MODIFIED=$(aws s3api head-object \
        --bucket "$BUCKET_NAME" \
        --key index.html \
        --query "LastModified" \
        --output text 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}✅ S3 Bucket: $BUCKET_NAME${NC}"
    echo "   index.html last modified: $INDEX_MODIFIED"
else
    echo -e "${RED}❌ Could not find S3 bucket${NC}"
fi

echo ""

# Check CloudFront invalidations
echo "CloudFront invalidations (last 3):"
aws cloudfront list-invalidations \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --max-items 3 \
    --query "InvalidationList.Items[*].{Id:Id,Status:Status,CreateTime:CreateTime}" \
    --output table 2>/dev/null || echo "   Could not fetch invalidations"

echo ""

# 5. Test Frontend Accessibility
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Frontend Accessibility Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible: $FRONTEND_URL${NC}"
    echo "   HTTP Status: $HTTP_CODE"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
    echo "   HTTP Status: $HTTP_CODE"
fi

echo ""

# 6. Test API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. API Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null)

if [ "$API_HTTP_CODE" = "200" ] || [ "$API_HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ API responding: $API_URL${NC}"
    echo "   HTTP Status: $API_HTTP_CODE"
else
    echo -e "${YELLOW}⚠️  API response: HTTP $API_HTTP_CODE${NC}"
fi

echo ""

# 7. Check Recent CloudWatch Logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Recent Lambda Errors (if any)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for errors in last 5 minutes
START_TIME=$(($(date +%s) - 300))000
ERROR_COUNT=$(aws logs filter-log-events \
    --log-group-name "/aws/lambda/EnergyInsights-development-chat" \
    --start-time "$START_TIME" \
    --filter-pattern "ERROR" \
    --query "length(events)" \
    --output text 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" = "0" ]; then
    echo -e "${GREEN}✅ No recent errors in Lambda logs${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ERROR_COUNT error(s) in last 5 minutes${NC}"
    echo "   Check logs: aws logs tail /aws/lambda/EnergyInsights-development-chat --follow"
fi

echo ""

# 8. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Determine overall status
if [ "$STACK_STATUS" = "UPDATE_IN_PROGRESS" ]; then
    echo -e "${YELLOW}⏳ DEPLOYMENT IN PROGRESS${NC}"
    echo ""
    echo "Your deployment is currently running. This typically takes 10-20 minutes."
    echo ""
    echo "To monitor:"
    echo "  - GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/' 2>/dev/null || echo 'YOUR_REPO')/actions"
    echo "  - Run this script again: bash scripts/check-deployment-status.sh"
    echo ""
elif [ "$STACK_STATUS" = "UPDATE_COMPLETE" ] && [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
    echo ""
    echo "Your application is deployed and accessible:"
    echo "  - Frontend: $FRONTEND_URL"
    echo "  - API: $API_URL"
    echo ""
    echo "Stack last updated: $LAST_UPDATED"
    echo ""
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT STATUS UNCLEAR${NC}"
    echo ""
    echo "Check GitHub Actions for detailed status:"
    echo "  https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/' 2>/dev/null || echo 'YOUR_REPO')/actions"
    echo ""
fi

# 9. Next Steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$STACK_STATUS" = "UPDATE_IN_PROGRESS" ]; then
    echo "1. Wait for deployment to complete (~10-20 minutes)"
    echo "2. Run this script again to check status"
    echo "3. Monitor GitHub Actions for detailed progress"
elif [ "$STACK_STATUS" = "UPDATE_COMPLETE" ] && [ "$HTTP_CODE" = "200" ]; then
    echo "1. Test your application: $FRONTEND_URL"
    echo "2. Verify features are working correctly"
    echo "3. Check CloudWatch logs if you see any issues"
else
    echo "1. Check GitHub Actions for error details"
    echo "2. Review CloudWatch logs for Lambda errors"
    echo "3. Run: aws cloudformation describe-stack-events --stack-name $STACK_NAME"
fi

echo ""
echo "=========================================="
echo ""
