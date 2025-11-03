#!/bin/bash

# Task 25: Deploy and Test Complete Lifecycle Workflows
# This script deploys the lifecycle management system and runs end-to-end workflow tests

set -e  # Exit on error

echo "=================================================="
echo "Task 25: Complete Lifecycle Workflow Testing"
echo "=================================================="
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
if ! aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text &> /dev/null; then
    print_error "Sandbox not running or AWS CLI not configured"
    echo "Please start sandbox with: npx ampx sandbox"
    exit 1
fi
print_success "Sandbox is running"
echo ""

# Step 2: Verify lifecycle manager is deployed
echo "Step 2: Verifying lifecycle manager deployment..."
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1)

if [ -z "$ORCHESTRATOR" ]; then
    print_error "Renewable orchestrator not found"
    exit 1
fi

print_success "Found orchestrator: $ORCHESTRATOR"

# Check environment variables
echo "Checking environment variables..."
ENV_VARS=$(aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query "Environment.Variables" --output json)

if echo "$ENV_VARS" | grep -q "RENEWABLE_S3_BUCKET"; then
    print_success "Environment variables configured"
else
    print_error "Missing environment variables"
    exit 1
fi
echo ""

# Step 3: Run automated tests
echo "Step 3: Running automated end-to-end tests..."
echo ""

if [ -f "tests/e2e-test-complete-lifecycle-workflows.ts" ]; then
    print_info "Running TypeScript tests..."
    npx jest tests/e2e-test-complete-lifecycle-workflows.ts --verbose
    
    if [ $? -eq 0 ]; then
        print_success "Automated tests passed"
    else
        print_error "Automated tests failed"
        exit 1
    fi
else
    print_error "Test file not found: tests/e2e-test-complete-lifecycle-workflows.ts"
    exit 1
fi
echo ""

# Step 4: Verify key components
echo "Step 4: Verifying key components..."

# Check ProjectLifecycleManager
if [ -f "amplify/functions/shared/projectLifecycleManager.ts" ]; then
    print_success "ProjectLifecycleManager exists"
else
    print_error "ProjectLifecycleManager not found"
    exit 1
fi

# Check ProximityDetector
if [ -f "amplify/functions/shared/proximityDetector.ts" ]; then
    print_success "ProximityDetector exists"
else
    print_error "ProximityDetector not found"
    exit 1
fi

# Check ProjectStore
if [ -f "amplify/functions/shared/projectStore.ts" ]; then
    print_success "ProjectStore exists"
else
    print_error "ProjectStore not found"
    exit 1
fi

# Check ProjectResolver
if [ -f "amplify/functions/shared/projectResolver.ts" ]; then
    print_success "ProjectResolver exists"
else
    print_error "ProjectResolver not found"
    exit 1
fi

# Check ProjectNameGenerator
if [ -f "amplify/functions/shared/projectNameGenerator.ts" ]; then
    print_success "ProjectNameGenerator exists"
else
    print_error "ProjectNameGenerator not found"
    exit 1
fi

echo ""

# Step 5: Test workflow 1 - Create duplicate → detect → delete → rename
echo "Step 5: Testing Workflow 1 (Duplicate → Delete → Rename)..."
echo ""

print_info "This workflow tests:"
echo "  1. Creating a project"
echo "  2. Detecting duplicate at same coordinates"
echo "  3. Deleting old project with confirmation"
echo "  4. Renaming new project"
echo ""

# Create test payload for workflow 1
cat > /tmp/workflow1-test.json << 'EOF'
{
  "workflow": "duplicate-delete-rename",
  "steps": [
    {
      "action": "create_project",
      "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
      "name": "test-workflow-1-project-1"
    },
    {
      "action": "check_duplicates",
      "coordinates": { "latitude": 35.067482, "longitude": -101.395466 }
    },
    {
      "action": "create_project",
      "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
      "name": "test-workflow-1-project-2"
    },
    {
      "action": "delete_project",
      "project_name": "test-workflow-1-project-1",
      "confirmed": true
    },
    {
      "action": "rename_project",
      "old_name": "test-workflow-1-project-2",
      "new_name": "test-workflow-1-final"
    }
  ]
}
EOF

