#!/bin/bash
# Fetch MCP Server startup script

# Add uv to PATH
export PATH="$HOME/.local/bin:$PATH"

# Check if uvx is available
if ! command -v uvx &> /dev/null; then
    echo "Error: uvx not found in PATH" >&2
    exit 1
fi

# Run the fetch MCP server
exec uvx mcp-server-fetch