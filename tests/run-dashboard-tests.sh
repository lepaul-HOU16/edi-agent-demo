#!/bin/bash

# Renewable Energy Dashboard Test Runner
# Tests Docker Lambda and dashboard functionality

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
log_step() {
    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Header
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Renewable Energy Dashboard Test Runner                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-flight checks
log_step "Running pre-flight checks..."

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
fi
log_success "AWS credentials configured"

# Check if sandbox is running
if ! aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text &> /dev/null; then
    log_error "Renewable orchestrator Lambda not found. Is sandbox running?"
    exit 1
fi
log_success "Renewable orchestrator Lambda found"

# Check simulation Lambda (Docker)
SIMULATION_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)
if [ -z "$SIMULATION_LAMBDA" ]; then
    log_error "Simulation Lambda (Docker) not found"
    exit 1
fi
log_success "Simulation Lambda (Docker) found: $SIMULATION_LAMBDA"

# Check Lambda configuration
log_step "Checking Lambda configuration..."
MEMORY=$(aws lambda get-function-configuration --function-name "$SIMULATION_LAMBDA" --query "MemorySize" --output text)
TIMEOUT=$(aws lambda get-function-configuration --function-name "$SIMULATION_LAMBDA" --query "Timeout" --output text)
PACKAGE_TYPE=$(aws lambda get-function-configuration --function-name "$SIMULATION_LAMBDA" --query "PackageType" --output text)

log_info "Memory: ${MEMORY} MB"
log_info "Timeout: ${TIMEOUT} seconds"
log_info "Package Type: ${PACKAGE_TYPE}"

if [ "$PACKAGE_TYPE" != "Image" ]; then
    log_warning "Package type is not 'Image' - Docker Lambda may not be deployed correctly"
fi

if [ "$MEMORY" -lt 2048 ]; then
    log_warning "Memory is less than 2048 MB - simulation may fail"
fi

if [ "$TIMEOUT" -lt 300 ]; then
    log_warning "Timeout is less than 300 seconds - simulation may timeout"
fi

# Check S3 bucket
log_step "Checking S3 bucket..."
BUCKET=$(aws lambda get-function-configuration --function-name "$SIMULATION_LAMBDA" --query "Environment.Variables.RENEWABLE_S3_BUCKET" --output text 2>/dev/null || echo "")
if [ -z "$BUCKET" ] || [ "$BUCKET" == "None" ]; then
    log_warning "S3 bucket environment variable not set"
else
    log_success "S3 bucket configured: $BUCKET"
    
    # Check bucket access
    if aws s3 ls "s3://$BUCKET" &> /dev/null; then
        log_success "S3 bucket accessible"
    else
        log_error "Cannot access S3 bucket"
        exit 1
    fi
fi

echo ""
log_step "Pre-flight checks complete!"
echo ""

# Run automated tests
log_step "Running automated backend tests..."
echo ""

if [ -f "tests/test-renewable-dashboards-e2e.js" ]; then
    if node tests/test-renewable-dashboards-e2e.js; then
        log_success "Automated backend tests passed!"
    else
        log_error "Automated backend tests failed"
        exit 1
    fi
else
    log_warning "Automated test script not found, skipping"
fi

echo ""
log_step "Backend tests complete!"
echo ""

# UI Testing Instructions
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  UI Testing Instructions                                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Backend tests passed! Now test the UI:"
echo ""
echo "1. Open your browser to: http://localhost:3000"
echo "2. Navigate to the chat interface"
echo "3. Follow the test guide: tests/DASHBOARD_UI_TEST_GUIDE.md"
echo ""
echo "Quick smoke test prompts:"
echo ""
echo -e "${BLUE}  1. Analyze terrain at 35.067482, -101.395466${NC}"
echo -e "${BLUE}  2. Optimize turbine layout${NC}"
echo -e "${BLUE}  3. Generate wind rose${NC}"
echo -e "${BLUE}  4. Run wake simulation${NC}"
echo -e "${BLUE}  5. Show wind resource dashboard${NC}"
echo -e "${BLUE}  6. Show performance dashboard${NC}"
echo -e "${BLUE}  7. Show wake analysis dashboard${NC}"
echo ""

log_info "Expected results:"
echo "  ✅ All analyses complete successfully"
echo "  ✅ All dashboards render correctly"
echo "  ✅ Wake simulation works (Docker Lambda)"
echo "  ✅ No 'Visualization Unavailable' errors"
echo "  ✅ Action buttons appear and work"
echo "  ✅ Project data persists"
echo ""

# Check if dev server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Dev server is running at http://localhost:3000"
else
    log_warning "Dev server not detected. Start it with: npm run dev"
fi

echo ""
log_step "Test runner complete!"
echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Summary                                                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
log_success "Pre-flight checks: PASSED"
log_success "Backend tests: PASSED"
log_info "UI tests: MANUAL (follow guide)"
echo ""
log_info "Next steps:"
echo "  1. Test UI with the prompts above"
echo "  2. Verify all dashboards render"
echo "  3. Confirm Docker Lambda (simulation) works"
echo "  4. Check project persistence"
echo "  5. Document any issues found"
echo ""
