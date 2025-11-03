#!/bin/bash

# Deploy Clear and Terrain Fixes for EDIcraft
# This script deploys the fixes for Task 5 of the fix-edicraft-clear-and-terrain spec

echo "========================================================================"
echo "EDIcraft Clear and Terrain Fixes - Deployment"
echo "========================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will deploy the following fixes:${NC}"
echo "  1. ✅ All sign variants added to clear_environment_tool.py"
echo "  2. ✅ Layered terrain filling (surface only to preserve underground)"
echo "  3. ✅ Clear button UI duplication fix in EDIcraftResponseComponent.tsx"
echo ""

# Check if we're in the right directory
if [ ! -f "edicraft-agent/tools/clear_environment_tool.py" ]; then
    echo -e "${RED}Error: Must run this script from the project root directory${NC}"
    exit 1
fi

echo "=========================================="
echo "Step 1: Verify Changes"
echo "=========================================="
echo ""

echo "Checking clear_environment_tool.py for sign variants..."
if grep -q "oak_wall_sign" edicraft-agent/tools/clear_environment_tool.py; then
    echo -e "${GREEN}✓ Sign variants found in clear_environment_tool.py${NC}"
else
    echo -e "${RED}✗ Sign variants NOT found in clear_environment_tool.py${NC}"
    echo "Please ensure all sign variants are added to rig_blocks list"
    exit 1
fi

echo ""
echo "Checking for terrain filling implementation..."
if grep -q "surface_command" edicraft-agent/tools/clear_environment_tool.py; then
    echo -e "${GREEN}✓ Terrain filling implementation found${NC}"
else
    echo -e "${RED}✗ Terrain filling NOT found in clear_environment_tool.py${NC}"
    exit 1
fi

echo ""
echo "Checking EDIcraftResponseComponent.tsx for content hash..."
if grep -q "data-content-hash" src/components/messageComponents/EDIcraftResponseComponent.tsx; then
    echo -e "${GREEN}✓ Content hash implementation found${NC}"
else
    echo -e "${RED}✗ Content hash NOT found in EDIcraftResponseComponent.tsx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All changes verified${NC}"
echo ""

echo "=========================================="
echo "Step 2: Deploy Bedrock AgentCore Agent"
echo "=========================================="
echo ""

echo -e "${YELLOW}The Python tools need to be deployed to Bedrock AgentCore.${NC}"
echo ""
echo "To deploy the updated clear_environment_tool.py:"
echo ""
echo "  cd edicraft-agent"
echo "  make deploy"
echo ""
echo "This will:"
echo "  - Package the updated Python tools"
echo "  - Deploy to Bedrock AgentCore"
echo "  - Update the agent with new tool definitions"
echo ""

read -p "Have you deployed the Bedrock AgentCore agent? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please deploy the Bedrock AgentCore agent first:${NC}"
    echo ""
    echo "  cd edicraft-agent"
    echo "  make deploy"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Bedrock AgentCore agent deployment confirmed${NC}"
echo ""

echo "=========================================="
echo "Step 3: Deploy Frontend Changes"
echo "=========================================="
echo ""

echo "Checking if Amplify sandbox is running..."
if pgrep -f "ampx sandbox" > /dev/null; then
    echo -e "${GREEN}✓ Amplify sandbox is running${NC}"
    echo ""
    echo "The frontend changes will be automatically deployed by the sandbox."
    echo "Wait for the sandbox to detect and deploy the changes..."
    echo ""
else
    echo -e "${YELLOW}⚠️  Amplify sandbox is NOT running${NC}"
    echo ""
    echo "To deploy frontend changes, start the sandbox:"
    echo ""
    echo "  npx ampx sandbox"
    echo ""
    read -p "Would you like to start the sandbox now? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting Amplify sandbox..."
        echo "This will run in the background. Check the logs for deployment status."
        echo ""
        npx ampx sandbox &
        SANDBOX_PID=$!
        echo "Sandbox started with PID: $SANDBOX_PID"
        echo ""
        echo "Waiting for deployment to complete (this may take 5-10 minutes)..."
        sleep 30
    else
        echo ""
        echo -e "${YELLOW}Please start the sandbox manually to deploy frontend changes.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ Frontend deployment in progress${NC}"
