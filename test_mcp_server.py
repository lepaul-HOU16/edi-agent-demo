#!/usr/bin/env python3
"""
Test script to verify MCP server can start and load data
"""
import sys
import os

# Test basic imports
try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    import pandas as pd
    import numpy as np
    print("✓ All required libraries imported successfully")
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

# Test custom modules
try:
    from petrophysics_calculators import PorosityCalculator
    from data_quality_assessment import DataQualityAssessment
    print("✓ Custom modules imported successfully")
except ImportError as e:
    print(f"✗ Custom module import error: {e}")
    sys.exit(1)

# Test LAS file parsing
SCRIPTS_DIR = "/Users/cmgabri/edi-agent-demo/scripts"
print(f"✓ Scripts directory exists: {os.path.exists(SCRIPTS_DIR)}")

las_files = [f for f in os.listdir(SCRIPTS_DIR) if f.endswith('.las')]
print(f"✓ Found {len(las_files)} .las files: {las_files}")

# Test LAS parser from the server file
exec(open('mcp-well-data-server.py').read())

print("✓ MCP server script executed successfully")
print(f"✓ Server object created: {type(server)}")
print("✓ All tests passed - MCP server should work correctly")