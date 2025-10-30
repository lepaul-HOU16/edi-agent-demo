#!/bin/bash
# Master test runner for trajectory coordinate conversion fix
# Runs all tests in sequence for Task 5

set -e  # Exit on first failure

echo "================================================================================"
echo "TRAJECTORY COORDINATE CONVERSION - COMPLETE TEST SUITE"
echo "================================================================================"
echo ""
echo "This test suite validates the complete fix for trajectory coordinate conversion."
echo "It tests all requirements from the specification:"
echo "  - Requirements 1.1, 1.2: OSDU data retrieval"
echo "  - Requirements 2.1, 2.2: Data parsing and validation"
echo "  - Requirements 3.4, 3.5: Coordinate transformation"
echo "  - Requirements 1.5, 3.5: End-to-end workflow"
echo ""
echo "================================================================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: python3 not found"
    echo "   Please install Python 3 to run these tests"
    exit 1
fi

# Check if edicraft-agent directory exists
if [ ! -d "edicraft-agent" ]; then
    echo "❌ ERROR: edicraft-agent directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Make test files executable
chmod +x tests/test-osdu-data-retrieval.py
chmod +x tests/test-data-parsing.py
chmod +x tests/test-coordinate-transformation.py
chmod +x tests/test-well005-complete-workflow.py

echo "================================================================================"
echo "TEST 5.1: OSDU Data Retrieval"
echo "================================================================================"
echo ""

python3 tests/test-osdu-data-retrieval.py
TEST_5_1_RESULT=$?

echo ""
echo "================================================================================"
echo "TEST 5.2: Data Parsing"
echo "================================================================================"
echo ""

python3 tests/test-data-parsing.py
TEST_5_2_RESULT=$?

echo ""
echo "================================================================================"
echo "TEST 5.3: Coordinate Transformation"
echo "================================================================================"
echo ""

python3 tests/test-coordinate-transformation.py
TEST_5_3_RESULT=$?

echo ""
echo "================================================================================"
echo "TEST 5.4: Complete Workflow End-to-End"
echo "================================================================================"
echo ""

python3 tests/test-well005-complete-workflow.py
TEST_5_4_RESULT=$?

echo ""
echo "================================================================================"
echo "FINAL TEST SUMMARY"
echo "================================================================================"
echo ""

# Calculate results
TOTAL_TESTS=4
PASSED_TESTS=0

if [ $TEST_5_1_RESULT -eq 0 ]; then
    echo "✅ TEST 5.1: OSDU Data Retrieval - PASSED"
    ((PASSED_TESTS++))
else
    echo "❌ TEST 5.1: OSDU Data Retrieval - FAILED"
fi

if [ $TEST_5_2_RESULT -eq 0 ]; then
    echo "✅ TEST 5.2: Data Parsing - PASSED"
    ((PASSED_TESTS++))
else
    echo "❌ TEST 5.2: Data Parsing - FAILED"
fi

if [ $TEST_5_3_RESULT -eq 0 ]; then
    echo "✅ TEST 5.3: Coordinate Transformation - PASSED"
    ((PASSED_TESTS++))
else
    echo "❌ TEST 5.3: Coordinate Transformation - FAILED"
fi

if [ $TEST_5_4_RESULT -eq 0 ]; then
    echo "✅ TEST 5.4: Complete Workflow - PASSED"
    ((PASSED_TESTS++))
else
    echo "❌ TEST 5.4: Complete Workflow - FAILED"
fi

echo ""
echo "Results: $PASSED_TESTS/$TOTAL_TESTS tests passed"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "================================================================================"
    echo "✅ ALL TESTS PASSED"
    echo "================================================================================"
    echo ""
    echo "The trajectory coordinate conversion fix is working correctly!"
    echo ""
    echo "Verified functionality:"
    echo "  ✅ OSDU data retrieval returns structured JSON (Req 1.1, 1.2)"
    echo "  ✅ Data parser detects and validates formats (Req 2.1, 2.2)"
    echo "  ✅ Coordinate transformation works correctly (Req 3.4, 3.5)"
    echo "  ✅ Complete workflow executes successfully (Req 1.5, 3.5)"
    echo "  ✅ No JSON parsing errors occur"
    echo ""
    echo "Task 5: Test with WELL-005 data - ✅ COMPLETE"
    echo ""
    echo "================================================================================"
    echo ""
    exit 0
else
    echo "================================================================================"
    echo "❌ SOME TESTS FAILED"
    echo "================================================================================"
    echo ""
    echo "Failed tests: $((TOTAL_TESTS - PASSED_TESTS))/$TOTAL_TESTS"
    echo ""
    echo "Please review the test output above for details on failures."
    echo ""
    echo "================================================================================"
    echo ""
    exit 1
fi
