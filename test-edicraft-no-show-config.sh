#!/bin/bash
cd edicraft-agent
source venv/bin/activate

echo "=== Testing Agent Without show_config Tool ==="
echo ""
echo "Test: Search for wellbores"
agentcore invoke '{"prompt": "Search for wellbores in OSDU"}' 2>&1 | grep -A 10 "Response:"
