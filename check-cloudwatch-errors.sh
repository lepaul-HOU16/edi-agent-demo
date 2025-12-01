#!/bin/bash

# Check CloudWatch Logs for Errors
# Searches for error patterns in Lambda logs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-1"
CHAT_LOG_GROUP="/aws/lambda/edi-platform-development-chat"
ORCHESTRATOR_LOG_GROUP="/aws/lambda/edi-platform-development-renewable-orchestrator"

# Time range (last hour)
START_TIME=$(($(date +%s) - 3600))000  # 1 hour ago in milliseconds
END_TIME=$(date +%s)000  # Now in milliseconds

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 CloudWatch Error Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Time range: Last 1 hour"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi

# Function to count errors in log group
count_errors() {
    local log_group=$1
    local filter_pattern=$2
    local description=$3
    
    echo -e "${YELLOW}Checking: ${description}${NC}"
    
    local count=$(aws logs filter-log-events \
        --log-group-name "$log_group" \
        --filter-pattern "$filter_pattern" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --region "$REGION" \
        --query 'length(events)' \
        --output text 2>/dev/null || echo "0")
    
    if [ "$count" -eq 0 ]; then
        echo -e "${GREEN}✅ No errors found${NC}"
    else
        echo -e "${RED}❌ Found $count error(s)${NC}"
        
        # Show first few errors
        echo "Sample errors:"
        aws logs filter-log-events \
            --log-group-name "$log_group" \
            --filter-pattern "$filter_pattern" \
            --start-time "$START_TIME" \
            --end-time "$END_TIME" \
            --region "$REGION" \
            --max-items 3 \
            --query 'events[*].message' \
            --output text 2>/dev/null || echo "Could not retrieve error details"
    fi
    
    echo ""
    return $count
}

# Initialize error counters
total_errors=0

# Check Chat Lambda errors
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Chat Lambda Errors${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo ""

count_errors "$CHAT_LOG_GROUP" "ERROR" "General errors"
total_errors=$((total_errors + $?))

count_errors "$CHAT_LOG_GROUP" "\"cleanup\" \"error\"" "Cleanup errors"
total_errors=$((total_errors + $?))

count_errors "$CHAT_LOG_GROUP" "\"Project Context MISSING\"" "Missing project context"
total_errors=$((total_errors + $?))

count_errors "$CHAT_LOG_GROUP" "\"streaming\" \"error\"" "Streaming errors"
total_errors=$((total_errors + $?))

count_errors "$CHAT_LOG_GROUP" "timeout" "Timeout errors"
total_errors=$((total_errors + $?))

count_errors "$CHAT_LOG_GROUP" "\"out of memory\"" "Memory errors"
total_errors=$((total_errors + $?))

# Check Orchestrator Lambda errors
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Renewable Orchestrator Errors${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo ""

count_errors "$ORCHESTRATOR_LOG_GROUP" "ERROR" "General errors"
total_errors=$((total_errors + $?))

count_errors "$ORCHESTRATOR_LOG_GROUP" "\"context\" \"error\"" "Context errors"
total_errors=$((total_errors + $?))

count_errors "$ORCHESTRATOR_LOG_GROUP" "timeout" "Timeout errors"
total_errors=$((total_errors + $?))

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $total_errors -eq 0 ]; then
    echo -e "${GREEN}✅ No errors found in the last hour${NC}"
    echo -e "${GREEN}System is healthy${NC}"
else
    echo -e "${RED}❌ Found $total_errors total error(s) in the last hour${NC}"
    echo -e "${YELLOW}⚠️  Review errors above and investigate${NC}"
fi

echo ""
echo "To view full logs in AWS Console:"
echo "Chat: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252Fedi-platform-development-chat"
echo "Orchestrator: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252Fedi-platform-development-renewable-orchestrator"
echo ""

exit $total_errors
