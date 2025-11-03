#!/bin/bash

###############################################################################
# Renewable Energy End-to-End Test Runner
# 
# This script runs automated tests for the renewable energy workflow.
# It validates all features including project persistence, action buttons,
# dashboards, and chain of thought display.
#
# Usage: ./tests/run-renewable-e2e-tests.sh [test-category]
#
# Categories:
#   all         - Run all tests (default)
#   smoke       - Quick 5-minute smoke test
#   terrain     - Terrain analysis tests
#   layout      - Layout optimization tests
#   windrose    - Wind rose analysis tests
#   wake        - Wake simulation tests
#   report      - Report generation tests
#   persistence - Project persistence tests
#   actions     - Action buttons tests
#   dashboards  - Dashboard consolidation tests
#   errors      - Error handling tests
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test category
TEST_CATEGORY="${1:-all}"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
}

print_skip() {
    echo -e "${YELLOW}⊘ $1${NC}"
    ((SKIPPED_TESTS++))
}

print_info() {
    echo -e "${MAGENTA}ℹ $1${NC}"
}

###############################################################################
# Pre-Flight Checks
###############################################################################

preflight_checks() {
    print_header "Pre-Flight Checks"
    
    # Check if sandbox is running
    print_test "Checking if Amplify sandbox is running..."
    if pgrep -f "ampx sandbox" > /dev/null; then
        print_success "Sandbox is running"
    else
        print_failure "Sandbox is not running"
        echo ""
        echo "Please start the sandbox with: npx ampx sandbox"
        exit 1
    fi
    
    # Check AWS credentials
    print_test "Checking AWS credentials..."
    if aws sts get-caller-identity > /dev/null 2>&1; then
        print_success "AWS credentials configured"
    else
        print_failure "AWS credentials not configured"
        exit 1
    fi
    
    # Check if orchestrator Lambda exists
    print_test "Checking orchestrator Lambda..."
    ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null || echo "")
    if [ -n "$ORCHESTRATOR" ]; then
        print_success "Orchestrator Lambda found: $ORCHESTRATOR"
    else
        print_failure "Orchestrator Lambda not found"
        exit 1
    fi
    
    # Check environment variables
    print_test "Checking orchestrator environment variables..."
    ENV_VARS=$(aws lambda get-function-configuration \
        --function-name "$ORCHESTRATOR" \
        --query "Environment.Variables" \
        --output json 2>/dev/null || echo "{}")
    
    TERRAIN_LAMBDA=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME // "missing"')
    LAYOUT_LAMBDA=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME // "missing"')
    SIMULATION_LAMBDA=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME // "missing"')
    REPORT_LAMBDA=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_REPORT_TOOL_FUNCTION_NAME // "missing"')
    S3_BUCKET=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_S3_BUCKET // "missing"')
    
    if [ "$TERRAIN_LAMBDA" != "missing" ] && [ "$LAYOUT_LAMBDA" != "missing" ]; then
        print_success "Environment variables configured"
        print_info "  Terrain: $TERRAIN_LAMBDA"
        print_info "  Layout: $LAYOUT_LAMBDA"
        print_info "  Simulation: $SIMULATION_LAMBDA"
        print_info "  Report: $REPORT_LAMBDA"
        print_info "  S3 Bucket: $S3_BUCKET"
    else
        print_failure "Environment variables not configured"
        exit 1
    fi
    
    echo ""
}

###############################################################################
# Test Functions
###############################################################################

test_smoke() {
    print_header "5-Minute Smoke Test"
    
    print_info "This test runs the complete workflow: terrain → layout → wind rose → wake → report"
    echo ""
    
    # Test 1: Terrain Analysis
    ((TOTAL_TESTS++))
    print_test "Test 1: Terrain Analysis"
    if node tests/test-terrain-analysis-simple.js > /dev/null 2>&1; then
        print_success "Terrain analysis passed"
    else
        print_failure "Terrain analysis failed"
    fi
    
    # Test 2: Layout Optimization
    ((TOTAL_TESTS++))
    print_test "Test 2: Layout Optimization"
    if node tests/test-layout-optimization-simple.js > /dev/null 2>&1; then
        print_success "Layout optimization passed"
    else
        print_failure "Layout optimization failed"
    fi
    
    # Test 3: Wind Rose
    ((TOTAL_TESTS++))
    print_test "Test 3: Wind Rose Generation"
    if node tests/test-wind-rose-simple.js > /dev/null 2>&1; then
        print_success "Wind rose generation passed"
    else
        print_failure "Wind rose generation failed"
    fi
    
    # Test 4: Wake Simulation
    ((TOTAL_TESTS++))
    print_test "Test 4: Wake Simulation"
    if node tests/test-wake-simulation-simple.js > /dev/null 2>&1; then
        print_success "Wake simulation passed"
    else
        print_failure "Wake simulation failed"
    fi
    
    # Test 5: Report Generation
    ((TOTAL_TESTS++))
    print_test "Test 5: Report Generation"
    if node tests/test-report-generation-simple.js > /dev/null 2>&1; then
        print_success "Report generation passed"
    else
        print_failure "Report generation failed"
    fi
    
    echo ""
}

