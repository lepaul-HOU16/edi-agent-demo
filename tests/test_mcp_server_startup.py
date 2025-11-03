#!/usr/bin/env python3
"""
Test MCP server startup and data loading
"""
import sys
import os
import asyncio
import json

# Test the MCP server startup
async def test_mcp_server():
    """Test MCP server initialization"""
    try:
        # Import the server components
        sys.path.append('.')
        
        # Import and test the server
        exec(open('mcp-well-data-server.py').read(), globals())
        
        print("✓ MCP server script loaded successfully")
        
        # Check if well data was loaded
        if 'WELL_DATA' in globals():
            well_data = globals()['WELL_DATA']
            print(f"✓ Well data loaded: {len(well_data)} wells")
            
            for well_name, well_obj in well_data.items():
                print(f"   - {well_name}: {len(well_obj.data) if well_obj.data else 0} curves")
                if well_obj.data:
                    curves = list(well_obj.data.keys())
                    print(f"     Curves: {', '.join(curves[:5])}{'...' if len(curves) > 5 else ''}")
        
        # Check if server object exists
        if 'server' in globals():
            server_obj = globals()['server']
            print(f"✓ MCP server object created: {type(server_obj)}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing MCP server: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing MCP Server Startup")
    print("=" * 40)
    
    success = asyncio.run(test_mcp_server())
    
    print("\n" + "=" * 40)
    if success:
        print("✅ MCP server startup test passed!")
        print("\nThe server should now work with Kiro.")
        print("Restart Kiro to reconnect the MCP server.")
    else:
        print("❌ MCP server startup test failed.")
        print("Check the error messages above.")