#!/bin/bash
# Robust MCP server startup script with virtual environment

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Error: Virtual environment not found at $SCRIPT_DIR/venv"
    exit 1
fi

# Check if MCP server file exists
if [ ! -f "mcp-well-data-server.py" ]; then
    echo "Error: MCP server file not found at $SCRIPT_DIR/mcp-well-data-server.py"
    exit 1
fi

# Start the MCP server with virtual environment Python
exec ./venv/bin/python mcp-well-data-server.py