test_terrain() {
    print_header "Terrain Analysis Tests"
    
    # Test 1: Basic terrain
    ((TOTAL_TESTS++))
    print_test "Test 1: Basic terrain analysis with coordinates"
    print_info "Query: Analyze terrain at 35.067482, -101.395466"
    if node tests/test-terrain-basic.js > /dev/null 2>&1; then
        print_success "Basic terrain analysis passed"
    else
        print_failure "Basic terrain analysis failed"
    fi
    
    # Test 2: Named location
    ((TOTAL_TESTS++))
    print_test "Test 2: Terrain analysis with named location"
    print_info "Query: Analyze wind farm terrain in Lubbock, Texas"
    print_skip "Manual test required (geocoding)"
    
    # Test 3: Feature count
    ((TOTAL_TESTS++))
    print_test "Test 3: Verify 151 features (not 60)"
    if node tests/test-terrain-feature-count.js > /dev/null 2>&1; then
        print_success "Feature count correct (151)"
    else
        print_failure "Feature count incorrect"
    fi
    
    echo ""
}

test_layout() {
    print_header "Layout Optimization Tests"
    
    # Test 1: Layout with coordinates
    ((TOTAL_TESTS++))
    print_test "Test 1: Layout optimization with explicit coordinates"
    if node tests/test-layout-with-coordinates.js > /dev/null 2>&1; then
        print_success "Layout with coordinates passed"
    else
        print_failure "Layout with coordinates failed"
    fi
    
    # Test 2: Layout after terrain
    ((TOTAL_TESTS++))
    print_test "Test 2: Layout optimization after terrain (auto-load)"
    print_skip "Manual test required (session context)"
    
    # Test 3: Layout with turbine count
    ((TOTAL_TESTS++))
    print_test "Test 3: Layout with specified turbine count"
    if node tests/test-layout-turbine-count.js > /dev/null 2>&1; then
        print_success "Layout with turbine count passed"
    else
        print_failure "Layout with turbine count failed"
    fi
    
    echo ""
}

test_windrose() {
    print_header "Wind Rose Analysis Tests"
    
    # Test 1: Wind rose generation
    ((TOTAL_TESTS++))
    print_test "Test 1: Wind rose generation with coordinates"
    if node tests/test-windrose-generation.js > /dev/null 2>&1; then
        print_success "Wind rose generation passed"
    else
        print_failure "Wind rose generation failed"
    fi
    
    # Test 2: Plotly interactivity
    ((TOTAL_TESTS++))
    print_test "Test 2: Plotly wind rose interactivity"
    print_skip "Manual test required (UI interaction)"
    
    echo ""
}

test_wake() {
    print_header "Wake Simulation Tests"
    
    # Test 1: Wake simulation
    ((TOTAL_TESTS++))
    print_test "Test 1: Wake simulation with layout"
    if node tests/test-wake-simulation.js > /dev/null 2>&1; then
        print_success "Wake simulation passed"
    else
        print_failure "Wake simulation failed"
    fi
    
    echo ""
}

test_report() {
    print_header "Report Generation Tests"
    
    # Test 1: Report generation
    ((TOTAL_TESTS++))
    print_test "Test 1: Comprehensive report generation"
    if node tests/test-report-generation.js > /dev/null 2>&1; then
        print_success "Report generation passed"
    else
        print_failure "Report generation failed"
    fi
    
    echo ""
}

