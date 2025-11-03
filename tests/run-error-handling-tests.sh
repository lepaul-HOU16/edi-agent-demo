#!/bin/bash
# Master test runner for trajectory error handling validation
# Tests Requirements 2.2, 2.3, 2.4, 2.5

echo "================================================================================"
echo "TRAJECTORY ERROR HANDLING TEST SUITE"
echo "================================================================================"
echo ""
echo "This test suite validates error handling for the trajectory coordinate"
echo "conversion system, covering:"
echo "  - Invalid trajectory IDs (Req 2.4, 2.5)"
echo "  - Malformed data (Req 2.2, 2.3, 2.4)"
echo "  - Authentication failures (Req 2.5)"
echo ""
echo "================================================================================"
echo ""

# Track overall results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo ""
    echo "--------------------------------------------------------------------------------"
    echo "Running: $test_name"
    echo "--------------------------------------------------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if python3 "$test_script"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "✅ $test_name: PASSED"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "❌ $test_name: FAILED"
    fi
}

# Run all error handling tests
run_test "Invalid Trajectory ID Tests" "tests/test-error-invalid-trajectory-id.py"
run_test "Malformed Data Tests" "tests/test-error-malformed-data.py"
run_test "Authentication Failure Tests" "tests/test-error-authentication.py"

# Print final summary
echo ""
echo "================================================================================"
echo "FINAL TEST SUMMARY"
echo "================================================================================"
echo ""
echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ ALL ERROR HANDLING TESTS PASSED"
    echo ""
    echo "The trajectory coordinate conversion system properly handles:"
    echo "  ✅ Invalid trajectory IDs with clear error messages"
    echo "  ✅ Malformed JSON and missing required fields"
    echo "  ✅ Non-numeric values and wrong data structures"
    echo "  ✅ Authentication failures with user-friendly messages"
    echo "  ✅ Network errors without crashes"
    echo ""
    echo "Requirements validated:"
    echo "  ✅ 2.2 - Data validation for required fields"
    echo "  ✅ 2.3 - Error logging with input data format"
    echo "  ✅ 2.4 - Clear error messages for parsing failures"
    echo "  ✅ 2.5 - Context about which step failed and why"
    echo ""
    echo "================================================================================"
    exit 0
else
    echo "❌ SOME ERROR HANDLING TESTS FAILED"
    echo ""
    echo "Please review the test output above to identify issues."
    echo "Error handling needs improvement in the failed areas."
    echo ""
    echo "================================================================================"
    exit 1
fi
