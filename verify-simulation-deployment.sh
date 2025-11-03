#!/bin/bash

echo "=========================================="
echo "VERIFYING SIMULATION LAMBDA DEPLOYMENT"
echo "=========================================="
echo ""

# Get Lambda name
LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

if [ -z "$LAMBDA_NAME" ]; then
    echo "❌ Simulation Lambda not found"
    exit 1
fi

echo "Found Lambda: $LAMBDA_NAME"
echo ""

# Check last modified time
LAST_MODIFIED=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.LastModified' --output text)
echo "Last Modified: $LAST_MODIFIED"
echo ""

# Check if it's using Docker
PACKAGE_TYPE=$(aws lambda get-function-configuration --function-name "$LAMBDA_NAME" --query 'PackageType' --output text)
echo "Package Type: $PACKAGE_TYPE"

if [ "$PACKAGE_TYPE" != "Image" ]; then
    echo "⚠️  Warning: Expected Docker image deployment"
fi
echo ""

# Try to invoke with a simple test
echo "Testing Lambda invocation..."
RESULT=$(aws lambda invoke \
    --function-name "$LAMBDA_NAME" \
    --payload '{"action":"wind_rose","parameters":{"project_id":"test","latitude":35.0,"longitude":-101.0}}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/lambda-test-output.json 2>&1)

# Check for errors
if echo "$RESULT" | grep -q "InvalidEntrypoint"; then
    echo "❌ DEPLOYMENT NOT COMPLETE - Still getting InvalidEntrypoint error"
    echo ""
    echo "Action Required:"
    echo "1. Ensure sandbox is running: npx ampx sandbox"
    echo "2. Wait for 'Deployed' message"
    echo "3. Run this script again"
    exit 1
elif echo "$RESULT" | grep -q "StatusCode.*200"; then
    echo "✅ Lambda is responding!"
    echo ""
    
    # Check the response
    if [ -f /tmp/lambda-test-output.json ]; then
        SUCCESS=$(cat /tmp/lambda-test-output.json | grep -o '"success"[[:space:]]*:[[:space:]]*true' || echo "")
        if [ -n "$SUCCESS" ]; then
            echo "✅ Wind rose analysis successful!"
            echo ""
            echo "Response preview:"
            cat /tmp/lambda-test-output.json | python3 -m json.tool 2>/dev/null | head -20
        else
            echo "⚠️  Lambda responded but analysis may have failed"
            echo ""
            echo "Response:"
            cat /tmp/lambda-test-output.json | python3 -m json.tool 2>/dev/null
        fi
    fi
else
    echo "⚠️  Unexpected response:"
    echo "$RESULT"
fi

echo ""
echo "=========================================="
echo "Run full test suite with:"
echo "  bash tests/test-wind-rose.sh"
echo "=========================================="

