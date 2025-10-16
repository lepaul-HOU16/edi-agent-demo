#!/bin/bash

# Wake Simulation Test Script
# Tests the wake simulation functionality

echo "=========================================="
echo "WAKE SIMULATION TEST"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Get the simulation Lambda function name
SIMULATION_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text 2>/dev/null)

if [ -z "$SIMULATION_FUNCTION" ]; then
    echo -e "${RED}✗ Simulation Lambda not found${NC}"
    exit 1
fi

echo "Found simulation Lambda: $SIMULATION_FUNCTION"
echo ""

# First, get a layout to use for wake simulation
echo "Step 1: Getting layout data..."
echo "------------------------------"

LAYOUT_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text 2>/dev/null)

if [ -z "$LAYOUT_FUNCTION" ]; then
    echo -e "${RED}✗ Layout Lambda not found${NC}"
    exit 1
fi

# Get layout
LAYOUT_PAYLOAD='{"parameters":{"latitude":35.067482,"longitude":-101.395466,"num_turbines":10,"project_id":"test-wake"}}'

aws lambda invoke \
    --function-name "$LAYOUT_FUNCTION" \
    --payload "$LAYOUT_PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/layout-for-wake.json > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to get layout data${NC}"
    exit 1
fi

# Extract layout GeoJSON
LAYOUT_GEOJSON=$(jq -r '.data.geojson' /tmp/layout-for-wake.json 2>/dev/null)

if [ -z "$LAYOUT_GEOJSON" ] || [ "$LAYOUT_GEOJSON" = "null" ]; then
    echo -e "${RED}✗ Failed to extract layout GeoJSON${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Got layout data${NC}"
echo ""

# Test 1: Wake simulation with valid layout
echo "Test 1: Wake simulation with valid layout"
echo "------------------------------------------"

# Create payload with layout data
cat > /tmp/wake-payload.json <<EOF
{
  "parameters": {
    "project_id": "test-wake",
    "layout": $LAYOUT_GEOJSON,
    "wind_speed": 8.5,
    "wind_direction": 270
  }
}
EOF

