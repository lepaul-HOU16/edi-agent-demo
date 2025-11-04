#!/usr/bin/env python3
"""
Test to demonstrate horizon interpolation fix.
Shows that horizons are now continuous (solid) instead of dashed.
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

def test_horizon_interpolation():
    """Test that horizon points are interpolated for continuous surface."""
    from tools.horizon_tools import parse_horizon_file, convert_horizon_to_minecraft
    
    # Sample horizon data with 3 points on a line (would create gaps without interpolation)
    sample_data = """# Horizon Surface Data
# Point_ID, Line_Number, Easting, Northing, Elevation
1, 100, 500000.0, 4500000.0, -1500.0
2, 100, 500010.0, 4500000.0, -1505.0
3, 100, 500020.0, 4500000.0, -1510.0
"""
    
    print("=" * 60)
    print("HORIZON INTERPOLATION FIX TEST")
    print("=" * 60)
    print()
    
    # Parse coordinates
    parsed = parse_horizon_file(sample_data)
    parsed_data = json.loads(parsed)
    
    original_points = parsed_data['total_points']
    print(f"Original horizon points: {original_points}")
    print()
    
    # Convert to Minecraft (with interpolation)
    converted = convert_horizon_to_minecraft(
        horizon_coordinates_json=parsed,
        sample_rate=1,  # Use all points
        base_x=0,
        base_y=100,
        base_z=0
    )
    
    converted_data = json.loads(converted)
    minecraft_points = converted_data['total_minecraft_points']
    
    print(f"After interpolation: {minecraft_points} points")
    print()
    
    # Calculate interpolation ratio
    interpolation_ratio = minecraft_points / original_points
    print(f"Interpolation ratio: {interpolation_ratio:.1f}x")
    print()
    
    # Show sample of Minecraft coordinates to demonstrate continuity
    print("Sample Minecraft coordinates (showing continuity):")
    coords = converted_data['minecraft_coordinates'][:10]
    for i, coord in enumerate(coords):
        print(f"  Point {i+1}: ({coord['x']}, {coord['y']}, {coord['z']})")
    
    print()
    print("=" * 60)
    print("RESULT")
    print("=" * 60)
    
    if minecraft_points > original_points * 3:
        print("✅ SUCCESS: Horizon is now CONTINUOUS (solid)")
        print(f"   {original_points} original points → {minecraft_points} interpolated points")
        print("   No gaps between blocks - horizon will appear solid!")
        return True
    else:
        print("❌ FAIL: Not enough interpolation")
        print(f"   Only {minecraft_points} points from {original_points} original")
        return False

if __name__ == "__main__":
    success = test_horizon_interpolation()
    sys.exit(0 if success else 1)
