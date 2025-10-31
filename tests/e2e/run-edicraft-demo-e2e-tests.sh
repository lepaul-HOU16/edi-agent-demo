#!/bin/bash

# EDIcraft Demo Enhancement E2E Test Runner
# Runs all end-to-end tests for the demo enhancements

set -e

echo "========================================="
echo "EDIcraft Demo Enhancement E2E Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test file
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${YELLOW}Running: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if npm test -- "$test_file" --silent; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo "Starting E2E test suite..."
echo ""

# Run E2E tests
run_test "tests/e2e/test-edicraft-demo-complete-workflow.e2e.test.ts" "Complete Demo Workflow"
run_test "tests/e2e/test-edicraft-demo-multi-canvas.e2e.test.ts" "Multi-Canvas Workflow"
run_test "tests/e2e/test-edicraft-demo-response-formatting.e2e.test.ts" "Response Formatting"
run_test "tests/e2e/test-edicraft-demo-clear-button.e2e.test.ts" "Clear Button Workflow"

# Print summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo "========================================="

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some E2E tests failed!${NC}"
    exit 1
fi
