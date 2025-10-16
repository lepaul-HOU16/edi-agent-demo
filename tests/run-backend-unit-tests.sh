#!/bin/bash

# Backend Unit Tests Runner
# Runs all backend unit tests for Wells Equipment Dashboard
# Requirements: 9.1, 9.2

echo "🧪 Running Backend Unit Tests for Wells Equipment Dashboard"
echo "============================================================"
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
  
  if npx ts-node "$test_file"; then
    echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
    ((PASSED_TESTS++))
  else
    echo -e "${RED}❌ FAILED: ${test_name}${NC}"
    ((FAILED_TESTS++))
  fi
  
  ((TOTAL_TESTS++))
  echo ""
}

# Run all backend unit tests
echo "📦 Phase 1: Database Query Optimization Tests"
echo "----------------------------------------------"
run_test "tests/test-database-query-optimization.ts" "Database Query Optimization"

echo "📦 Phase 2: Well Analysis Engine Tests"
echo "--------------------------------------"
run_test "tests/test-well-analysis-engine-comprehensive.ts" "Well Analysis Engine Comprehensive"

echo "📦 Phase 3: Artifact Generation and Caching Tests"
echo "------------------------------------------------"
run_test "tests/test-artifact-generation-and-caching.ts" "Artifact Generation and Caching"

echo "📦 Phase 4: Integration Tests"
echo "----------------------------"
run_test "tests/test-well-data-service.ts" "Well Data Service"
run_test "tests/test-well-analysis-engine.ts" "Well Analysis Engine"
run_test "tests/test-caching-layer.ts" "Caching Layer"
run_test "tests/test-enhanced-equipment-status-handler.ts" "Enhanced Equipment Status Handler"
run_test "tests/test-consolidated-dashboard-artifact.ts" "Consolidated Dashboard Artifact"

# Summary
echo "============================================================"
echo "📊 Test Summary"
echo "============================================================"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi
