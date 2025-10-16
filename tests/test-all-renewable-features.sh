#!/bin/bash

# Comprehensive Renewable Energy Features Test
# Tests all features: terrain, layout, wind rose, wake simulation, report

echo "=========================================="
echo "COMPREHENSIVE RENEWABLE ENERGY TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test project ID
PROJECT_ID="test-complete-$(date +%s)"

echo -e "${BLUE}Project ID: $PROJECT_ID${NC}"
echo ""

# Step 1: Test Terrain Analysis
echo "=========================================="
echo "STEP 1: TERRAIN ANALYSIS"
echo "=========================================="

./tests/test-renewable-baseline.sh
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Terrain analysis passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Terrain analysis failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Step 2: Test Wind Rose
echo "=========================================="
echo "STEP 2: WIND ROSE ANALYSIS"
echo "=========================================="

./tests/test-wind-rose.sh
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Wind rose analysis passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Wind rose analysis failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Step 3: Test Wake Simulation
echo "=========================================="
echo "STEP 3: WAKE SIMULATION"
echo "=========================================="

./tests/test-wake-simulation.sh
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Wake simulation passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Wake simulation failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Step 4: Test End-to-End Workflow
echo "=========================================="
echo "STEP 4: END-TO-END WORKFLOW"
echo "=========================================="

echo "Running complete workflow: terrain → layout → wake → report"
echo ""

# Get Lambda function names
TERRAIN_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text)
LAYOUT_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text)
SIMULATION_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)
REPORT_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableReportTool')].FunctionName" --output text)

# 4.1: Terrain
echo "4.1: Running terrain analysis..."
aws lambda invoke \
    --function-name "$TERRAIN_FUNCTION" \
    --payload "{\"parameters\":{\"latitude\":35.067482,\"longitude\":-101.395466,\"radius_km\":5,\"project_id\":\"$PROJECT_ID\"}}" \
    --cli-binary-format raw-in-base64-out \
    /tmp/e2e-terrain.json > /dev/null 2>&1

TERRAIN_SUCCESS=$(jq -r '.success' /tmp/e2e-terrain.json 2>/dev/null)
if [ "$TERRAIN_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Terrain analysis completed${NC}"
    TERRAIN_RESULTS=$(jq -c '.data' /tmp/e2e-terrain.json)
else
    echo -e "${RED}✗ Terrain analysis failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    exit 1
fi

# 4.2: Layout
echo "4.2: Running layout optimization..."
aws lambda invoke \
    --function-name "$LAYOUT_FUNCTION" \
    --payload "{\"parameters\":{\"latitude\":35.067482,\"longitude\":-101.395466,\"num_turbines\":10,\"project_id\":\"$PROJECT_ID\"}}" \
    --cli-binary-format raw-in-base64-out \
    /tmp/e2e-layout.json > /dev/null 2>&1

LAYOUT_SUCCESS=$(jq -r '.success' /tmp/e2e-layout.json 2>/dev/null)
if [ "$LAYOUT_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Layout optimization completed${NC}"
    LAYOUT_RESULTS=$(jq -c '.data' /tmp/e2e-layout.json)
    LAYOUT_GEOJSON=$(jq -c '.data.geojson' /tmp/e2e-layout.json)
else
    echo -e "${RED}✗ Layout optimization failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    exit 1
fi

# 4.3: Wake Simulation
echo "4.3: Running wake simulation..."
cat > /tmp/e2e-wake-payload.json <<EOF
{
  "parameters": {
    "project_id": "$PROJECT_ID",
    "layout": $LAYOUT_GEOJSON,
    "wind_speed": 8.5,
    "wind_direction": 270
  }
}
EOF

aws lambda invoke \
    --function-name "$SIMULATION_FUNCTION" \
    --payload file:///tmp/e2e-wake-payload.json \
    --cli-binary-format raw-in-base64-out \
    /tmp/e2e-wake.json > /dev/null 2>&1

WAKE_SUCCESS=$(jq -r '.success' /tmp/e2e-wake.json 2>/dev/null)
if [ "$WAKE_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Wake simulation completed${NC}"
    SIMULATION_RESULTS=$(jq -c '.data' /tmp/e2e-wake.json)
else
    echo -e "${RED}✗ Wake simulation failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    exit 1
fi

# 4.4: Report Generation
echo "4.4: Generating comprehensive report..."
cat > /tmp/e2e-report-payload.json <<EOF
{
  "parameters": {
    "project_id": "$PROJECT_ID",
    "terrain_results": $TERRAIN_RESULTS,
    "layout_results": $LAYOUT_RESULTS,
    "simulation_results": $SIMULATION_RESULTS
  }
}
EOF

aws lambda invoke \
    --function-name "$REPORT_FUNCTION" \
    --payload file:///tmp/e2e-report-payload.json \
    --cli-binary-format raw-in-base64-out \
    /tmp/e2e-report.json > /dev/null 2>&1

REPORT_SUCCESS=$(jq -r '.success' /tmp/e2e-report.json 2>/dev/null)
if [ "$REPORT_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Report generation completed${NC}"
    REPORT_URL=$(jq -r '.data.reportUrl' /tmp/e2e-report.json)
    echo "Report URL: $REPORT_URL"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Report generation failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# Final Summary
echo "=========================================="
echo "COMPREHENSIVE TEST SUMMARY"
echo "=========================================="
echo -e "Total Test Suites: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED! ✓✓✓${NC}"
    echo ""
    echo "All renewable energy features are working correctly:"
    echo "  ✓ Terrain Analysis"
    echo "  ✓ Layout Optimization"
    echo "  ✓ Wind Rose Analysis"
    echo "  ✓ Wake Simulation"
    echo "  ✓ Report Generation"
    echo "  ✓ End-to-End Workflow"
    echo ""
    echo "Ready for production use!"
    exit 0
else
    echo -e "${RED}✗✗✗ SOME TESTS FAILED ✗✗✗${NC}"
    echo ""
    echo "Please review the failed tests above and fix issues."
    exit 1
fi
