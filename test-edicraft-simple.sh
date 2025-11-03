#!/bin/bash
cd edicraft-agent
source venv/bin/activate
agentcore invoke '{"prompt": "List players"}' 2>&1
