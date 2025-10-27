#!/bin/bash

# Verify HTTPS Fix is Deployed
# Checks if the deployed Lambda contains the HTTPS URL

set -e

echo "🔍 Verifying HTTPS Fix Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get simulation Lambda function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}❌ Simulation Lambda not found${NC}"
    exit 1
fi

echo "📍 Lambda: $FUNCTION_NAME"
echo ""

# Get last modified time
LAST_MODIFIED=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query 'LastModified' --output text)
echo "📅 Last Modified: $LAST_MODIFIED"
echo ""

# Download the Lambda code
echo "📥 Downloading Lambda code..."
CODE_URL=$(aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Code.Location' --output text)

if [ -z "$CODE_URL" ]; then
    echo -e "${RED}❌ Could not get Lambda code URL${NC}"
    exit 1
fi

# Download and extract
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"
curl -s "$CODE_URL" -o lambda.zip
unzip -q lambda.zip

# Check for HTTPS in nrel_wind_client.py
if [ -f "nrel_wind_client.py" ]; then
    echo "✅ Found nrel_wind_client.py"
    echo ""
    
    # Check for HTTPS
    if grep -q "https://developer.nrel.gov" nrel_wind_client.py; then
        echo -e "${GREEN}✅ HTTPS URL FOUND in deployed code!${NC}"
        echo ""
        echo "Deployed URL:"
        grep "developer.nrel.gov/api" nrel_wind_client.py | head -1
        echo ""
        cd - > /dev/null
        rm -rf "$TMP_DIR"
        exit 0
    else
        echo -e "${RED}❌ HTTPS URL NOT FOUND${NC}"
        echo ""
        echo "Found URL:"
        grep "developer.nrel.gov" nrel_wind_client.py | head -1 || echo "No NREL URL found"
        echo ""
        echo -e "${YELLOW}The HTTPS fix has NOT been deployed yet${NC}"
        echo "The Docker image needs to be rebuilt"
        echo ""
        cd - > /dev/null
        rm -rf "$TMP_DIR"
        exit 1
    fi
else
    echo -e "${RED}❌ nrel_wind_client.py not found in Lambda${NC}"
    echo ""
    echo "Files in Lambda:"
    ls -la
    cd - > /dev/null
    rm -rf "$TMP_DIR"
    exit 1
fi
