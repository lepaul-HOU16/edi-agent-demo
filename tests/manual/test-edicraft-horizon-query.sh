#!/bin/bash

# EDIcraft Horizon Query Manual Test Script
# Tests horizon-related queries to verify routing and processing

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EDIcraft Horizon Query Manual Tests${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if test-edicraft-routing.js exists
if [ ! -f "test-edicraft-routing.js" ]; then
    echo -e "${RED}❌ test-edicraft-routing.js not found${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${CYAN}This script tests horizon-related queries to verify:${NC}"
echo -e "  1. Agent router correctly detects horizon patterns"
echo -e "  2. Queries route to EDIcraft agent (not petrophysics)"
echo -e "  3. EDIcraft agent processes horizon queries"
echo -e "  4. Response includes horizon name and coordinates\n"

echo -e "${YELLOW}Prerequisites:${NC}"
echo -e "  ✓ Amplify sandbox is running"
echo -e "  ✓ EDIcraft agent is deployed"
echo -e "  ✓ OSDU credentials are configured"
echo -e "  ✓ Minecraft server is accessible\n"

read -p "Press Enter to start tests or Ctrl+C to cancel..."
echo ""

# Test counter
TEST_NUM=0
PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local query=$2
    local expected_agent=$3
    local expected_content=$4
    
    TEST_NUM=$((TEST_NUM + 1))
    
    echo -e "${BLUE}─────────────────────────────────────────${NC}"
    echo -e "${CYAN}Test ${TEST_NUM}: ${test_name}${NC}"
    echo -e "${BLUE}─────────────────────────────────────────${NC}"
    echo -e "${YELLOW}Query:${NC} \"${query}\""
    echo -e "${YELLOW}Expected Agent:${NC} ${expected_agent}"
    echo -e "${YELLOW}Expected Content:${NC} ${expected_content}\n"
    
    echo -e "${CYAN}Running test...${NC}"
    
    # Run the test using test-edicraft-routing.js
    if node test-edicraft-routing.js "$query" 2>&1 | tee /tmp/test-output.txt; then
        echo -e "\n${GREEN}✅ Test command executed${NC}"
        
        # Check output for expected patterns
        if grep -q "edicraft" /tmp/test-output.txt; then
            echo -e "${GREEN}✅ Routed to EDIcraft agent${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ Did NOT route to EDIcraft agent${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "\n${RED}❌ Test command failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo -e "\n${YELLOW}Manual Verification Steps:${NC}"
    echo -e "1. Check CloudWatch logs for agent router"
    echo -e "2. Look for: '🎮 AgentRouter: EDIcraft pattern MATCHED'"
    echo -e "3. Verify pattern source contains horizon-related regex"
    echo -e "4. Check EDIcraft handler logs for query processing"
    echo -e "5. Verify response includes: ${expected_content}\n"
    
    read -p "Press Enter to continue to next test..."
    echo ""
}

# Test 1: Simple horizon query
run_test \
    "Simple Horizon Query" \
    "find a horizon" \
    "edicraft" \
    "horizon name, coordinates"

# Test 2: Horizon name query
run_test \
    "Horizon Name Query" \
    "tell me the horizon name" \
    "edicraft" \
    "horizon name"

# Test 3: Coordinate conversion query
run_test \
    "Coordinate Conversion Query" \
    "convert to minecraft coordinates" \
    "edicraft" \
    "Minecraft coordinates (X, Y, Z)"

# Test 4: Complex user query (the actual reported issue)
run_test \
    "Complex Horizon Query" \
    "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft" \
    "edicraft" \
    "horizon name, UTM coordinates, Minecraft coordinates"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${CYAN}Total Tests:${NC} ${TEST_NUM}"
echo -e "${GREEN}Passed:${NC} ${PASSED}"
echo -e "${RED}Failed:${NC} ${FAILED}\n"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}\n"
else
    echo -e "${RED}❌ Some tests failed${NC}\n"
fi

# Expected Results Documentation
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Expected Results for Each Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${CYAN}Test 1: Simple Horizon Query${NC}"
echo -e "${YELLOW}Query:${NC} \"find a horizon\""
echo -e "${YELLOW}Expected Routing:${NC}"
echo -e "  - Agent Router detects pattern: /find.*horizon|horizon.*find/i"
echo -e "  - Routes to EDIcraft agent"
echo -e "  - NOT routed to petrophysics agent"
echo -e "${YELLOW}Expected Response:${NC}"
echo -e "  - Horizon name (e.g., 'Top Reservoir Formation')"
echo -e "  - UTM coordinates (Easting, Northing, Elevation)"
echo -e "  - Minecraft coordinates (X, Y, Z)"
echo -e "  - Instructions for viewing in Minecraft\n"

echo -e "${CYAN}Test 2: Horizon Name Query${NC}"
echo -e "${YELLOW}Query:${NC} \"tell me the horizon name\""
echo -e "${YELLOW}Expected Routing:${NC}"
echo -e "  - Agent Router detects pattern: /tell.*me.*horizon|horizon.*tell.*me/i"
echo -e "  - Routes to EDIcraft agent"
echo -e "${YELLOW}Expected Response:${NC}"
echo -e "  - Horizon name from OSDU data"
echo -e "  - Formation information"
echo -e "  - Depth/elevation data\n"

echo -e "${CYAN}Test 3: Coordinate Conversion Query${NC}"
echo -e "${YELLOW}Query:${NC} \"convert to minecraft coordinates\""
echo -e "${YELLOW}Expected Routing:${NC}"
echo -e "  - Agent Router detects pattern: /convert.*to.*minecraft|minecraft.*convert/i"
echo -e "  - Routes to EDIcraft agent"
echo -e "${YELLOW}Expected Response:${NC}"
echo -e "  - Original UTM coordinates"
echo -e "  - Converted Minecraft coordinates"
echo -e "  - Coordinate transformation explanation\n"

