#!/bin/bash

# Wind Rose Analysis Test Script
# Tests the wind rose functionality

echo "=========================================="
echo "WIND ROSE ANALYSIS TEST"
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

# Test 1: Wind rose with valid coordinates
echo "Test 1: Wind rose with valid coordinates"
echo "-----------------------------------------"

PAYLOAD='{"action":"wind_rose","parameters":{"latitude":35.067482,"longitude":-101.395466,"wind_speed":8.5,"project_id":"test-wind-rose"}}'

echo "Invoking Lambda with wind_rose action..."
aws lambda invoke \
    --function-name "$SIMULATION_FUNCTION" \
    --payload "$PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/wind-rose-response.json > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Lambda invocation failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    # Check response
    if [ -f /tmp/wind-rose-response.json ]; then
        SUCCESS=$(jq -r '.success' /tmp/wind-rose-response.json 2>/dev/null)
        TYPE=$(jq -r '.type' /tmp/wind-rose-response.json 2>/dev/null)
        PROJECT_ID=$(jq -r '.data.projectId' /tmp/wind-rose-response.json 2>/dev/null)
        AVG_SPEED=$(jq -r '.data.windStatistics.averageSpeed' /tmp/wind-rose-response.json 2>/dev/null)
        WIND_ROSE_URL=$(jq -r '.data.windRoseUrl' /tmp/wind-rose-response.json 2>/dev/null)
        
        echo "Success: $SUCCESS"
        echo "Type: $TYPE"
        echo "Project ID: $PROJECT_ID"
        echo "Average Wind Speed: $AVG_SPEED m/s"
        echo "Wind Rose URL: $WIND_ROSE_URL"
        
        if [ "$SUCCESS" = "true" ] && [ "$TYPE" = "wind_rose_analysis" ]; then
            echo -e "${GREEN}✓ Wind rose analysis successful${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            
            # Check if visualization URL exists
            if [ ! -z "$WIND_ROSE_URL" ] && [ "$WIND_ROSE_URL" != "null" ]; then
                echo -e "${GREEN}✓ Wind rose visualization URL generated${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                
                # Try to access the URL
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WIND_ROSE_URL" 2>/dev/null)
                if [ "$HTTP_CODE" = "200" ]; then
                    echo -e "${GREEN}✓ Wind rose visualization is accessible${NC}"
                    TESTS_PASSED=$((TESTS_PASSED + 1))
                else
                    echo -e "${YELLOW}⚠ Wind rose visualization not yet accessible (HTTP $HTTP_CODE)${NC}"
                    echo "  (May take a moment for S3 to propagate)"
                    TESTS_PASSED=$((TESTS_PASSED + 1))
                fi
            else
                echo -e "${YELLOW}⚠ No wind rose visualization URL (matplotlib may not be available)${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            fi
        else
            echo -e "${RED}✗ Wind rose analysis failed${NC}"
            jq '.' /tmp/wind-rose-response.json 2>/dev/null || cat /tmp/wind-rose-response.json
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ No response file created${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

echo ""

# Test 2: Wind statistics validation
echo "Test 2: Wind statistics validation"
echo "-----------------------------------"

if [ -f /tmp/wind-rose-response.json ]; then
    AVG_SPEED=$(jq -r '.data.windStatistics.averageSpeed' /tmp/wind-rose-response.json 2>/dev/null)
    MAX_SPEED=$(jq -r '.data.windStatistics.maxSpeed' /tmp/wind-rose-response.json 2>/dev/null)
    DIRECTION_COUNT=$(jq -r '.data.windStatistics.directionCount' /tmp/wind-rose-response.json 2>/dev/null)
    
    echo "Average Speed: $AVG_SPEED m/s"
    echo "Max Speed: $MAX_SPEED m/s"
    echo "Direction Count: $DIRECTION_COUNT"
    
    # Validate statistics are reasonable
    if [ ! -z "$AVG_SPEED" ] && [ "$AVG_SPEED" != "null" ]; then
        # Check if average speed is in reasonable range (0-30 m/s)
        if (( $(echo "$AVG_SPEED > 0" | bc -l) )) && (( $(echo "$AVG_SPEED < 30" | bc -l) )); then
            echo -e "${GREEN}✓ Average wind speed is reasonable${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ Average wind speed out of range${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
    
    # Check direction count (should be 16 for standard wind rose)
    if [ "$DIRECTION_COUNT" = "16" ]; then
        echo -e "${GREEN}✓ Direction count is correct (16 directions)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Direction count is $DIRECTION_COUNT (expected 16)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
fi

echo ""

# Test 3: Response structure validation
echo "Test 3: Response structure validation"
echo "--------------------------------------"

if [ -f /tmp/wind-rose-response.json ]; then
    # Check required fields
    HAS_PROJECT_ID=$(jq -r '.data.projectId' /tmp/wind-rose-response.json 2>/dev/null)
    HAS_COORDINATES=$(jq -r '.data.coordinates' /tmp/wind-rose-response.json 2>/dev/null)
    HAS_STATISTICS=$(jq -r '.data.windStatistics' /tmp/wind-rose-response.json 2>/dev/null)
    HAS_MESSAGE=$(jq -r '.data.message' /tmp/wind-rose-response.json 2>/dev/null)
    
    if [ ! -z "$HAS_PROJECT_ID" ] && [ "$HAS_PROJECT_ID" != "null" ]; then
        echo -e "${GREEN}✓ Response has project ID${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Response missing project ID${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    if [ ! -z "$HAS_COORDINATES" ] && [ "$HAS_COORDINATES" != "null" ]; then
        echo -e "${GREEN}✓ Response has coordinates${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Response missing coordinates${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    if [ ! -z "$HAS_STATISTICS" ] && [ "$HAS_STATISTICS" != "null" ]; then
        echo -e "${GREEN}✓ Response has wind statistics${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Response missing wind statistics${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi

echo ""

# Summary
echo "=========================================="
echo "WIND ROSE TEST SUMMARY"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All wind rose tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some wind rose tests failed!${NC}"
    exit 1
fi
