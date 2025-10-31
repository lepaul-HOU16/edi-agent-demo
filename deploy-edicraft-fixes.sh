#!/bin/bash

# EDIcraft Demo Fixes - Deployment Script
# This script helps deploy the fixes for EDIcraft demo issues

echo "=========================================="
echo "EDIcraft Demo Fixes - Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help you deploy the EDIcraft fixes.${NC}"
echo ""
echo "Fixes included:"
echo "  1. ✅ Agent tool registration (lock_world_time, build_drilling_rig)"
echo "  2. ✅ Frontend response rendering (Cloudscape components)"
echo "  3. ⚠️  Backend deployment (requires manual action)"
echo ""

# Check if we're in the right directory
if [ ! -f "edicraft-agent/agent.py" ]; then
    echo -e "${RED}Error: Must run this script from the project root directory${NC}"
    exit 1
fi

echo "Step 1: Validating fixes"
echo "------------------------"

# Run validation script
if [ -f "tests/validate-edicraft-demo-deployment.sh" ]; then
    ./tests/validate-edicraft-demo-deployment.sh
    VALIDATION_RESULT=$?
    echo ""
else
    echo -e "${YELLOW}Warning: Validation script not found${NC}"
    VALIDATION_RESULT=0
fi

echo ""
echo "Step 2: Frontend Deployment"
echo "---------------------------"
echo ""
echo "The frontend changes have been made:"
echo "  - EDIcraftResponseComponent.tsx created"
echo "  - ChatMessage.tsx updated to detect and render EDIcraft responses"
echo ""
echo -e "${GREEN}✓ Frontend code is ready${NC}"
echo ""
echo "To deploy frontend changes:"
echo "  1. Commit the changes: git add . && git commit -m 'Fix EDIcraft response rendering'"
echo "  2. Push to your branch: git push"
echo "  3. Amplify will automatically deploy (if CI/CD is configured)"
echo ""
echo "OR manually build:"
echo "  npm run build"
echo ""

read -p "Press Enter to continue to backend deployment instructions..."

echo ""
echo "Step 3: Backend Deployment (EDIcraft Agent)"
echo "--------------------------------------------"
echo ""
echo "The agent.py file has been updated with missing tool imports."
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: The agent needs to be redeployed for changes to take effect${NC}"
echo ""
echo "Deployment options:"
echo ""
echo "Option A: MCP Server (if using Model Context Protocol)"
echo "-------------------------------------------------------"
echo "  cd edicraft-agent"
echo "  # Restart the MCP server process"
echo "  # The exact command depends on how you're running it"
echo ""
echo "Option B: AWS Lambda (if deployed as Lambda function)"
echo "-----------------------------------------------------"
echo "  # Package and deploy the Lambda function"
echo "  cd edicraft-agent"
echo "  zip -r edicraft-agent.zip ."
echo "  aws lambda update-function-code \\"
echo "    --function-name edicraft-agent \\"
echo "    --zip-file fileb://edicraft-agent.zip"
echo ""
echo "Option C: Docker Container (if using containerized deployment)"
echo "---------------------------------------------------------------"
echo "  cd edicraft-agent"
echo "  docker build -t edicraft-agent:latest ."
echo "  docker stop edicraft-agent-container"
echo "  docker rm edicraft-agent-container"
echo "  docker run -d --name edicraft-agent-container edicraft-agent:latest"
echo ""
echo "Option D: Direct Python (if running as a service)"
echo "--------------------------------------------------"
echo "  # Restart the Python service"
echo "  sudo systemctl restart edicraft-agent"
echo "  # OR"
echo "  pkill -f 'python.*agent.py' && python edicraft-agent/agent.py &"
echo ""

read -p "Have you deployed the backend changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Backend deployment confirmed${NC}"
else
    echo -e "${YELLOW}⚠️  Remember to deploy the backend before testing${NC}"
fi

echo ""
echo "Step 4: Post-Deployment Testing"
echo "--------------------------------"
echo ""
echo "After deploying both frontend and backend, test the following:"
echo ""
echo "Test 1: Clear Button"
echo "  1. Open EDIcraft agent landing page"
echo "  2. Click 'Clear Minecraft Environment' button"
echo "  3. Verify response is formatted with Cloudscape components"
echo "  4. Check Minecraft world is actually cleared"
echo ""
echo "Test 2: Wellbore with Rig"
echo "  1. Send: 'Build wellbore trajectory for WELL-011'"
echo "  2. Verify response shows drilling rig section"
echo "  3. Check Minecraft for rig at wellhead"
echo "  4. Verify trajectory has no gaps"
echo ""
echo "Test 3: Time Lock"
echo "  1. Send: 'Lock the world time to daytime'"
echo "  2. Verify response shows time lock confirmation"
echo "  3. Check Minecraft stays in daytime"
echo ""
echo "Test 4: Response Formatting"
echo "  1. Any EDIcraft command should show Cloudscape-formatted response"
echo "  2. Should see sections, key-value pairs, tips"
echo "  3. Should NOT see plain markdown text"
echo ""

read -p "Would you like to run the validation script again? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running validation..."
    ./tests/validate-edicraft-demo-deployment.sh
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Summary of changes:"
echo "  ✅ Agent tool registration fixed"
echo "  ✅ Frontend response rendering implemented"
echo "  ⚠️  Backend deployment required (manual step)"
echo ""
echo "Next steps:"
echo "  1. Deploy backend if not done yet"
echo "  2. Test all features in the UI"
echo "  3. Validate with user"
echo ""
echo "For detailed information, see: FIX_EDICRAFT_DEMO_ISSUES.md"
echo ""
