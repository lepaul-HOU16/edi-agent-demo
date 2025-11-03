#!/usr/bin/env python3
"""
Final test of MCP server functionality
"""
import sys
import os
import importlib.util

def test_mcp_server():
    """Test MCP server by loading the module directly"""
    try:
        # Load the MCP server module
        spec = importlib.util.spec_from_file_location("mcp_server", "mcp-well-data-server.py")
        mcp_module = importlib.util.module_from_spec(spec)
        
        print("✓ Loading MCP server module...")
        
        # Execute the module (this will run load_well_data())
        spec.loader.exec_module(mcp_module)
        
        print("✓ MCP server module loaded successfully")
        
        # Check the loaded data
        well_data = mcp_module.WELL_DATA
        print(f"✓ Well data loaded: {len(well_data)} wells")
        
        for well_name, well_obj in well_data.items():
            curves_count = len(well_obj.data) if well_obj.data else 0
            print(f"   - {well_name}: {curves_count} curves")
            
            if well_obj.data and curves_count > 0:
                curves = list(well_obj.data.keys())
                sample_curve = curves[0]
                data_points = len(well_obj.data[sample_curve])
                print(f"     Sample: '{sample_curve}' has {data_points} data points")
        
        # Check if server object exists
        if hasattr(mcp_module, 'server'):
            print(f"✓ MCP server object created: {type(mcp_module.server)}")
        
        return len(well_data) > 0
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Final MCP Server Test")
    print("=" * 30)
    
    success = test_mcp_server()
    
    print("\n" + "=" * 30)
    if success:
        print("🎉 SUCCESS! MCP server is ready!")
        print("\nWhat works:")
        print("✓ S3 connection")
        print("✓ .las file download")
        print("✓ Data parsing")
        print("✓ Server initialization")
        print("\nNext: Restart Kiro to use the updated MCP server")
    else:
        print("❌ Test failed - check errors above")