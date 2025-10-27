#!/bin/bash

# Deploy Layout S3 Persistence Fix
# This script deploys the updated layout handler with complete S3 persistence

set -e

echo "🚀 Deploying Layout S3 Persistence Fix"
echo "========================================"
echo ""

# Check if sandbox is running
echo "📍 Checking sandbox status..."
SANDBOX_PID=$(ps aux | grep "ampx sandbox" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$SANDBOX_PID" ]; then
    echo "❌ Sandbox is not running"
    echo "   Please start sandbox with: npx ampx sandbox"
    exit 1
fi

echo "✅ Sandbox is running (PID: $SANDBOX_PID)"
echo ""

# The sandbox should auto-detect changes and redeploy
echo "📍 Waiting for sandbox to detect changes..."
echo "   (This may take 30-60 seconds)"
echo ""

# Wait for deployment
sleep 30

# Check if Lambda was updated
echo "📍 Checking Lambda update status..."
LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text)

if [ -z "$LAMBDA_NAME" ]; then
    echo "❌ Layout Lambda not found"
    exit 1
fi

echo "✅ Found Lambda: $LAMBDA_NAME"

# Get last modified time
LAST_MODIFIED=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.LastModified" --output text)
echo "   Last Modified: $LAST_MODIFIED"
echo ""

# Run verification test
echo "📍 Running verification test..."
echo ""
node tests/verify-layout-s3-persistence.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ DEPLOYMENT AND VERIFICATION COMPLETE"
    echo "========================================"
    echo ""
    echo "Layout S3 persistence is now working!"
    echo "Wake simulation can retrieve layout data from S3."
else
    echo ""
    echo "========================================"
    echo "❌ VERIFICATION FAILED"
    echo "========================================"
    echo ""
    echo "Please check the error messages above."
    exit 1
fi
