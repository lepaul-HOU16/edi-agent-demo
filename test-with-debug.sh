#!/bin/bash
cd edicraft-agent
source venv/bin/activate
agentcore invoke '{"prompt": "Build horizon surface"}' > /dev/null 2>&1 &
sleep 20
aws logs tail /aws/bedrock-agentcore/runtimes/edicraft-kl1b6iGNug-DEFAULT --since 30s --format short 2>&1 | grep -E "DEBUG.*Command.*response|blocks_affected|Blocks placed"
