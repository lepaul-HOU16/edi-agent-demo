#!/bin/bash
# MCP Server startup script using uvx

# Set absolute paths
export PATH="/Users/lepaul/.local/bin:$PATH"
SCRIPT_DIR="/Users/lepaul/Dev/prototypes/edi-agent-demo"

# Change to script directory
cd "$SCRIPT_DIR" || exit 1

# Check if uvx is available
if ! command -v uvx &> /dev/null; then
    echo "Error: uvx not found in PATH" >&2
    exit 1
fi

# Check if MCP server file exists
if [ ! -f "mcp-well-data-server.py" ]; then
    echo "Error: mcp-well-data-server.py not found in $SCRIPT_DIR" >&2
    exit 1
fi

# Run the MCP server with uvx
exec uvx --from . python mcp-well-data-server.py