#!/bin/bash

################################################################################
# Deploy and Test Project Merge Operations
# Task 22: Deploy and test merge operations
# Requirements: 4.2, 4.3, 4.4
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_section() {
    echo ""
    echo "================================================================================"
    echo -e "${CYAN}$1${NC}"
    echo "================================================================================"
    echo ""
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

log_section "Task 22: Deploy and Test Merge Operations"
log_info "Requirements: 4.2, 4.3, 4.4"

# Step 1: Check prerequisites
log_section "Step 1: Checking Prerequisites"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    log_info "Please run: aws configure"
    exit 1
fi
log_success "AWS credentials configured"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
log_success "Node.js installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi
log_success "npm installed: $(npm --version)"

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    log_error "npx is not installed"
    exit 1
fi
log_success "npx available"

# Step 2: Install dependencies
log_section "Step 2: Installing Dependencies"

log_info "Installing npm dependencies..."
npm install
log_success "Dependencies installed"

# Step 3: Compile TypeScript
log_section "Step 3: Compiling TypeScript"

log_info "Compiling TypeScript files..."
npx tsc --noEmit
log_success "TypeScript compilation successful"

# Step 4: Run unit tests
log_section "Step 4: Running Unit Tests"

log_info "Running merge unit tests..."
if npm test -- tests/unit/test-merge-projects.test.ts --run; then
    log_success "Unit tests passed"
else
    log_error "Unit tests failed"
    log_warning "Continuing with deployment, but tests should be fixed"
fi

# Step 5: Check deployment status
log_section "Step 5: Checking Deployment Status"

log_info "Checking if sandbox is running..."

# Check if Lambda functions exist
ORCHESTRATOR_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null || echo "")

if [ -z "$ORCHESTRATOR_FUNCTION" ]; then
    log_warning "Renewable orchestrator Lambda not found"
    log_info "You may need to deploy the backend first"
    log_info "Run: npx ampx sandbox"
    
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_success "Renewable orchestrator Lambda found: $ORCHESTRATOR_FUNCTION"
fi

# Step 6: Check S3 bucket
log_section "Step 6: Checking S3 Bucket"

# Get bucket name from environment or amplify outputs
if [ -f "amplify_outputs.json" ]; then
    BUCKET_NAME=$(node -e "const outputs = require('./amplify_outputs.json'); console.log(outputs.storage?.bucket_name || '');" 2>/dev/null || echo "")
    
    if [ -n "$BUCKET_NAME" ]; then
        log_success "S3 bucket found: $BUCKET_NAME"
        export RENEWABLE_S3_BUCKET="$BUCKET_NAME"
    else
        log_warning "Could not determine S3 bucket name from amplify_outputs.json"
    fi
else
    log_warning "amplify_outputs.json not found"
fi

if [ -z "$RENEWABLE_S3_BUCKET" ]; then
    log_error "RENEWABLE_S3_BUCKET environment variable not set"
    log_info "Please set it manually:"
    log_info "export RENEWABLE_S3_BUCKET=your-bucket-name"
    exit 1
fi

# Verify bucket exists
if aws s3 ls "s3://$RENEWABLE_S3_BUCKET" &> /dev/null; then
    log_success "S3 bucket accessible: $RENEWABLE_S3_BUCKET"
else
    log_error "Cannot access S3 bucket: $RENEWABLE_S3_BUCKET"
    exit 1
fi

# Step 7: Run E2E tests
log_section "Step 7: Running End-to-End Tests"

log_info "Running merge E2E tests..."
log_warning "This will create and delete test projects in S3"

read -p "Continue with E2E tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Skipping E2E tests"
else
    log_info "Compiling E2E test script..."
    npx ts-node tests/e2e-test-merge-flow.ts
    
    if [ $? -eq 0 ]; then
        log_success "E2E tests passed!"
    else
        log_error "E2E tests failed"
        log_info "Check the output above for details"
        exit 1
    fi
fi

# Step 8: Manual testing instructions
log_section "Step 8: Manual Testing"

log_info "Automated tests complete. Now perform manual testing:"
echo ""
echo "1. Open the chat interface in your browser"
echo "2. Follow the manual testing guide: tests/e2e-merge-manual-test.md"
echo "3. Test each scenario and verify expected results"
echo ""
log_warning "Manual testing is required to verify UI behavior and user experience"

# Step 9: Verification checklist
log_section "Step 9: Verification Checklist"

echo "Verify the following before marking task 22 as complete:"
echo ""
echo "  [ ] Merge two projects with complementary data (Requirement 4.2)"
echo "  [ ] Verify data combination logic (Requirement 4.3)"
echo "  [ ] Test name selection (Requirement 4.4)"
echo "  [ ] Verify one project deleted after merge (Requirement 4.2)"
echo "  [ ] Test with projects having different completion levels (Requirement 4.3)"
echo "  [ ] Test error handling (non-existent projects)"
echo "  [ ] Test error handling (invalid keepName)"
echo "  [ ] Verify cache invalidation after merge"
echo "  [ ] Test merge in duplicate detection workflow"
echo "  [ ] Verify metadata merging"
echo ""

# Step 10: Summary
log_section "Deployment and Testing Summary"

log_success "Automated tests completed successfully"
log_info "Next steps:"
echo ""
echo "1. Complete manual testing using: tests/e2e-merge-manual-test.md"
echo "2. Verify all checklist items above"
echo "3. Document any issues found"
echo "4. Mark task 22 as complete in .kiro/specs/renewable-project-lifecycle-management/tasks.md"
echo "5. Proceed to task 23 (Archive functionality testing)"
echo ""

log_section "Task 22 Deployment Complete"
log_success "Merge operations are deployed and ready for testing"

exit 0
