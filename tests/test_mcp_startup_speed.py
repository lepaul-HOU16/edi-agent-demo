#!/usr/bin/env python3
"""
Test MCP server startup speed with lazy loading
"""
import time
import sys
import importlib.util

def test_startup_speed():
    """Test how fast the server starts with lazy loading"""
    print("Testing MCP server startup speed...")
    
    start_time = time.time()
    
    try:
        # Load the server module
        spec = importlib.util.spec_from_file_location("mcp_server", "mcp-well-data-server.py")
        mcp_module = importlib.util.module_from_spec(spec)
        
        print("Loading server module...")
        spec.loader.exec_module(mcp_module)
        
        startup_time = time.time() - start_time
        print(f"✓ Server started in {startup_time:.2f} seconds")
        
        # Check if data is loaded yet
        print(f"✓ Initial wells loaded: {len(mcp_module.WELL_DATA)}")
        print(f"✓ Data loaded flag: {mcp_module._data_loaded}")
        
        # Test the ensure_data_loaded function
        print("\nTesting lazy data loading...")
        data_load_start = time.time()
        mcp_module.ensure_data_loaded()
        data_load_time = time.time() - data_load_start
        
        print(f"✓ Data loaded in {data_load_time:.2f} seconds")
        print(f"✓ Total wells after loading: {len(mcp_module.WELL_DATA)}")
        
        total_time = time.time() - start_time
        print(f"\n✓ Total time (startup + data loading): {total_time:.2f} seconds")
        
        return startup_time < 2.0  # Server should start in under 2 seconds
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("MCP Server Startup Speed Test")
    print("=" * 40)
    
    success = test_startup_speed()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Startup speed test passed!")
        print("Server should now start quickly for Kiro.")
    else:
        print("❌ Startup speed test failed.")
        print("Server may be too slow for Kiro MCP connection.")