test_persistence() {
    print_header "Project Persistence Tests"
    
    # Test 1: Project name generation
    ((TOTAL_TESTS++))
    print_test "Test 1: Project name auto-generation"
    if node tests/test-project-name-generator.js > /dev/null 2>&1; then
        print_success "Project name generation passed"
    else
        print_failure "Project name generation failed"
    fi
    
    # Test 2: Project save/load
    ((TOTAL_TESTS++))
    print_test "Test 2: Project save and load"
    if node tests/test-project-store.js > /dev/null 2>&1; then
        print_success "Project save/load passed"
    else
        print_failure "Project save/load failed"
    fi
    
    # Test 3: Session context
    ((TOTAL_TESTS++))
    print_test "Test 3: Session context management"
    if node tests/test-session-context-manager.js > /dev/null 2>&1; then
        print_success "Session context passed"
    else
        print_failure "Session context failed"
    fi
    
    # Test 4: Project resolver
    ((TOTAL_TESTS++))
    print_test "Test 4: Project name resolution"
    if node tests/test-project-resolver.js > /dev/null 2>&1; then
        print_success "Project resolver passed"
    else
        print_failure "Project resolver failed"
    fi
    
    echo ""
}

test_actions() {
    print_header "Action Buttons Tests"
    
    # Test 1: Action button generation
    ((TOTAL_TESTS++))
    print_test "Test 1: Action button generation"
    if node tests/test-action-buttons.js > /dev/null 2>&1; then
        print_success "Action button generation passed"
    else
        print_failure "Action button generation failed"
    fi
    
    # Test 2: Action button clicks
    ((TOTAL_TESTS++))
    print_test "Test 2: Action button click behavior"
    print_skip "Manual test required (UI interaction)"
    
    echo ""
}

test_dashboards() {
    print_header "Dashboard Consolidation Tests"
    
    # Test 1: Wind resource dashboard
    ((TOTAL_TESTS++))
    print_test "Test 1: Wind resource dashboard"
    if node tests/test-dashboard-components.js > /dev/null 2>&1; then
        print_success "Wind resource dashboard passed"
    else
        print_failure "Wind resource dashboard failed"
    fi
    
    # Test 2: Performance dashboard
    ((TOTAL_TESTS++))
    print_test "Test 2: Performance analysis dashboard"
    print_skip "Manual test required (UI rendering)"
    
    # Test 3: Wake dashboard
    ((TOTAL_TESTS++))
    print_test "Test 3: Wake analysis dashboard"
    print_skip "Manual test required (UI rendering)"
    
    echo ""
}

test_errors() {
    print_header "Error Handling Tests"
    
    # Test 1: Missing coordinates
    ((TOTAL_TESTS++))
    print_test "Test 1: Error handling for missing coordinates"
    if node tests/test-error-missing-coordinates.js > /dev/null 2>&1; then
        print_success "Missing coordinates error handled"
    else
        print_failure "Missing coordinates error not handled"
    fi
    
    # Test 2: Missing layout
    ((TOTAL_TESTS++))
    print_test "Test 2: Error handling for missing layout"
    if node tests/test-error-missing-layout.js > /dev/null 2>&1; then
        print_success "Missing layout error handled"
    else
        print_failure "Missing layout error not handled"
    fi
    
    # Test 3: Ambiguous project
    ((TOTAL_TESTS++))
    print_test "Test 3: Error handling for ambiguous project reference"
    print_skip "Manual test required (multiple projects)"
    
    echo ""
}

###############################################################################
# Main Test Runner
###############################################################################

main() {
    print_header "Renewable Energy E2E Test Runner"
    echo -e "${CYAN}Test Category: ${TEST_CATEGORY}${NC}"
    echo ""
    
    # Run pre-flight checks
    preflight_checks
    
    # Run tests based on category
    case "$TEST_CATEGORY" in
        all)
            test_smoke
            test_terrain
            test_layout
            test_windrose
            test_wake
            test_report
            test_persistence
            test_actions
            test_dashboards
            test_errors
            ;;
        smoke)
            test_smoke
            ;;
        terrain)
            test_terrain
            ;;
        layout)
            test_layout
            ;;
        windrose)
            test_windrose
            ;;
        wake)
            test_wake
            ;;
        report)
            test_report
            ;;
        persistence)
            test_persistence
            ;;
        actions)
            test_actions
            ;;
        dashboards)
            test_dashboards
            ;;
        errors)
            test_errors
            ;;
        *)
            echo -e "${RED}Unknown test category: $TEST_CATEGORY${NC}"
            echo ""
            echo "Valid categories: all, smoke, terrain, layout, windrose, wake, report, persistence, actions, dashboards, errors"
            exit 1
            ;;
    esac
    
    # Print summary
    print_header "Test Summary"
    echo -e "${CYAN}Total Tests:   ${TOTAL_TESTS}${NC}"
    echo -e "${GREEN}Passed:        ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed:        ${FAILED_TESTS}${NC}"
    echo -e "${YELLOW}Skipped:       ${SKIPPED_TESTS}${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
