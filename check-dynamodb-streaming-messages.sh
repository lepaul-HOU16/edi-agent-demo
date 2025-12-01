#!/bin/bash

# Check DynamoDB for Stale Streaming Messages
# Identifies streaming messages that weren't cleaned up

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-1"
TABLE_NAME="edi-platform-development-chat-messages"
STALE_THRESHOLD=300  # 5 minutes in seconds

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 DynamoDB Streaming Message Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Table: $TABLE_NAME"
echo "Region: $REGION"
echo "Stale threshold: $STALE_THRESHOLD seconds (5 minutes)"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi

# Calculate cutoff timestamp (5 minutes ago)
CUTOFF_TIME=$(($(date +%s) - STALE_THRESHOLD))

echo -e "${YELLOW}Scanning for streaming messages...${NC}"
echo ""

# Scan for messages with role='ai-stream'
# Note: This is a simplified check. In production, you'd want to scan specific sessions
# or use a GSI if available for better performance

SCAN_OUTPUT=$(aws dynamodb scan \
    --table-name "$TABLE_NAME" \
    --filter-expression "attribute_exists(#role) AND #role = :role" \
    --expression-attribute-names '{"#role":"role"}' \
    --expression-attribute-values '{":role":{"S":"ai-stream"}}' \
    --region "$REGION" \
    --output json 2>/dev/null || echo '{"Items":[],"Count":0}')

TOTAL_STREAMING=$(echo "$SCAN_OUTPUT" | jq -r '.Count // 0')

echo -e "${BLUE}Total streaming messages found: $TOTAL_STREAMING${NC}"
echo ""

if [ "$TOTAL_STREAMING" -eq 0 ]; then
    echo -e "${GREEN}✅ No streaming messages in database${NC}"
    echo -e "${GREEN}Cleanup is working perfectly${NC}"
    echo ""
    exit 0
fi

# Count stale messages (older than 5 minutes)
STALE_COUNT=0
RECENT_COUNT=0

echo "$SCAN_OUTPUT" | jq -r '.Items[] | .timestamp.N' | while read -r timestamp; do
    # Convert milliseconds to seconds
    msg_time=$((timestamp / 1000))
    
    if [ "$msg_time" -lt "$CUTOFF_TIME" ]; then
        STALE_COUNT=$((STALE_COUNT + 1))
    else
        RECENT_COUNT=$((RECENT_COUNT + 1))
    fi
done

# Get actual counts by re-scanning (since while loop runs in subshell)
STALE_COUNT=$(echo "$SCAN_OUTPUT" | jq -r --arg cutoff "$CUTOFF_TIME" '
    [.Items[] | select((.timestamp.N | tonumber / 1000) < ($cutoff | tonumber))] | length
')

RECENT_COUNT=$(echo "$SCAN_OUTPUT" | jq -r --arg cutoff "$CUTOFF_TIME" '
    [.Items[] | select((.timestamp.N | tonumber / 1000) >= ($cutoff | tonumber))] | length
')

echo -e "${BLUE}Message breakdown:${NC}"
echo "  Recent messages (<5 min old): $RECENT_COUNT"
echo "  Stale messages (>5 min old): $STALE_COUNT"
echo ""

if [ "$STALE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No stale messages found${NC}"
    echo -e "${GREEN}All streaming messages are recent (active processing)${NC}"
    echo ""
    exit 0
elif [ "$STALE_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}⚠️  Found $STALE_COUNT stale message(s)${NC}"
    echo -e "${YELLOW}This is acceptable - may be from recent failures${NC}"
    echo ""
    
    # Show details of stale messages
    echo "Stale message details:"
    echo "$SCAN_OUTPUT" | jq -r --arg cutoff "$CUTOFF_TIME" '
        .Items[] | 
        select((.timestamp.N | tonumber / 1000) < ($cutoff | tonumber)) |
        "SessionID: \(.sessionId.S // "unknown"), Timestamp: \(.timestamp.N), Age: \((now - (.timestamp.N | tonumber / 1000)) / 60 | floor) minutes"
    '
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $STALE_COUNT stale messages${NC}"
    echo -e "${RED}Cleanup may not be working correctly${NC}"
    echo ""
    
    # Show details of stale messages
    echo "Stale message details:"
    echo "$SCAN_OUTPUT" | jq -r --arg cutoff "$CUTOFF_TIME" '
        .Items[] | 
        select((.timestamp.N | tonumber / 1000) < ($cutoff | tonumber)) |
        "SessionID: \(.sessionId.S // "unknown"), Timestamp: \(.timestamp.N), Age: \((now - (.timestamp.N | tonumber / 1000)) / 60 | floor) minutes"
    ' | head -n 10
    
    if [ "$STALE_COUNT" -gt 10 ]; then
        echo "... and $((STALE_COUNT - 10)) more"
    fi
    
    echo ""
    echo -e "${YELLOW}Recommended actions:${NC}"
    echo "1. Check CloudWatch logs for cleanup function errors"
    echo "2. Verify cleanup function is being called after responses"
    echo "3. Check if cleanup function has proper DynamoDB permissions"
    echo "4. Consider manual cleanup if accumulation continues"
    echo ""
    exit 1
fi
