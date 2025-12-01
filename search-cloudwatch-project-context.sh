#!/bin/bash

# Search CloudWatch Logs for Project Context Flow
# This script helps trace project context through the system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
CHAT_LOG_GROUP="/aws/lambda/edi-platform-development-chat"
ORCHESTRATOR_LOG_GROUP="/aws/lambda/edi-platform-development-renewable-orchestrator"

# Time range (last 30 minutes by default)
START_TIME=$(($(date +%s) - 1800))000  # 30 minutes ago in milliseconds
END_TIME=$(date +%s)000  # Now in milliseconds

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 CloudWatch Project Context Trace${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to search logs
search_logs() {
    local log_group=$1
    local filter_pattern=$2
    local description=$3
    
    echo -e "${YELLOW}Searching: ${description}${NC}"
    echo -e "${YELLOW}Log Group: ${log_group}${NC}"
    echo -e "${YELLOW}Filter: ${filter_pattern}${NC}"
    echo ""
    
    # Search CloudWatch logs
    aws logs filter-log-events \
        --log-group-name "$log_group" \
        --filter-pattern "$filter_pattern" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --region "$REGION" \
        --query 'events[*].[timestamp,message]' \
        --output text | while IFS=$'\t' read -r timestamp message; do
            # Convert timestamp to readable format
            readable_time=$(date -r $((timestamp / 1000)) '+%Y-%m-%d %H:%M:%S')
            echo -e "${GREEN}[$readable_time]${NC}"
            echo "$message"
            echo ""
        done
    
    echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
    echo ""
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please configure AWS CLI: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo -e "${GREEN}✅ Searching logs from last 30 minutes${NC}"
echo ""

# 1. Search for Chat Handler project context extraction
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  Chat Handler - Project Context Extraction${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
search_logs "$CHAT_LOG_GROUP" "PROJECT CONTEXT EXTRACTION" "Chat Handler extracting project context from request"

# 2. Search for Agent Router project context
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  Agent Router - Project Context in Session${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
search_logs "$CHAT_LOG_GROUP" "PROJECT CONTEXT IN AGENT ROUTER" "Agent Router receiving project context"

# 3. Search for Renewable Proxy Agent project context
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  Renewable Proxy Agent - Project Context Received${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
search_logs "$CHAT_LOG_GROUP" "PROJECT CONTEXT IN RENEWABLE PROXY AGENT" "Renewable Proxy Agent receiving project context"

# 4. Search for Orchestrator context
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4️⃣  Orchestrator - Context in Request${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
search_logs "$ORCHESTRATOR_LOG_GROUP" "context" "Orchestrator receiving context"

# 5. Search for missing context errors
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5️⃣  Missing Context Errors${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
search_logs "$CHAT_LOG_GROUP" "Project Context MISSING" "Missing project context errors"

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Search Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the logs above to trace project context flow"
echo "2. Identify where context is lost (if any)"
echo "3. Document findings in TASK_17_PROJECT_CONTEXT_TRACE_GUIDE.md"
echo "4. Proceed to Task 18 to fix identified issues"
echo ""
echo -e "${YELLOW}To search a different time range:${NC}"
echo "Edit START_TIME and END_TIME variables in this script"
echo ""
echo -e "${YELLOW}To view logs in AWS Console:${NC}"
echo "Chat Handler: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252Fedi-platform-development-chat"
echo "Orchestrator: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252Fedi-platform-development-renewable-orchestrator"
echo ""