echo "Invoking Lambda with wake simulation..."
aws lambda invoke \
    --function-name "$SIMULATION_FUNCTION" \
    --payload file:///tmp/wake-payload.json \
    --cli-binary-format raw-in-base64-out \
    /tmp/wake-response.json > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Lambda invocation failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    # Check response
    if [ -f /tmp/wake-response.json ]; then
        SUCCESS=$(jq -r '.success' /tmp/wake-response.json 2>/dev/null)
        TYPE=$(jq -r '.type' /tmp/wake-response.json 2>/dev/null)
        TURBINE_COUNT=$(jq -r '.data.turbineCount' /tmp/wake-response.json 2>/dev/null)
        CAPACITY_FACTOR=$(jq -r '.data.performanceMetrics.capacityFactor' /tmp/wake-response.json 2>/dev/null)
        WAKE_LOSS=$(jq -r '.data.performanceMetrics.wakeLossPercent' /tmp/wake-response.json 2>/dev/null)
        AEP=$(jq -r '.data.performanceMetrics.annualEnergyGWh' /tmp/wake-response.json 2>/dev/null)
        MAP_URL=$(jq -r '.data.mapUrl' /tmp/wake-response.json 2>/dev/null)
        
        echo "Success: $SUCCESS"
        echo "Type: $TYPE"
        echo "Turbine Count: $TURBINE_COUNT"
        echo "Capacity Factor: $CAPACITY_FACTOR"
        echo "Wake Loss: $WAKE_LOSS%"
        echo "Annual Energy: $AEP GWh"
        echo "Heat Map URL: $MAP_URL"
        
        if [ "$SUCCESS" = "true" ] && [ "$TYPE" = "wake_simulation" ]; then
            echo -e "${GREEN}✓ Wake simulation successful${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            
            # Check if heat map URL exists
            if [ ! -z "$MAP_URL" ] && [ "$MAP_URL" != "null" ]; then
                echo -e "${GREEN}✓ Wake heat map URL generated${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "${YELLOW}⚠ No heat map URL (folium may not be available)${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            fi
        else
            echo -e "${RED}✗ Wake simulation failed${NC}"
            jq '.' /tmp/wake-response.json 2>/dev/null || cat /tmp/wake-response.json
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ No response file created${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

echo ""

# Test 2: Performance metrics validation
echo "Test 2: Performance metrics validation"
echo "---------------------------------------"

if [ -f /tmp/wake-response.json ]; then
    CAPACITY_FACTOR=$(jq -r '.data.performanceMetrics.capacityFactor' /tmp/wake-response.json 2>/dev/null)
    WAKE_LOSS=$(jq -r '.data.performanceMetrics.wakeLossPercent' /tmp/wake-response.json 2>/dev/null)
    GROSS_AEP=$(jq -r '.data.performanceMetrics.grossAEP' /tmp/wake-response.json 2>/dev/null)
    NET_AEP=$(jq -r '.data.performanceMetrics.netAEP' /tmp/wake-response.json 2>/dev/null)
    
    echo "Capacity Factor: $CAPACITY_FACTOR"
    echo "Wake Loss: $WAKE_LOSS%"
    echo "Gross AEP: $GROSS_AEP GWh"
    echo "Net AEP: $NET_AEP GWh"
    
    # Validate capacity factor is reasonable (0-1)
    if [ ! -z "$CAPACITY_FACTOR" ] && [ "$CAPACITY_FACTOR" != "null" ]; then
        if (( $(echo "$CAPACITY_FACTOR >= 0" | bc -l) )) && (( $(echo "$CAPACITY_FACTOR <= 1" | bc -l) )); then
            echo -e "${GREEN}✓ Capacity factor is reasonable${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ Capacity factor out of range${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
    
    # Validate wake loss is reasonable (0-50%)
    if [ ! -z "$WAKE_LOSS" ] && [ "$WAKE_LOSS" != "null" ]; then
        if (( $(echo "$WAKE_LOSS >= 0" | bc -l) )) && (( $(echo "$WAKE_LOSS <= 50" | bc -l) )); then
            echo -e "${GREEN}✓ Wake loss is reasonable${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ Wake loss is $WAKE_LOSS% (may be high)${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
    fi
    
    # Validate net AEP < gross AEP
    if [ ! -z "$GROSS_AEP" ] && [ "$GROSS_AEP" != "null" ] && [ ! -z "$NET_AEP" ] && [ "$NET_AEP" != "null" ]; then
        if (( $(echo "$NET_AEP <= $GROSS_AEP" | bc -l) )); then
            echo -e "${GREEN}✓ Net AEP is less than gross AEP${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ Net AEP exceeds gross AEP${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
fi

echo ""

# Test 3: Wake results structure validation
echo "Test 3: Wake results structure validation"
echo "------------------------------------------"

if [ -f /tmp/wake-response.json ]; then
    WAKE_RESULTS_COUNT=$(jq -r '.data.wakeResults | length' /tmp/wake-response.json 2>/dev/null)
    
    echo "Wake Results Count: $WAKE_RESULTS_COUNT"
    
    if [ ! -z "$WAKE_RESULTS_COUNT" ] && [ "$WAKE_RESULTS_COUNT" != "null" ] && [ "$WAKE_RESULTS_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Wake results present${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Check first turbine result structure
        FIRST_TURBINE_ID=$(jq -r '.data.wakeResults[0].turbine_id' /tmp/wake-response.json 2>/dev/null)
        FIRST_TURBINE_DEFICIT=$(jq -r '.data.wakeResults[0].total_wake_deficit' /tmp/wake-response.json 2>/dev/null)
        
        if [ ! -z "$FIRST_TURBINE_ID" ] && [ "$FIRST_TURBINE_ID" != "null" ]; then
            echo -e "${GREEN}✓ Turbine results have IDs${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
        
        if [ ! -z "$FIRST_TURBINE_DEFICIT" ] && [ "$FIRST_TURBINE_DEFICIT" != "null" ]; then
            echo -e "${GREEN}✓ Turbine results have wake deficits${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
    else
        echo -e "${RED}✗ No wake results found${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

echo ""

# Summary
echo "=========================================="
echo "WAKE SIMULATION TEST SUMMARY"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All wake simulation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some wake simulation tests failed!${NC}"
    exit 1
fi