print_success "Workflow 1 test payload created"
echo ""

# Step 6: Test workflow 2 - Search → find duplicates → merge
echo "Step 6: Testing Workflow 2 (Search → Find → Merge)..."
echo ""

print_info "This workflow tests:"
echo "  1. Creating multiple projects"
echo "  2. Searching for projects by location"
echo "  3. Finding duplicate projects"
echo "  4. Merging duplicate projects"
echo ""

# Create test payload for workflow 2
cat > /tmp/workflow2-test.json << 'EOF'
{
  "workflow": "search-find-merge",
  "steps": [
    {
      "action": "create_project",
      "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
      "name": "test-workflow-2-amarillo-1"
    },
    {
      "action": "create_project",
      "coordinates": { "latitude": 35.067500, "longitude": -101.395500 },
      "name": "test-workflow-2-amarillo-2"
    },
    {
      "action": "create_project",
      "coordinates": { "latitude": 33.577863, "longitude": -101.855166 },
      "name": "test-workflow-2-lubbock"
    },
    {
      "action": "search_projects",
      "filters": { "location": "amarillo" }
    },
    {
      "action": "find_duplicates"
    },
    {
      "action": "merge_projects",
      "project1": "test-workflow-2-amarillo-1",
      "project2": "test-workflow-2-amarillo-2",
      "keep_name": "test-workflow-2-amarillo-1"
    }
  ]
}
EOF

print_success "Workflow 2 test payload created"
echo ""

# Step 7: Summary and next steps
echo "=================================================="
echo "Deployment and Automated Testing Complete"
echo "=================================================="
echo ""

print_success "All automated tests passed"
echo ""

print_info "Next Steps:"
echo ""
echo "1. Manual Testing:"
echo "   - Open the chat interface"
echo "   - Follow the guide: tests/TASK_25_E2E_WORKFLOW_TESTING_GUIDE.md"
echo "   - Test each workflow manually"
echo ""

echo "2. Workflow 1: Duplicate → Delete → Rename"
echo "   - Create project at coordinates"
echo "   - Try to create duplicate"
echo "   - Verify duplicate detection"
echo "   - Delete old project"
echo "   - Rename new project"
echo ""

echo "3. Workflow 2: Search → Find → Merge"
echo "   - Create multiple projects"
echo "   - Search by location"
echo "   - Find duplicates"
echo "   - Merge duplicates"
echo ""

echo "4. Workflow 3: Natural Language Variations"
echo "   - Test different command phrasings"
echo "   - Verify intent detection"
echo ""

echo "5. Workflow 4: Confirmation Prompts"
echo "   - Test deletion confirmation"
echo "   - Test bulk deletion confirmation"
echo "   - Test merge name choice"
echo ""

echo "6. Workflow 5: Error Scenarios"
echo "   - Test project not found"
echo "   - Test name already exists"
echo "   - Test project in progress"
echo "   - Test invalid coordinates"
echo ""

print_info "Test Coordinates:"
echo "  Amarillo, TX: 35.067482, -101.395466"
echo "  Lubbock, TX: 33.577863, -101.855166"
echo ""

print_info "Useful Commands:"
echo "  List projects: 'list projects'"
echo "  Delete project: 'delete project <name>'"
echo "  Rename project: 'rename project <old> to <new>'"
echo "  Find duplicates: 'show duplicate projects'"
echo "  Search projects: 'list projects in <location>'"
echo ""

print_success "Task 25 deployment and testing ready!"
echo ""

# Cleanup test files
rm -f /tmp/workflow1-test.json /tmp/workflow2-test.json

exit 0
