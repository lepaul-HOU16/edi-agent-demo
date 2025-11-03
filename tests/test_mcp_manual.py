#!/usr/bin/env python3
"""
Manual test of MCP server functionality
"""
import asyncio
import json
import sys
import importlib.util

async def test_mcp_server():
    """Test MCP server manually"""
    try:
        # Load the server module
        spec = importlib.util.spec_from_file_location("mcp_server", "mcp-well-data-server.py")
        mcp_module = importlib.util.module_from_spec(spec)
        
        print("✓ Loading MCP server...")
        spec.loader.exec_module(mcp_module)
        
        print("✓ Server loaded successfully")
        print(f"✓ Initial data loaded: {mcp_module._data_loaded}")
        
        # Test the list_wells tool
        print("\n🧪 Testing list_wells tool...")
        result = await mcp_module.call_tool("list_wells", {})
        wells_data = json.loads(result[0].text)
        print(f"✓ Wells found: {len(wells_data.get('wells', []))}")
        
        if wells_data.get('wells'):
            print("✓ Available wells:")
            for well in wells_data['wells'][:5]:  # Show first 5
                print(f"   - {well}")
            if len(wells_data['wells']) > 5:
                print(f"   ... and {len(wells_data['wells']) - 5} more")
        
        # Test get_well_info for first well
        if wells_data.get('wells'):
            test_well = wells_data['wells'][0]
            print(f"\n🧪 Testing get_well_info for {test_well}...")
            result = await mcp_module.call_tool("get_well_info", {"well_name": test_well})
            well_info = json.loads(result[0].text)
            
            if 'error' not in well_info:
                curves = well_info.get('available_curves', [])
                print(f"✓ Curves available: {len(curves)}")
                print(f"✓ Sample curves: {', '.join(curves[:5])}")
            else:
                print(f"✗ Error: {well_info['error']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Manual MCP Server Test")
    print("=" * 30)
    
    success = asyncio.run(test_mcp_server())
    
    print("\n" + "=" * 30)
    if success:
        print("✅ Manual test passed!")
        print("Server should work with Kiro.")
    else:
        print("❌ Manual test failed.")
        print("Check errors above.")