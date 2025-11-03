#!/bin/bash

echo "=========================================="
echo "TESTING DOCKER IMAGE CONTENTS"
echo "=========================================="
echo ""

# This script tests if all required files are in the Lambda Docker image
# by invoking the Lambda with a test that imports all modules

LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

if [ -z "$LAMBDA_NAME" ]; then
    echo "❌ Simulation Lambda not found"
    exit 1
fi

echo "Testing Lambda: $LAMBDA_NAME"
echo ""

# Create a test payload that will trigger all imports
TEST_PAYLOAD='{
  "action": "wind_rose",
  "parameters": {
    "project_id": "docker-test",
    "latitude": 35.0,
    "longitude": -101.0,
    "wind_speed": 8.5
  }
}'

echo "Invoking Lambda to test imports..."
RESULT=$(aws lambda invoke \
    --function-name "$LAMBDA_NAME" \
    --payload "$TEST_PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/docker-test-output.json 2>&1)

echo ""

# Check for specific error types
if echo "$RESULT" | grep -q "InvalidEntrypoint"; then
    echo "❌ FAILED: InvalidEntrypoint error"
    echo ""
    echo "This means Python can't load the handler module."
    echo "Likely causes:"
    echo "  - Missing Python files in Docker image"
    echo "  - Python syntax errors"
    echo "  - Missing dependencies"
    echo ""
    echo "Check CloudWatch logs:"
    echo "  aws logs tail /aws/lambda/$LAMBDA_NAME --since 2m"
    exit 1
fi

# Check the response
if [ -f /tmp/docker-test-output.json ]; then
    # Check for import errors in the response
    if grep -q "ImportError\|ModuleNotFoundError" /tmp/docker-test-output.json; then
        echo "❌ FAILED: Import error detected"
        echo ""
        echo "Missing module:"
        grep -o "No module named '[^']*'" /tmp/docker-test-output.json || echo "See full error below"
        echo ""
        cat /tmp/docker-test-output.json | python3 -m json.tool 2>/dev/null
        exit 1
    fi
    
    # Check for success
    if grep -q '"success"[[:space:]]*:[[:space:]]*true' /tmp/docker-test-output.json; then
        echo "✅ SUCCESS: All modules loaded correctly!"
        echo ""
        echo "Docker image contains all required files:"
        echo "  ✓ handler.py"
        echo "  ✓ visualization_generator.py"
        echo "  ✓ wind_client.py"
        echo "  ✓ matplotlib_generator.py"
        echo "  ✓ folium_generator.py"
        echo "  ✓ visualization_config.py"
        echo ""
        echo "Response preview:"
        cat /tmp/docker-test-output.json | python3 -m json.tool 2>/dev/null | head -30
        exit 0
    else
        echo "⚠️  Lambda responded but analysis failed"
        echo ""
        echo "Full response:"
        cat /tmp/docker-test-output.json | python3 -m json.tool 2>/dev/null
        exit 1
    fi
else
    echo "❌ FAILED: No response file created"
    echo ""
    echo "Lambda invocation result:"
    echo "$RESULT"
    exit 1
fi

