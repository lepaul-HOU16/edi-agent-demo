#!/bin/bash

echo "=========================================="
echo "Verify New Deletion Code is Deployed"
echo "=========================================="
echo ""

LAMBDA_NAME="amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh"

echo "Instructions:"
echo "1. Delete a project in the UI"
echo "2. Wait 5 seconds"
echo "3. This script will check the logs"
echo ""
read -p "Press ENTER after you've deleted a project..."

echo ""
echo "Checking logs for new code signature..."
echo ""

# Check for the new log message
aws logs tail "/aws/lambda/$LAMBDA_NAME" --since 30s --format short 2>/dev/null | grep "⚡️ NEW CODE v2.0 ⚡️"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NEW CODE IS DEPLOYED AND RUNNING!"
    echo ""
    echo "Now checking if deletion actually works..."
    echo ""
    
    # Check for ProjectLifecycleManager logs
    aws logs tail "/aws/lambda/$LAMBDA_NAME" --since 30s --format short 2>/dev/null | grep -i "ProjectLifecycleManager\|Deleting project metadata"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ProjectLifecycleManager is being called"
        echo ""
        echo "The code is correct. If deletion still doesn't work, check:"
        echo "1. Are there any errors in the logs above?"
        echo "2. Is the project name correct?"
        echo "3. Check S3 to see if the file was actually deleted"
    else
        echo ""
        echo "⚠️  ProjectLifecycleManager logs not found"
        echo "The new code is running but may have hit an error before reaching ProjectLifecycleManager"
        echo ""
        echo "Full logs:"
        aws logs tail "/aws/lambda/$LAMBDA_NAME" --since 30s --format short 2>/dev/null
    fi
else
    echo ""
    echo "❌ OLD CODE IS STILL RUNNING"
    echo ""
    echo "The deployment did NOT update the Lambda code."
    echo ""
    echo "This is an Amplify Gen 2 deployment issue. Try:"
    echo ""
    echo "Option 1: Force rebuild by clearing cache"
    echo "  rm -rf .amplify/artifacts"
    echo "  rm -rf .amplify/tsconfig.tsbuildinfo"
    echo "  rm -rf node_modules/.cache"
    echo "  Stop sandbox (Ctrl+C)"
    echo "  npx ampx sandbox"
    echo ""
    echo "Option 2: Check if there's a build error"
    echo "  Look at the sandbox terminal output for TypeScript errors"
    echo ""
    echo "Option 3: Check the function definition"
    echo "  The function might be defined in multiple places"
    echo "  Check amplify/data/resource.ts vs amplify/functions/renewableTools/resource.ts"
fi

echo ""
