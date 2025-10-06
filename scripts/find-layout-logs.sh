#!/bin/bash

echo "🔍 Finding Layout Lambda Function Logs..."
echo "========================================"

# Find all Lambda functions with 'layout' in the name
echo "1. Searching for layout Lambda functions..."
aws lambda list-functions --query 'Functions[?contains(FunctionName, `layout`)].FunctionName' --output table

echo ""
echo "2. Searching for renewable Lambda functions..."
aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewable`)].FunctionName' --output table

echo ""
echo "3. Searching for all Amplify Lambda functions..."
aws lambda list-functions --query 'Functions[?contains(FunctionName, `amplify`)].FunctionName' --output table

echo ""
echo "4. Finding corresponding log groups..."
echo "Searching for log groups with 'layout' in the name:"
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `layout`)].logGroupName' --output table

echo ""
echo "Searching for log groups with 'renewable' in the name:"
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `renewable`)].logGroupName' --output table

echo ""
echo "5. Recent log groups (last 24 hours):"
aws logs describe-log-groups --query 'logGroups[?creationTime > `'$(date -d '1 day ago' +%s)'000`].[logGroupName, creationTime]' --output table

echo ""
echo "🎯 Next steps:"
echo "1. Look for a function name containing 'layout' or 'renewable'"
echo "2. Use that function name to find logs:"
echo "   aws logs tail /aws/lambda/FUNCTION_NAME --follow"
echo ""
echo "3. Or check recent logs:"
echo "   aws logs filter-log-events --log-group-name '/aws/lambda/FUNCTION_NAME' --start-time \$(date -d '10 minutes ago' +%s)000"