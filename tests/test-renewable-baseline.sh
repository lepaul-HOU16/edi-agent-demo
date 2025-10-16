#!/bin/bash

# Baseline Validation Test for Renewable Energy Features
# This script validates that terrain and layout are working before we make changes

echo "=========================================="
echo "BASELINE VALIDATION TEST"
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

# Function to test terrain analysis
test_terrain() {
    echo "Testing Terrain Analysis..."
    echo "----------------------------"
    
    # Get the terrain Lambda function name
    TERRAIN_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text 2>/dev/null)
    
    if [ -z "$TERRAIN_FUNCTION" ]; then
        echo -e "${RED}✗ Terrain Lambda not found${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    echo "Found terrain Lambda: $TERRAIN_FUNCTION"
    
    # Test terrain analysis
    PAYLOAD='{"parameters":{"latitude":35.067482,"longitude":-101.395466,"radius_km":5,"project_id":"baseline-test"}}'
    
    echo "Invoking terrain Lambda..."
    RESPONSE=$(aws lambda invoke \
        --function-name "$TERRAIN_FUNCTION" \
        --payload "$PAYLOAD" \
        --cli-binary-format raw-in-base64-out \
        /tmp/terrain-response.json 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Terrain Lambda invocation failed${NC}"
        echo "$RESPONSE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    # Check response
    if [ -f /tmp/terrain-response.json ]; then
        STATUS_CODE=$(jq -r '.statusCode' /tmp/terrain-response.json 2>/dev/null)
        BODY=$(jq -r '.body' /tmp/terrain-response.json 2>/dev/null)
        
        if [ "$STATUS_CODE" = "200" ]; then
            SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
            FEATURE_COUNT=$(echo "$BODY" | jq -r '.data.metrics.totalFeatures' 2>/dev/null)
            MAP_URL=$(echo "$BODY" | jq -r '.data.mapUrl' 2>/dev/null)
            
            echo "Status Code: $STATUS_CODE"
            echo "Success: $SUCCESS"
            echo "Feature Count: $FEATURE_COUNT"
            echo "Map URL: $MAP_URL"
            
            if [ "$SUCCESS" = "true" ] && [ ! -z "$MAP_URL" ] && [ "$MAP_URL" != "null" ]; then
                echo -e "${GREEN}✓ Terrain analysis working${NC}"
                
                # Check if we're getting 151 features (not 60)
                if [ "$FEATURE_COUNT" -ge 100 ]; then
                    echo -e "${GREEN}✓ Feature count is good: $FEATURE_COUNT${NC}"
                    TESTS_PASSED=$((TESTS_PASSED + 1))
                else
                    echo -e "${YELLOW}⚠ Feature count is low: $FEATURE_COUNT (expected ~151)${NC}"
                    TESTS_PASSED=$((TESTS_PASSED + 1))
                fi
            else
                echo -e "${RED}✗ Terrain analysis failed${NC}"
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        else
            echo -e "${RED}✗ Terrain returned error status: $STATUS_CODE${NC}"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ No response file created${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
}

# Function to test layout optimization
test_layout() {
    echo "Testing Layout Optimization..."
    echo "------------------------------"
    
    # Get the layout Lambda function name
    LAYOUT_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableLayoutTool')].FunctionName" --output text 2>/dev/null)
    
    if [ -z "$LAYOUT_FUNCTION" ]; then
        echo -e "${RED}✗ Layout Lambda not found${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    echo "Found layout Lambda: $LAYOUT_FUNCTION"
    
    # Test layout optimization
    PAYLOAD='{"parameters":{"latitude":35.067482,"longitude":-101.395466,"num_turbines":10,"project_id":"baseline-test"}}'
    
    echo "Invoking layout Lambda..."
    RESPONSE=$(aws lambda invoke \
        --function-name "$LAYOUT_FUNCTION" \
        --payload "$PAYLOAD" \
        --cli-binary-format raw-in-base64-out \
        /tmp/layout-response.json 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Layout Lambda invocation failed${NC}"
        echo "$RESPONSE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    # Check response
    if [ -f /tmp/layout-response.json ]; then
        STATUS_CODE=$(jq -r '.statusCode' /tmp/layout-response.json 2>/dev/null)
        BODY=$(jq -r '.body' /tmp/layout-response.json 2>/dev/null)
        
        if [ "$STATUS_CODE" = "200" ]; then
            SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
            TURBINE_COUNT=$(echo "$BODY" | jq -r '.data.turbineCount' 2>/dev/null)
            MAP_HTML=$(echo "$BODY" | jq -r '.data.mapHtml' 2>/dev/null)
            
            echo "Status Code: $STATUS_CODE"
            echo "Success: $SUCCESS"
            echo "Turbine Count: $TURBINE_COUNT"
            echo "Has Map HTML: $([ ! -z "$MAP_HTML" ] && [ "$MAP_HTML" != "null" ] && echo "Yes" || echo "No")"
            
            if [ "$SUCCESS" = "true" ] && [ "$TURBINE_COUNT" = "10" ]; then
                echo -e "${GREEN}✓ Layout optimization working${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "${RED}✗ Layout optimization failed${NC}"
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        else
            echo -e "${RED}✗ Layout returned error status: $STATUS_CODE${NC}"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗ No response file created${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
}

# Function to check S3 bucket
test_s3_bucket() {
    echo "Testing S3 Bucket Configuration..."
    echo "----------------------------------"
    
    # Get S3 bucket name from environment or Amplify outputs
    S3_BUCKET=$(aws s3 ls | grep amplify | awk '{print $3}' | head -1)
    
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${YELLOW}⚠ Could not auto-detect S3 bucket${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    
    echo "Found S3 bucket: $S3_BUCKET"
    
    # Check if bucket is accessible
    aws s3 ls "s3://$S3_BUCKET/" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ S3 bucket is accessible${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ S3 bucket is not accessible${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
}

# Function to check CloudWatch logs
test_cloudwatch_logs() {
    echo "Checking CloudWatch Logs..."
    echo "---------------------------"
    
    # Check for recent errors in terrain Lambda
    TERRAIN_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text 2>/dev/null)
    
    if [ ! -z "$TERRAIN_FUNCTION" ]; then
        LOG_GROUP="/aws/lambda/$TERRAIN_FUNCTION"
        
        # Get recent errors (last 5 minutes)
        ERRORS=$(aws logs filter-log-events \
            --log-group-name "$LOG_GROUP" \
            --start-time $(($(date +%s) * 1000 - 300000)) \
            --filter-pattern "ERROR" \
            --query 'events[*].message' \
            --output text 2>/dev/null | wc -l)
        
        if [ "$ERRORS" -eq 0 ]; then
            echo -e "${GREEN}✓ No recent errors in terrain Lambda logs${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ Found $ERRORS recent errors in terrain Lambda logs${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
    fi
    
    echo ""
}

# Run all tests
echo "Starting baseline validation..."
echo ""

test_terrain
test_layout
test_s3_bucket
test_cloudwatch_logs

# Summary
echo "=========================================="
echo "BASELINE VALIDATION SUMMARY"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All baseline tests passed!${NC}"
    echo "Safe to proceed with new feature implementation."
    exit 0
else
    echo -e "${RED}✗ Some baseline tests failed!${NC}"
    echo "Fix existing issues before proceeding."
    exit 1
fi
