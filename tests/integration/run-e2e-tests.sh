#!/bin/bash

# End-to-End Integration Test Runner
# Runs comprehensive integration tests for renewable project persistence

set -e

echo "========================================="
echo "End-to-End Integration Test Runner"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

echo -e "${YELLOW}Running end-to-end integration tests...${NC}"
echo ""

# Run the integration test
npx jest tests/integration/test-e2e-workflow.test.ts --verbose --runInBand

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ All integration tests passed!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Integration tests failed${NC}"
    echo -e "${RED}=========================================${NC}"
    exit 1
fi
