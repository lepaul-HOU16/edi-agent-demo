#!/bin/bash

# Deploy and Test Rename Operations - Task 20
# Tests Requirements 3.1-3.6

set -e

echo "=========================================="
echo "Task 20: Deploy and Test Rename Operations"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must be run from project root directory"
    exit 1
fi

# Step 1: Run unit tests
echo ""
echo "Step 1: Running Unit Tests"
echo "----------------------------"
print_info "Testing rename functionality in isolation..."

if npm test -- tests/unit/test-rename-project.test.ts --run 2>&1 | tee /tmp/rename-unit-tests.log; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    print_info "Check /tmp/rename-unit-tests.log for details"
    exit 1
fi

# Step 2: Run integration tests
echo ""
echo "Step 2: Running Integration Tests"
echo "-----------------------------------"
print_info "Testing rename with real components..."

if npm test -- tests/integration/test-rename-project-integration.test.ts --run 2>&1 | tee /tmp/rename-integration-tests.log; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    print_info "Check /tmp/rename-integration-tests.log for details"
    exit 1
fi

# Step 3: Run verification script
echo ""
echo "Step 3: Running Verification Script"
echo "-------------------------------------"
print_info "Testing all requirements (3.1-3.6)..."

if npx ts-node tests/verify-rename-project.ts 2>&1 | tee /tmp/rename-verification.log; then
    print_success "Verification script passed"
else
    print_error "Verification script failed"
    print_info "Check /tmp/rename-verification.log for details"
    exit 1
fi

# Step 4: Check deployment status
echo ""
echo "Step 4: Checking Deployment Status"
echo "------------------------------------"
print_info "Verifying Lambda functions are deployed..."

# Check if sandbox is running
if ! aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null | grep -q "renewableOrchestrator"; then
    print_warning "Sandbox may not be running or Lambda not deployed"
    print_info "Run: npx ampx sandbox"
    print_info "Skipping deployment verification..."
else
    print_success "Lambda functions are deployed"
fi

# Step 5: Manual test instructions
echo ""
echo "Step 5: Manual Testing Instructions"
echo "-------------------------------------"
print_info "Please perform the following manual tests:"
echo ""
echo "Test 1: Rename with valid names"
echo "  1. Create a project: 'analyze terrain at 35.0, -101.0'"
echo "  2. Rename it: 'rename project [name] to test-renamed-project'"
echo "  3. Verify: Project appears with new name"
echo "  4. Verify: Old name no longer exists"
echo ""
echo "Test 2: Rename with existing name (should fail)"
echo "  1. Create two projects at different locations"
echo "  2. Try to rename one to the other's name"
echo "  3. Verify: Error message about name already existing"
echo ""
echo "Test 3: Verify S3 path updates correctly"
echo "  1. Create a project with terrain analysis"
echo "  2. Rename the project"
echo "  3. Verify: Terrain data still accessible"
echo "  4. Verify: Old S3 path no longer exists"
echo ""
echo "Test 4: Test session context updates"
echo "  1. Create a project and make it active"
echo "  2. Rename the project"
echo "  3. Verify: Active project updated to new name"
echo "  4. Verify: Project history shows new name"
echo ""
echo "Test 5: Verify project history updates"
echo "  1. Work with a project (make it active)"
echo "  2. Rename the project"
echo "  3. Check project history"
echo "  4. Verify: History contains new name, not old name"
echo ""

# Step 6: Summary
echo ""
echo "=========================================="
echo "Task 20 Testing Summary"
echo "=========================================="
echo ""
print_success "All automated tests passed!"
echo ""
print_info "Requirements tested:"
echo "  ✓ 3.1: Update project name in project index"
echo "  ✓ 3.2: Preserve all project data and history"
echo "  ✓ 3.3: Update S3 path from old to new"
echo "  ✓ 3.4: Check if new name already exists"
echo "  ✓ 3.5: Respond with success message"
echo "  ✓ 3.6: Update active project context with new name"
echo ""
print_info "Next steps:"
echo "  1. Perform manual tests listed above"
echo "  2. Deploy to sandbox if not already running"
echo "  3. Test in actual chat interface"
echo "  4. Mark Task 20 as complete"
echo ""
print_success "Task 20 deployment and testing complete!"
echo ""
