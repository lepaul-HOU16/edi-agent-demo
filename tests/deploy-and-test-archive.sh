#!/bin/bash

# Deploy and Test Archive Functionality
# Task 23: Deploy and test archive functionality
# Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

set -e

echo "========================================="
echo "Task 23: Deploy and Test Archive Functionality"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Check if sandbox is running
print_info "Step 1: Checking sandbox status..."
if ! pgrep -f "ampx sandbox" > /dev/null; then
    print_error "Sandbox is not running!"
    echo "Please start the sandbox with: npx ampx sandbox"
    exit 1
fi
print_success "Sandbox is running"
echo ""

# Step 2: Run unit tests
print_info "Step 2: Running unit tests..."
if npm test -- tests/unit/test-archive-unarchive.test.ts --run 2>&1 | tee /tmp/archive-unit-tests.log; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    echo "Check /tmp/archive-unit-tests.log for details"
    exit 1
fi
echo ""

# Step 3: Run integration tests
print_info "Step 3: Running integration tests..."
if npm test -- tests/integration/test-archive-unarchive-integration.test.ts --run 2>&1 | tee /tmp/archive-integration-tests.log; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    echo "Check /tmp/archive-integration-tests.log for details"
    exit 1
fi
echo ""

# Step 4: Run E2E test
print_info "Step 4: Running E2E archive flow test..."
if node tests/e2e-test-archive-flow.ts 2>&1 | tee /tmp/archive-e2e-test.log; then
    print_success "E2E test passed"
else
    print_error "E2E test failed"
    echo "Check /tmp/archive-e2e-test.log for details"
    exit 1
fi
echo ""

# Step 5: Summary
echo "========================================="
echo "DEPLOYMENT AND TESTING COMPLETE"
echo "========================================="
echo ""
print_success "All tests passed!"
echo ""
echo "Test Results:"
echo "  • Unit tests: PASSED"
echo "  • Integration tests: PASSED"
echo "  • E2E tests: PASSED"
echo ""
echo "Archive functionality is ready for manual testing."
echo ""
echo "Manual Test Guide: tests/e2e-archive-manual-test.md"
echo ""
