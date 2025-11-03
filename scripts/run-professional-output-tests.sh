#!/bin/bash

# Professional Output Quality Test Runner
# This script runs all professional output validation tests
# Requirements: 12.3, 12.4, 12.5

echo "🔍 Professional Output Quality Validation Test Suite"
echo "=================================================="

# Check if renewable integration is enabled
if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" != "true" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_RENEWABLE_ENABLED is not set to 'true'"
    echo "⚠️  Some tests may be skipped. Set environment variable to run all tests."
    echo ""
fi

# Set test timeout
export TEST_TIMEOUT=120000

echo "📋 Running Professional Output Validation Tests..."
echo ""

# 1. Run TypeScript integration tests
echo "1️⃣  Running Export Validation Tests..."
npm test -- tests/integration/renewable-export-validation.test.ts --testTimeout=$TEST_TIMEOUT
EXPORT_TEST_EXIT_CODE=$?

echo ""
echo "2️⃣  Running Performance Validation Tests..."
npm test -- tests/integration/renewable-performance-validation.test.ts --testTimeout=$TEST_TIMEOUT
PERFORMANCE_TEST_EXIT_CODE=$?

echo ""
echo "3️⃣  Running Demo Workflow Validation Tests..."
npm test -- tests/integration/renewable-demo-workflow-validation.test.ts --testTimeout=$TEST_TIMEOUT
WORKFLOW_TEST_EXIT_CODE=$?

echo ""
echo "4️⃣  Running Professional Output Quality Script..."
node tests/validate-professional-output-quality.js
QUALITY_TEST_EXIT_CODE=$?

echo ""
echo "=================================================="
echo "📊 Test Results Summary"
echo "=================================================="

# Check individual test results
if [ $EXPORT_TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Export Validation Tests: PASSED"
else
    echo "❌ Export Validation Tests: FAILED"
fi

if [ $PERFORMANCE_TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Performance Validation Tests: PASSED"
else
    echo "❌ Performance Validation Tests: FAILED"
fi

if [ $WORKFLOW_TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Demo Workflow Validation Tests: PASSED"
else
    echo "❌ Demo Workflow Validation Tests: FAILED"
fi

if [ $QUALITY_TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Professional Output Quality: PASSED"
else
    echo "❌ Professional Output Quality: FAILED"
fi

# Calculate overall result
TOTAL_TESTS=4
PASSED_TESTS=0

[ $EXPORT_TEST_EXIT_CODE -eq 0 ] && ((PASSED_TESTS++))
[ $PERFORMANCE_TEST_EXIT_CODE -eq 0 ] && ((PASSED_TESTS++))
[ $WORKFLOW_TEST_EXIT_CODE -eq 0 ] && ((PASSED_TESTS++))
[ $QUALITY_TEST_EXIT_CODE -eq 0 ] && ((PASSED_TESTS++))

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo ""
echo "📈 Overall Results:"
echo "   Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "   Success Rate: $SUCCESS_RATE%"

if [ $SUCCESS_RATE -ge 75 ]; then
    echo "🏆 PROFESSIONAL OUTPUT QUALITY: VALIDATED ✅"
    echo "   Results are suitable for stakeholder demonstrations"
    EXIT_CODE=0
else
    echo "⚠️  PROFESSIONAL OUTPUT QUALITY: NEEDS IMPROVEMENT ❌"
    echo "   Results require enhancement before stakeholder presentations"
    EXIT_CODE=1
fi

echo ""
echo "📄 Detailed reports available in:"
echo "   - tests/professional-output-validation-report.json"
echo "   - Jest test output above"

echo ""
echo "💡 Next Steps:"
if [ $EXIT_CODE -eq 0 ]; then
    echo "   ✅ Professional output validation complete"
    echo "   ✅ Ready for stakeholder demonstrations"
    echo "   ✅ Export functionality validated"
    echo "   ✅ Data integrity confirmed"
else
    echo "   🔧 Review failed test cases above"
    echo "   🔧 Improve professional formatting where needed"
    echo "   🔧 Enhance export functionality"
    echo "   🔧 Validate data integrity issues"
fi

exit $EXIT_CODE