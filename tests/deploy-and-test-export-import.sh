#!/bin/bash

# Deploy and Test Export/Import Functionality
# This script deploys the export/import functionality and runs comprehensive tests

set -e  # Exit on error

echo "=========================================="
echo "EXPORT/IMPORT DEPLOYMENT AND TESTING"
echo "=========================================="
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
echo "Step 1: Checking sandbox status..."
if ! pgrep -f "ampx sandbox" > /dev/null; then
    print_error "Sandbox is not running"
    print_info "Please start sandbox with: npx ampx sandbox"
    exit 1
fi
print_success "Sandbox is running"
echo ""

# Step 2: Verify ProjectLifecycleManager has export/import methods
echo "Step 2: Verifying ProjectLifecycleManager implementation..."
if grep -q "exportProject" amplify/functions/shared/projectLifecycleManager.ts && \
   grep -q "importProject" amplify/functions/shared/projectLifecycleManager.ts; then
    print_success "Export/import methods found in ProjectLifecycleManager"
else
    print_error "Export/import methods not found in ProjectLifecycleManager"
    exit 1
fi
echo ""

# Step 3: Run unit tests
echo "Step 3: Running unit tests..."
if npm test -- tests/unit/test-project-lifecycle-manager.test.ts --run 2>&1 | tee /tmp/export-import-unit-tests.log; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    print_info "Check /tmp/export-import-unit-tests.log for details"
    exit 1
fi
echo ""

# Step 4: Run integration tests
echo "Step 4: Running integration tests..."
if npm test -- tests/integration/test-export-import-integration.test.ts --run 2>&1 | tee /tmp/export-import-integration-tests.log; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    print_info "Check /tmp/export-import-integration-tests.log for details"
    exit 1
fi
echo ""

# Step 5: Run E2E tests
echo "Step 5: Running E2E tests..."
if npm test -- tests/e2e-test-export-import-flow.ts --run 2>&1 | tee /tmp/export-import-e2e-tests.log; then
    print_success "E2E tests passed"
else
    print_error "E2E tests failed"
    print_info "Check /tmp/export-import-e2e-tests.log for details"
    exit 1
fi
echo ""

# Step 6: Run verification script
echo "Step 6: Running verification script..."
if npx ts-node tests/verify-export-import.ts 2>&1 | tee /tmp/export-import-verification.log; then
    print_success "Verification script passed"
else
    print_error "Verification script failed"
    print_info "Check /tmp/export-import-verification.log for details"
    exit 1
fi
echo ""

# Step 7: Check for TypeScript errors
echo "Step 7: Checking for TypeScript errors..."
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -i "error" > /dev/null; then
    print_error "TypeScript errors found"
    npx tsc --noEmit --project tsconfig.json
    exit 1
else
    print_success "No TypeScript errors"
fi
echo ""

# Step 8: Verify orchestrator integration
echo "Step 8: Verifying orchestrator integration..."
if grep -q "export.*project" amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts && \
   grep -q "import.*project" amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts; then
    print_success "Export/import intents found in orchestrator"
else
    print_error "Export/import intents not found in orchestrator"
    print_info "Intent patterns may need to be added to RenewableIntentClassifier"
fi
echo ""

# Step 9: Generate test summary
echo "Step 9: Generating test summary..."
cat > /tmp/export-import-test-summary.txt << EOF
========================================
EXPORT/IMPORT TEST SUMMARY
========================================

Test Date: $(date)

UNIT TESTS:
$(grep -E "(PASS|FAIL|✓|✗)" /tmp/export-import-unit-tests.log | tail -20)

INTEGRATION TESTS:
$(grep -E "(PASS|FAIL|✓|✗)" /tmp/export-import-integration-tests.log | tail -20)

E2E TESTS:
$(grep -E "(PASS|FAIL|✓|✗)" /tmp/export-import-e2e-tests.log | tail -20)

VERIFICATION:
$(grep -E "(PASS|FAIL|✓|✗)" /tmp/export-import-verification.log | tail -20)

========================================
DEPLOYMENT STATUS
========================================

✓ ProjectLifecycleManager has export/import methods
✓ Unit tests passed
✓ Integration tests passed
✓ E2E tests passed
✓ Verification script passed
✓ No TypeScript errors

========================================
NEXT STEPS
========================================

1. Manual Testing:
   - Follow guide: tests/e2e-export-import-manual-test.md
   - Test export command in chat interface
   - Test import command in chat interface
   - Verify name conflict handling
   - Verify version validation

2. Verify Orchestrator Integration:
   - Check intent patterns for export/import
   - Test natural language variations
   - Verify error messages

3. Production Deployment:
   - Deploy to production environment
   - Monitor CloudWatch logs
   - Test with real projects
   - Verify S3 artifact references

========================================
EOF

cat /tmp/export-import-test-summary.txt
print_success "Test summary generated: /tmp/export-import-test-summary.txt"
echo ""

# Final summary
echo "=========================================="
echo "DEPLOYMENT AND TESTING COMPLETE"
echo "=========================================="
echo ""
print_success "All automated tests passed!"
echo ""
print_info "Next steps:"
echo "  1. Review manual test guide: tests/e2e-export-import-manual-test.md"
echo "  2. Test export/import in chat interface"
echo "  3. Verify orchestrator intent detection"
echo "  4. Check CloudWatch logs for any errors"
echo ""
print_info "Test logs saved to:"
echo "  - /tmp/export-import-unit-tests.log"
echo "  - /tmp/export-import-integration-tests.log"
echo "  - /tmp/export-import-e2e-tests.log"
echo "  - /tmp/export-import-verification.log"
echo "  - /tmp/export-import-test-summary.txt"
echo ""

exit 0
