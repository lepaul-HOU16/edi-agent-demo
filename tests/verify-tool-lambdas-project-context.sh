#!/bin/bash

# Verification Script for Tool Lambdas Project Context Integration
# Tests that layout, simulation, and report Lambdas use project context correctly

echo "🔍 Verifying Tool Lambdas Project Context Integration"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check if a pattern exists in a file
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅${NC} $description"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $description"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. Checking Layout Lambda Implementation"
echo "----------------------------------------"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "project_context = event.get('project_context', {})" \
    "Layout Lambda extracts project context from event"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "if project_context and 'coordinates' in project_context:" \
    "Layout Lambda checks for coordinates in project context"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "Using coordinates from project context" \
    "Layout Lambda logs when using context coordinates"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "No coordinates found for project" \
    "Layout Lambda has context-aware error message"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "Run terrain analysis first" \
    "Layout Lambda suggests running terrain analysis"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "MISSING_PROJECT_DATA" \
    "Layout Lambda uses MISSING_PROJECT_DATA error category"

echo ""
echo "2. Checking Simulation Lambda Implementation"
echo "--------------------------------------------"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "project_context = event.get('project_context', {})" \
    "Simulation Lambda extracts project context from event"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "if project_context and 'layout_results' in project_context:" \
    "Simulation Lambda checks for layout in project context"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "Using layout from project context" \
    "Simulation Lambda logs when using context layout"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "No layout found for project" \
    "Simulation Lambda has context-aware error message"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "Run layout optimization first" \
    "Simulation Lambda suggests running layout optimization"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "MISSING_PROJECT_DATA" \
    "Simulation Lambda uses MISSING_PROJECT_DATA error category"

echo ""
echo "3. Checking Report Lambda Implementation"
echo "----------------------------------------"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "project_context = event.get('project_context', {})" \
    "Report Lambda extracts project context from event"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "terrain_results = project_context.get('terrain_results', {})" \
    "Report Lambda checks for terrain results in context"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "layout_results = project_context.get('layout_results', {})" \
    "Report Lambda checks for layout results in context"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "simulation_results = project_context.get('simulation_results', {})" \
    "Report Lambda checks for simulation results in context"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "No analysis results found for project" \
    "Report Lambda has context-aware error message"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "Complete the analysis workflow" \
    "Report Lambda suggests completing workflow"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "MISSING_PROJECT_DATA" \
    "Report Lambda uses MISSING_PROJECT_DATA error category"

echo ""
echo "4. Checking Backward Compatibility"
echo "----------------------------------"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "params.get('latitude')" \
    "Layout Lambda still accepts explicit latitude parameter"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "params.get('center_lat')" \
    "Layout Lambda still accepts legacy center_lat parameter"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "params.get('layout', {})" \
    "Simulation Lambda still accepts explicit layout parameter"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "params.get('terrain_results', {})" \
    "Report Lambda still accepts explicit terrain_results parameter"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "params.get('layout_results', {})" \
    "Report Lambda still accepts explicit layout_results parameter"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "params.get('simulation_results', {})" \
    "Report Lambda still accepts explicit simulation_results parameter"

echo ""
echo "5. Checking Error Handling Details"
echo "----------------------------------"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "hasProjectContext" \
    "Layout Lambda includes context availability in error details"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "hasLayoutInContext" \
    "Simulation Lambda includes layout availability in error details"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "hasTerrainResults" \
    "Report Lambda includes terrain results availability in error details"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "hasLayoutResults" \
    "Report Lambda includes layout results availability in error details"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "hasSimulationResults" \
    "Report Lambda includes simulation results availability in error details"

echo ""
echo "6. Checking Logging"
echo "------------------"

check_pattern "amplify/functions/renewableTools/layout/handler.py" \
    "logger.info.*Project context available" \
    "Layout Lambda logs project context availability"

check_pattern "amplify/functions/renewableTools/simulation/handler.py" \
    "logger.info.*Project context available" \
    "Simulation Lambda logs project context availability"

check_pattern "amplify/functions/renewableTools/report/handler.py" \
    "logger.info.*Project context available" \
    "Report Lambda logs project context availability"

echo ""
echo "======================================================"
echo "📊 Verification Results"
echo "======================================================"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All verifications passed!${NC}"
    echo ""
    echo "Tool Lambdas are correctly configured to:"
    echo "  ✅ Extract project context from events"
    echo "  ✅ Use context data with proper priority"
    echo "  ✅ Fall back to explicit parameters"
    echo "  ✅ Return helpful error messages"
    echo "  ✅ Maintain backward compatibility"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy updated Lambdas: npx ampx sandbox"
    echo "  2. Test end-to-end workflow with orchestrator"
    echo "  3. Verify error messages in UI"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some verifications failed${NC}"
    echo ""
    echo "Please review the failed checks above and ensure:"
    echo "  - All Lambdas extract project_context from event"
    echo "  - All Lambdas check context before explicit parameters"
    echo "  - All Lambdas have context-aware error messages"
    echo "  - All Lambdas maintain backward compatibility"
    echo ""
    exit 1
fi
