#!/bin/bash
cd edicraft-agent
source venv/bin/activate
echo "Testing: Search for wellbores"
agentcore invoke '{"prompt": "Search for wellbores in OSDU"}' 2>&1 | tail -20
