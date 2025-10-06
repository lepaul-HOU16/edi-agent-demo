#!/usr/bin/env python3
"""
Test MCP server data loading without asyncio conflicts
"""
import sys
import os

def test_data_loading():
    """Test just the data loading part"""
    try:
        # Import required modules
        sys.path.append('.')
        
        # Import the functions we need
        from mcp_well_data_server import load_well_data, WELL_DATA
        
        print("✓ MCP server modules imported successfully")
        
        # Load the well data
        load_well_data()
        
        print(f"✓ Well data loaded: {len(WELL_DATA)} wells")
        
        for well_name, well_obj in WELL_DATA.items():
            curves_count = len(well_obj.data) if well_obj.data else 0
            print(f"   - {well_name}: {curves_count} curves")
            
            if well_obj.data and curves_count > 0:
                curves = list(well_obj.data.keys())
                sample_curve = curves[0]
                data_points = len(well_obj.data[sample_curve])
                print(f"     Sample curve '{sample_curve}': {data_points} data points")
                print(f"     All curves: {', '.join(curves)}")
        
        return len(WELL_DATA) > 0
        
    except Exception as e:
        print(f"✗ Error testing data loading: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing MCP Server Data Loading")
    print("=" * 45)
    
    success = test_data_loading()
    
    print("\n" + "=" * 45)
    if success:
        print("✅ MCP server data loading test passed!")
        print("\nThe server can successfully:")
        print("- Connect to S3")
        print("- Download .las files")
        print("- Parse well log data")
        print("- Load data into memory")
        print("\nReady to use with Kiro!")
    else:
        print("❌ MCP server data loading test failed.")
        print("Check the error messages above.")