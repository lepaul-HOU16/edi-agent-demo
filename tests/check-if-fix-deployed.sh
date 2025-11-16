#!/bin/bash

echo "=========================================="
echo "Checking if Deletion Fix is Deployed"
echo "=========================================="
echo ""

# Try to delete a test project and check logs for new code
LAMBDA_NAME="amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh"

echo "Step 1: Check Lambda last modified time"
LAST_MODIFIED=$(aws lambda get-function --function-name "$LAMBDA_NAME" 2>/dev/null | jq -r '.Configuration.LastModified')
echo "Lambda last modified: $LAST_MODIFIED"
echo ""

echo "Step 2: Trigger a deletion and check logs"
echo "Please delete a project in the UI now..."
echo "Waiting 10 seconds for you to click delete..."
sleep 10

echo ""
echo "Step 3: Check recent logs for new code signatures"
echo "Looking for: 'ProjectLifecycleManager' or 'Deleting project metadata'"
echo ""

aws logs tail "/aws/lambda/$LAMBDA_NAME" --since 30s --format short 2>/dev/null | grep -i "ProjectLifecycleManager\|Deleting project metadata\|renewableTools.*Deleting"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NEW CODE IS DEPLOYED"
    echo "The fix is deployed and running."
    echo ""
    echo "If deletion still doesn't work, there's a different issue."
else
    echo ""
    echo "❌ OLD CODE IS STILL RUNNING"
    echo "The fix has NOT been deployed yet."
    echo ""
    echo "You need to restart the sandbox:"
    echo "  1. Stop sandbox (Ctrl+C)"
    echo "  2. Run: npx ampx sandbox"
    echo "  3. Wait for 'Deployed' message"
    echo "  4. Try deletion again"
fi

echo ""
