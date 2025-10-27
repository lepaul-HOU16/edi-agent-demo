#!/bin/bash

# Task 6 Manual Testing Runner
# Executes all manual validation tests for terrain query routing fix

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║           TASK 6: MANUAL TESTING AND VALIDATION                           ║"
echo "║           Terrain Query Routing Fix                                       ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if sandbox is running
echo "🔍 Checking if sandbox is running..."
if ! aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text &> /dev/null; then
    echo "❌ ERROR: Cannot connect to AWS Lambda"
    echo ""
    echo "Please ensure:"
    echo "  1. Sandbox is running: npx ampx sandbox"
    echo "  2. AWS credentials are configured"
    echo ""
    exit 1
fi

ORCHESTRATOR_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -n 1)

if [ -z "$ORCHESTRATOR_FUNCTION" ]; then
    echo "❌ ERROR: Orchestrator Lambda function not found"
    echo ""
    echo "Please ensure sandbox is running: npx ampx sandbox"
    echo ""
    exit 1
fi

echo "✅ Found orchestrator function: $ORCHESTRATOR_FUNCTION"
echo ""

# Set environment variable
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME="$ORCHESTRATOR_FUNCTION"

# Run automated tests
echo "🚀 Running automated tests..."
echo ""

node tests/manual/test-terrain-routing-manual.js

# Capture exit code
TEST_EXIT_CODE=$?

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Review test results above"
    echo "  2. Perform manual validation in UI (optional)"
    echo "  3. Mark Task 6 complete in tasks.md"
    echo "  4. Proceed to Task 7 (Deploy and monitor)"
    echo ""
else
    echo "❌ Some tests failed"
    echo ""
    echo "Action required:"
    echo "  1. Review failed test details above"
    echo "  2. Check CloudWatch logs for pattern matching"
    echo "  3. Verify pattern fixes in projectListHandler.ts"
    echo "  4. Re-run tests after fixes"
    echo ""
fi

exit $TEST_EXIT_CODE
