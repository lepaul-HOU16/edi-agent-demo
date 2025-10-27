#!/bin/bash

###############################################################################
# Run All Strands Agent Tests
#
# This script runs the complete Strands Agent test suite in the correct order:
# 1. Cold start performance test
# 2. Warm start performance test
# 3. Individual agent tests
# 4. Orchestration tests
# 5. Fallback mechanism tests
#
# Usage:
#   ./tests/run-all-strands-tests.sh
#
# Options:
#   --skip-cold-start    Skip cold start test (if already tested)
#   --skip-warm-start    Skip warm start test
#   --skip-agents        Skip individual agent tests
#   --skip-orchestration Skip orchestration tests
#   --skip-fallback      Skip fallback tests
#   --fast               Skip cold/warm start tests (run only functional tests)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Parse command line arguments
SKIP_COLD_START=false
SKIP_WARM_START=false
SKIP_AGENTS=false
SKIP_ORCHESTRATION=false
SKIP_FALLBACK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-cold-start)
      SKIP_COLD_START=true
      shift
      ;;
    --skip-warm-start)
      SKIP_WARM_START=true
      shift
      ;;
    --skip-agents)
      SKIP_AGENTS=true
      shift
      ;;
    --skip-orchestration)
      SKIP_ORCHESTRATION=true
      shift
      ;;
    --skip-fallback)
      SKIP_FALLBACK=true
      shift
      ;;
    --fast)
      SKIP_COLD_START=true
      SKIP_WARM_START=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Function to run a test
run_test() {
  local test_name=$1
  local test_script=$2
  local skip=$3
  
  if [ "$skip" = true ]; then
    echo -e "${YELLOW}⏭️  Skipping: $test_name${NC}"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
    return 0
  fi
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Running: $test_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if node "$test_script"; then
    echo ""
    echo -e "${GREEN}✅ PASSED: $test_name${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo ""
    echo -e "${RED}❌ FAILED: $test_name${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Print header
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         Strands Agent Comprehensive Test Suite                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "This test suite verifies:"
echo "  • Cold start performance (< 5 minutes)"
echo "  • Warm start performance (< 30 seconds)"
echo "  • Individual agent functionality (terrain, layout, simulation, report)"
echo "  • Multi-agent orchestration"
echo "  • Graceful fallback mechanism"
echo ""

# Check if tests directory exists
if [ ! -d "tests" ]; then
  echo -e "${RED}Error: tests directory not found${NC}"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Check if test files exist
REQUIRED_TESTS=(
  "tests/test-strands-cold-start.js"
  "tests/test-strands-warm-start.js"
  "tests/test-strands-all-agents.js"
  "tests/test-strands-orchestration.js"
  "tests/test-strands-fallback.js"
)

for test_file in "${REQUIRED_TESTS[@]}"; do
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}Error: Required test file not found: $test_file${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✅ All test files found${NC}"
echo ""

# Run tests in order
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting Test Execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Cold Start Performance
run_test "Cold Start Performance Test" "tests/test-strands-cold-start.js" $SKIP_COLD_START
COLD_START_RESULT=$?

# Test 2: Warm Start Performance
run_test "Warm Start Performance Test" "tests/test-strands-warm-start.js" $SKIP_WARM_START
WARM_START_RESULT=$?

# Test 3: Individual Agents
run_test "Individual Agent Tests" "tests/test-strands-all-agents.js" $SKIP_AGENTS
AGENTS_RESULT=$?

# Test 4: Orchestration
run_test "Orchestration Tests" "tests/test-strands-orchestration.js" $SKIP_ORCHESTRATION
ORCHESTRATION_RESULT=$?

# Test 5: Fallback Mechanism
run_test "Fallback Mechanism Tests" "tests/test-strands-fallback.js" $SKIP_FALLBACK
FALLBACK_RESULT=$?

# Print summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Tests:   $TESTS_RUN"
echo -e "${GREEN}Passed:        $TESTS_PASSED${NC}"
echo -e "${RED}Failed:        $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped:       $TESTS_SKIPPED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  SUCCESS_RATE=100
else
  SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TESTS_RUN ))
fi

echo "Success Rate:  $SUCCESS_RATE%"
echo ""

# Individual test results
echo "Individual Results:"
echo ""

if [ "$SKIP_COLD_START" = false ]; then
  if [ $COLD_START_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Cold Start Performance${NC}"
  else
    echo -e "  ${RED}❌ Cold Start Performance${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Cold Start Performance (skipped)${NC}"
fi

if [ "$SKIP_WARM_START" = false ]; then
  if [ $WARM_START_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Warm Start Performance${NC}"
  else
    echo -e "  ${RED}❌ Warm Start Performance${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Warm Start Performance (skipped)${NC}"
fi

if [ "$SKIP_AGENTS" = false ]; then
  if [ $AGENTS_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Individual Agents${NC}"
  else
    echo -e "  ${RED}❌ Individual Agents${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Individual Agents (skipped)${NC}"
fi

if [ "$SKIP_ORCHESTRATION" = false ]; then
  if [ $ORCHESTRATION_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Orchestration${NC}"
  else
    echo -e "  ${RED}❌ Orchestration${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Orchestration (skipped)${NC}"
fi

if [ "$SKIP_FALLBACK" = false ]; then
  if [ $FALLBACK_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Fallback Mechanism${NC}"
  else
    echo -e "  ${RED}❌ Fallback Mechanism${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Fallback Mechanism (skipped)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Final assessment
if [ $TESTS_FAILED -eq 0 ] && [ $TESTS_RUN -gt 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo ""
  echo "🎉 Strands Agent system is working correctly!"
  echo ""
  echo "Next steps:"
  echo "  • Deploy to production"
  echo "  • Enable Strands agents in orchestrator"
  echo "  • Monitor performance in production"
  echo "  • Set up CloudWatch alarms"
  exit 0
elif [ $TESTS_RUN -eq 0 ]; then
  echo -e "${YELLOW}⚠️  NO TESTS RUN${NC}"
  echo ""
  echo "All tests were skipped. Run without skip flags to execute tests."
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Failed tests need to be fixed before deployment."
  echo ""
  echo "Troubleshooting:"
  echo "  • Review test output above for error details"
  echo "  • Check CloudWatch logs for Lambda errors"
  echo "  • Verify environment variables are set correctly"
  echo "  • Run individual tests for more detailed output"
  exit 1
fi
