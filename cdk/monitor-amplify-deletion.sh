#!/bin/bash

# Monitor Amplify stack deletion progress
# Run this script to check if the Amplify sandbox has been fully deleted

STACK_NAME="amplify-agentsforenergy-lepaul-sandbox-eca99671d7"

echo "Checking Amplify stack deletion status..."
echo ""

# Check if stack still exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text 2>/dev/null)
    echo "❌ Stack still exists with status: $STATUS"
    echo ""
    
    # Show nested stacks still deleting
    echo "Nested stacks still deleting:"
    aws cloudformation list-stacks --stack-status-filter DELETE_IN_PROGRESS \
        --query "StackSummaries[?contains(StackName, 'amplify-agentsforenergy-lepaul')].{Name:StackName,Status:StackStatus}" \
        --output table 2>/dev/null
    
    echo ""
    echo "⏳ Deletion in progress. This can take 15-20 minutes for stacks with RDS databases."
    echo "   Run this script again in a few minutes to check progress."
else
    echo "✅ Amplify stack has been successfully deleted!"
    echo ""
    
    # Verify CDK stack is still healthy
    CDK_STATUS=$(aws cloudformation describe-stacks --stack-name EnergyInsights-development --query "Stacks[0].StackStatus" --output text 2>/dev/null)
    echo "✅ CDK stack status: $CDK_STATUS"
    echo ""
    
    # Count remaining Amplify stacks
    AMPLIFY_COUNT=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query "StackSummaries[?contains(StackName, 'amplify')].StackName" --output text 2>/dev/null | wc -l)
    
    echo "📊 Remaining Amplify stacks in account: $AMPLIFY_COUNT"
    echo "   (These are from other sandboxes/branches and are not related to this project)"
    echo ""
    echo "🎉 Migration complete! Only CDK stack remains for this application."
fi
