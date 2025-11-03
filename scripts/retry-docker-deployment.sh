#!/bin/bash

# Retry Docker Deployment with Exponential Backoff
# Handles transient Docker Hub failures

set -e

echo "🔄 Retry Docker Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

MAX_RETRIES=5
RETRY_COUNT=0
WAIT_TIME=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "📦 Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES"
    echo ""
    
    # Try to build
    if npx ampx sandbox 2>&1 | tee /tmp/amplify-build.log; then
        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        exit 0
    fi
    
    # Check if it's a Docker Hub error
    if grep -q "500 Internal Server Error" /tmp/amplify-build.log || \
       grep -q "unexpected status from HEAD request" /tmp/amplify-build.log; then
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Docker Hub error detected${NC}"
            echo "   Waiting ${WAIT_TIME} seconds before retry..."
            sleep $WAIT_TIME
            
            # Exponential backoff
            WAIT_TIME=$((WAIT_TIME * 2))
        else
            echo ""
            echo -e "${RED}❌ Max retries reached${NC}"
            echo ""
            echo "Docker Hub appears to be having issues."
            echo ""
            echo "Options:"
            echo "1. Wait a few minutes and try again"
            echo "2. Check Docker Hub status: https://status.docker.com/"
            echo "3. Try pulling the image manually:"
            echo "   docker pull amazon/aws-lambda-python:3.12"
            exit 1
        fi
    else
        # Different error, don't retry
        echo ""
        echo -e "${RED}❌ Non-Docker Hub error detected${NC}"
        echo "Check the logs above for details"
        exit 1
    fi
done
