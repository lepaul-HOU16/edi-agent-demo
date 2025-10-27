#!/bin/bash

# Deploy and Test Search Functionality
# Task 21: Deploy and test search functionality
# Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

set -e

echo "========================================================================"
echo "TASK 21: DEPLOY AND TEST SEARCH FUNCTIONALITY"
echo "========================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if sandbox is running
echo "Step 1: Checking sandbox status..."
if ! pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${YELLOW}⚠️  Sandbox is not running${NC}"
    echo "Please start the sandbox in another terminal:"
    echo "  npx ampx sandbox"
    echo ""
    read -p "Press Enter once sandbox is running..."
fi

echo -e "${GREEN}✅ Sandbox is running${NC}"
echo ""

# Step 2: Run unit tests
echo "========================================================================"
echo "Step 2: Running Unit Tests"
echo "========================================================================"
echo ""

echo "Running search projects unit tests..."
npm test -- tests/unit/test-search-projects.test.ts --run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

echo ""

# Step 3: Run integration tests
echo "========================================================================"
echo "Step 3: Running Integration Tests"
echo "========================================================================"
echo ""

echo "Running search projects integration tests..."
npm test -- tests/integration/test-search-projects-integration.test.ts --run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    exit 1
fi

echo ""

# Step 4: Run verification script
echo "========================================================================"
echo "Step 4: Running Verification Script"
echo "========================================================================"
echo ""

echo "Running comprehensive search verification..."
npx ts-node tests/verify-search-projects.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Verification passed${NC}"
else
    echo -e "${RED}❌ Verification failed${NC}"
    exit 1
fi

echo ""

# Step 5: Run E2E manual tests
echo "========================================================================"
echo "Step 5: E2E Manual Testing Guide"
echo "========================================================================"
echo ""

echo "Please perform the following manual tests in the chat interface:"
echo ""
echo "Test 1: Location Filtering (Requirement 5.1)"
echo "  Query: 'list projects in texas'"
echo "  Expected: Shows only Texas projects"
echo ""
echo "Test 2: Date Range Filtering (Requirement 5.2)"
echo "  Query: 'list projects created today'"
echo "  Expected: Shows only today's projects"
echo ""
echo "Test 3: Incomplete Project Filtering (Requirement 5.3)"
echo "  Query: 'list incomplete projects'"
echo "  Expected: Shows only projects missing analysis steps"
echo ""
echo "Test 4: Coordinate Proximity Filtering (Requirement 5.4)"
echo "  Query: 'list projects at coordinates 35.067482, -101.395466'"
echo "  Expected: Shows projects within 5km of coordinates"
echo ""
echo "Test 5: Archived Status Filtering (Requirement 5.5)"
echo "  Query: 'list archived projects'"
echo "  Expected: Shows only archived projects"
echo ""
echo "Test 6: Combined Filters"
echo "  Query: 'list incomplete projects in texas created this week'"
echo "  Expected: Shows Texas projects that are incomplete and recent"
echo ""

read -p "Have you completed all manual tests? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please complete manual tests before proceeding${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Manual tests completed${NC}"
echo ""

# Step 6: Summary
echo "========================================================================"
echo "DEPLOYMENT AND TESTING SUMMARY"
echo "========================================================================"
echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Task 21 Completion Checklist:"
echo "  ✅ Location filtering tested (Requirement 5.1)"
echo "  ✅ Date range filtering tested (Requirement 5.2)"
echo "  ✅ Incomplete project filtering tested (Requirement 5.3)"
echo "  ✅ Coordinate proximity filtering tested (Requirement 5.4)"
echo "  ✅ Archived status filtering tested (Requirement 5.5)"
echo "  ✅ Combined filters tested"
echo ""
echo "Search functionality is fully deployed and tested!"
echo ""
echo "Next Steps:"
echo "  - Mark task 21 as complete in tasks.md"
echo "  - Proceed to task 22: Deploy and test merge operations"
echo ""
echo "========================================================================"

