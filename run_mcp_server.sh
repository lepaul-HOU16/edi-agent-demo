#!/bin/bash
# Wrapper script to run MCP server with proper AWS credentials

# Check if we're in the assumed role session
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Warning: AWS credentials not found in environment"
    echo "Please run 'isen assume lepaul+fedev' first"
fi

# Activate virtual environment
source venv/bin/activate

# Run the MCP server with current environment
exec python3 mcp-well-data-server.py