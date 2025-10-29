#!/bin/bash

echo "=== Watching Agent Lambda Logs ==="
echo "Waiting for new log entries..."
echo "Send a message with EDIcraft selected now..."
echo ""

# Watch the agent Lambda logs
aws logs tail /aws/lambda/amplify-digitalassistant-lepau-agentlambda15AE88A1-4otjm3z9IJTd --follow --format short --filter-pattern "AgentRouter OR selectedAgent OR edicraft OR Routing"
