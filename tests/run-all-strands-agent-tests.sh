#!/bin/bash

# Master test runner for Strands Agent Integration
# Runs all tests for Tasks 5-11

echo "🚀 Starting Complete Strands Agent Integration Test Suite"
echo "=========================================================="
echo ""

# Track overall results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo "📋 Running: $test_name"
    echo "-----------------------------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo "✅ $test_name: PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ $test_name: FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Task 5: Test Individual Agents
run_test "Task 5: Individual Agent Tests" "node tests/test-individual-agents.js"

# Task 6: Test Multi-Agent Orchestration
run_test "Task 6: Multi-Agent Orchestration" "node tests/test-multi-agent-orchestration.js"

# Task 7: Test Artifact Generation and Storage
run_test "Task 7: Artifact Generation & Storage" "node tests/test-artifact-generation-storage.js"

# Task 8: Test Extended Thinking Display
run_test "Task 8: Extended Thinking Display" "node tests/test-extended-thinking-display.js"

# Print final summary
echo "=========================================================="
echo "📊 FINAL TEST SUMMARY"
echo "=========================================================="
echo ""
echo "Total Tests Run: $TOTAL_TESTS"
echo "✅ Passed: $PASSED_TESTS"
echo "❌ Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Strands Agent Integration: COMPLETE"
    exit 0
else
    echo "⚠️  Some tests failed. Please review the output above."
    echo "❌ Strands Agent Integration: NEEDS ATTENTION"
    exit 1
fi
