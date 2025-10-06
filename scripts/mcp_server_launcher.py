#!/usr/bin/env python3
"""
MCP Server Launcher - ensures proper working directory and environment
"""
import os
import sys
import subprocess

# Change to the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Add the script directory to Python path
sys.path.insert(0, script_dir)

# Set environment variables
os.environ['PYTHONPATH'] = script_dir

# Launch the MCP server
try:
    # Import and run the server directly
    exec(open('mcp-well-data-server.py').read())
except Exception as e:
    print(f"Error launching MCP server: {e}", file=sys.stderr)
    sys.exit(1)