echo -e "${CYAN}Test 4: Complex Horizon Query${NC}"
echo -e "${YELLOW}Query:${NC} \"find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft\""
echo -e "${YELLOW}Expected Routing:${NC}"
echo -e "  - Agent Router detects multiple patterns:"
echo -e "    * /find.*horizon|horizon.*find/i"
echo -e "    * /horizon.*coordinates|coordinates.*horizon/i"
echo -e "    * /horizon.*minecraft|minecraft.*horizon/i"
echo -e "    * /coordinates.*you.*use|coordinates.*to.*use/i"
echo -e "  - Routes to EDIcraft agent (NOT petrophysics)"
echo -e "${YELLOW}Expected Response:${NC}"
echo -e "  - Horizon name: [Name from OSDU]"
echo -e "  - UTM Coordinates:"
echo -e "    * Easting: [X] m"
echo -e "    * Northing: [Y] m"
echo -e "    * Elevation: [Z] m"
echo -e "  - Minecraft Coordinates:"
echo -e "    * X: [minecraft_x]"
echo -e "    * Y: [minecraft_y]"
echo -e "    * Z: [minecraft_z]"
echo -e "  - Next steps for visualization\n"

# Troubleshooting Guide
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Troubleshooting Guide${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${CYAN}If tests fail, check:${NC}\n"

echo -e "${YELLOW}1. Agent Router Patterns${NC}"
echo -e "   File: amplify/functions/agents/agentRouter.ts"
echo -e "   Verify edicraftPatterns array includes:"
echo -e "   - /find.*horizon|horizon.*find/i"
echo -e "   - /get.*horizon|horizon.*name/i"
echo -e "   - /convert.*coordinates|coordinates.*convert/i"
echo -e "   - /horizon.*coordinates|coordinates.*horizon/i"
echo -e "   - /horizon.*minecraft|minecraft.*horizon/i\n"

echo -e "${YELLOW}2. Pattern Matching Logs${NC}"
echo -e "   Check CloudWatch logs for:"
echo -e "   - '🎮 AgentRouter: EDIcraft pattern MATCHED: [pattern]'"
echo -e "   - '🎮 AgentRouter: Query excerpt: [query]'"
echo -e "   - '🎮 AgentRouter: EDIcraft agent selected'\n"

echo -e "${YELLOW}3. EDIcraft Handler${NC}"
echo -e "   File: amplify/functions/edicraftAgent/handler.ts"
echo -e "   Check logs for:"
echo -e "   - '🎮 Processing EDIcraft message: [query]'"
echo -e "   - '🎮 EDIcraft agent response received'"
echo -e "   - Response includes horizon data\n"

echo -e "${YELLOW}4. Environment Variables${NC}"
echo -e "   Verify these are set in Lambda:"
echo -e "   - BEDROCK_AGENT_ID"
echo -e "   - BEDROCK_AGENT_ALIAS_ID"
echo -e "   - BEDROCK_REGION"
echo -e "   - MINECRAFT_HOST"
echo -e "   - MINECRAFT_RCON_PASSWORD"
echo -e "   - EDI_USERNAME (OSDU)"
echo -e "   - EDI_PASSWORD (OSDU)\n"

echo -e "${YELLOW}5. Deployment Status${NC}"
echo -e "   Ensure sandbox is running:"
echo -e "   - Run: npx ampx sandbox"
echo -e "   - Wait for 'Deployed' message"
echo -e "   - Verify no deployment errors\n"

echo -e "${YELLOW}6. Common Issues${NC}"
echo -e "   ${RED}Issue:${NC} Query routes to petrophysics agent"
echo -e "   ${GREEN}Fix:${NC} Add more specific horizon patterns to edicraftPatterns"
echo -e ""
echo -e "   ${RED}Issue:${NC} Pattern not matching"
echo -e "   ${GREEN}Fix:${NC} Test regex at regex101.com, adjust pattern"
echo -e ""
echo -e "   ${RED}Issue:${NC} Response is generic petrophysics message"
echo -e "   ${GREEN}Fix:${NC} Verify routing logs show EDIcraft selection"
echo -e ""
echo -e "   ${RED}Issue:${NC} No horizon data in response"
echo -e "   ${GREEN}Fix:${NC} Check OSDU credentials and data availability\n"

# Next Steps
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${CYAN}After running these tests:${NC}\n"

echo -e "1. ${YELLOW}Review CloudWatch Logs${NC}"
echo -e "   - Check agent router logs for pattern matches"
echo -e "   - Verify EDIcraft handler receives queries"
echo -e "   - Check for any error messages\n"

echo -e "2. ${YELLOW}Test in Web UI${NC}"
echo -e "   - Open chat interface"
echo -e "   - Select EDIcraft agent"
echo -e "   - Try each test query"
echo -e "   - Verify responses include horizon data\n"

echo -e "3. ${YELLOW}Verify End-to-End Workflow${NC}"
echo -e "   - Query: 'find a horizon, tell me its name, convert it to minecraft coordinates'"
echo -e "   - Verify routing to EDIcraft"
echo -e "   - Verify response includes:"
echo -e "     * Horizon name"
echo -e "     * UTM coordinates"
echo -e "     * Minecraft coordinates"
echo -e "   - Verify thought steps show proper execution\n"

echo -e "4. ${YELLOW}Document Results${NC}"
echo -e "   - Record which queries work"
echo -e "   - Note any failures"
echo -e "   - Update patterns if needed"
echo -e "   - Create regression tests\n"

echo -e "${GREEN}Test script complete!${NC}\n"

# Cleanup
rm -f /tmp/test-output.txt
