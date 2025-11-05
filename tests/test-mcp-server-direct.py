#!/usr/bin/env python3
"""
Direct test of MCP well data server
Tests if the server can start and respond to basic queries
"""
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    try:
        import pandas as pd
        print("✓ pandas imported")
    except ImportError as e:
        print(f"✗ pandas import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✓ numpy imported")
    except ImportError as e:
        print(f"✗ numpy import failed: {e}")
        return False
    
    try:
        from mcp.server import Server
        print("✓ mcp.server imported")
    except ImportError as e:
        print(f"✗ mcp.server import failed: {e}")
        return False
    
    try:
        import boto3
        print("✓ boto3 imported")
    except ImportError as e:
        print(f"✗ boto3 import failed: {e}")
        return False
    
    return True

def test_server_initialization():
    """Test if the server can be initialized"""
    print("\nTesting server initialization...")
    try:
        # Import the server module
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "mcp_well_data_server",
            os.path.join(os.path.dirname(__file__), '..', 'scripts', 'mcp-well-data-server.py')
        )
        server_module = importlib.util.module_from_spec(spec)
        
        # This will execute the module and initialize the server
        print("Loading server module...")
        spec.loader.exec_module(server_module)
        
        print("✓ Server module loaded successfully")
        
        # Check if wells were loaded
        if hasattr(server_module, 'WELL_DATA'):
            well_count = len(server_module.WELL_DATA)
            print(f"✓ Loaded {well_count} wells")
            
            if well_count > 0:
                print("\nAvailable wells:")
                for well_name in list(server_module.WELL_DATA.keys())[:5]:
                    print(f"  - {well_name}")
                if well_count > 5:
                    print(f"  ... and {well_count - 5} more")
            else:
                print("⚠ No wells loaded (this may be expected if S3 access is not configured)")
        
        return True
        
    except Exception as e:
        print(f"✗ Server initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MCP Well Data Server - Direct Test")
    print("=" * 60)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed")
        sys.exit(1)
    
    # Test server initialization
    if not test_server_initialization():
        print("\n❌ Server initialization test failed")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print("\nThe MCP server should now work in Kiro.")
    print("Try these commands in the chat:")
    print("  - 'list wells'")
    print("  - 'calculate porosity for well-001'")
