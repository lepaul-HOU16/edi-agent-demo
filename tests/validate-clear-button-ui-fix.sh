#!/bin/bash

# Validate Clear Button UI Duplication Fix
# This script runs all tests related to the clear button UI fix

echo "=========================================="
echo "Clear Button UI Duplication Fix Validation"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
  local test_name=$1
  local test_file=$2
  
  echo "Running: $test_name"
  echo "----------------------------------------"
  
  if node "$test_file"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
  fi
  
  echo ""
}

# Run tests
run_test "Clear Button UI Fix" "tests/test-clear-button-ui-fix.js"
run_test "Multiple Clear Operations" "tests/test-clear-button-multiple-operations.js"

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "The clear button UI duplication fix is complete and validated."
  echo ""
  echo "Changes implemented:"
  echo "  1. Enhanced clear confirmation detection in isEDIcraftResponse()"
  echo "  2. Added unique CSS classes to all EDIcraft response types"
  echo "  3. Added data-content-hash attribute for duplicate prevention"
  echo "  4. Synchronized detection logic between ChatMessage and EDIcraftResponseComponent"
  echo "  5. Improved clear confirmation pattern matching"
  echo ""
  echo "Next steps:"
  echo "  1. Test in browser with actual clear operations"
  echo "  2. Verify no duplicate buttons appear in chat"
  echo "  3. Verify responses render correctly with Cloudscape components"
  echo "  4. Test with multiple sequential clear operations"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Please review the test output above and fix any issues."
  exit 1
fi