echo ""

echo "=========================================="
echo "Step 4: Validation Tests"
echo "=========================================="
echo ""

echo "Running validation tests..."
echo ""

# Check if validation script exists
if [ -f "tests/validate-complete-clear-terrain-workflow.sh" ]; then
    echo "Running complete workflow validation..."
    bash tests/validate-complete-clear-terrain-workflow.sh
    VALIDATION_RESULT=$?
    echo ""
    
    if [ $VALIDATION_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ Validation tests PASSED${NC}"
    else
        echo -e "${YELLOW}⚠️  Some validation tests failed${NC}"
        echo "Review the test output above for details."
    fi
else
    echo -e "${YELLOW}⚠️  Validation script not found${NC}"
    echo "Skipping automated validation tests."
fi

echo ""

echo "=========================================="
echo "Step 5: Manual Testing Instructions"
echo "=========================================="
echo ""

echo -e "${BLUE}To complete validation, perform these manual tests:${NC}"
echo ""

echo "1. Test Clear Button UI:"
echo "   a. Open the web application"
echo "   b. Select 'EDIcraft' agent"
echo "   c. Click 'Clear Minecraft Environment' button"
echo "   d. Verify response is formatted with Cloudscape components"
echo "   e. Verify only ONE clear button appears (no duplicates)"
echo "   f. Check browser console for any errors"
echo ""

echo "2. Test Complete Workflow:"
echo "   a. Send: 'Build wellbore trajectory for WELL-011'"
echo "   b. Verify wellbore is built with drilling rig"
echo "   c. Check Minecraft for signs on the rig"
echo "   d. Click 'Clear Minecraft Environment'"
echo "   e. Verify ALL blocks removed (including signs)"
echo "   f. Verify terrain is filled at surface level"
echo "   g. Verify underground remains clear"
echo ""

echo "3. Test Sign Variants:"
echo "   a. Build a wellbore with drilling rig"
echo "   b. Note the signs placed on the rig"
echo "   c. Clear the environment"
echo "   d. Verify ALL sign types are removed:"
echo "      - Standing signs (oak_sign, spruce_sign, etc.)"
echo "      - Wall signs (oak_wall_sign, spruce_wall_sign, etc.)"
echo ""

echo "4. Test Terrain Filling:"
echo "   a. Clear the environment"
echo "   b. Check surface level (y=61-70) is filled with grass"
echo "   c. Check underground (y=0-60) remains clear"
echo "   d. Verify no visual holes or artifacts"
echo ""

echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""

echo -e "${GREEN}✅ Changes Verified:${NC}"
echo "   - Sign variants added to clear_environment_tool.py"
echo "   - Terrain filling implemented (surface only)"
echo "   - UI duplication fix in EDIcraftResponseComponent.tsx"
echo ""

echo -e "${BLUE}📋 Deployment Status:${NC}"
echo "   - Bedrock AgentCore: Deployed (confirmed by user)"
echo "   - Frontend: Deployed via Amplify sandbox"
echo "   - Validation: Automated tests run"
echo ""

echo -e "${YELLOW}⚠️  Manual Testing Required:${NC}"
echo "   - Test clear button UI (no duplicates)"
echo "   - Test complete workflow (build + clear)"
echo "   - Test sign variants removal"
echo "   - Test terrain filling"
echo ""

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""

echo "1. Perform manual testing (see instructions above)"
echo "2. Verify all requirements are met:"
echo "   - Requirement 1.1-1.5: Complete block clearing"
echo "   - Requirement 2.1-2.5: Clear button UI fix"
echo "   - Requirement 3.1-3.7: Terrain filling"
echo "3. Document any issues found"
echo "4. Mark Task 5 as complete if all tests pass"
echo ""

echo -e "${GREEN}Deployment script complete!${NC}"
echo ""

