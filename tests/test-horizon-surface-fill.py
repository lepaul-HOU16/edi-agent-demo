#!/usr/bin/env python3
"""
Test to demonstrate horizon surface filling (not just lines).
Shows that horizons now fill between lines to create a solid plane.
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

def test_horizon_surface_fill():
    """Test that horizon fills between lines to create a solid surface."""
    from tools.horizon_tools import parse_horizon_file, convert_horizon_to_minecraft
    
    # Sample horizon data with 2 lines (would create strands without cross-line interpolation)
    sample_data = """# Horizon Surface Data
# Point_ID, Line_Number, Easting, Northing, Elevation
1, 100, 500000.0, 4500000.0, -1500.0
2, 100, 500010.0, 4500000.0, -1505.0
3, 100, 500020.0, 4500000.0, -1510.0
4, 101, 500000.0, 4500010.0, -1502.0
5, 101, 500010.0, 4500010.0, -1507.0
6, 101, 500020.0, 4500010.0, -1512.0
"""
    
    print("=" * 60)
    print("HORIZON SURFACE FILL TEST")
    print("=" * 60)
    print()
    
    # Parse coordinates
    parsed = parse_horizon_file(sample_data)
    parsed_data = json.loads(parsed)
    
    original_points = parsed_data['total_points']
    print(f"Original horizon points: {original_points}")
    print(f"  - Line 100: 3 points")
    print(f"  - Line 101: 3 points")
    print()
    
    # Convert to Minecraft (with surface interpolation)
    converted = convert_horizon_to_minecraft(
        horizon_coordinates_json=parsed,
        sample_rate=1,  # Use all points
        base_x=0,
        base_y=100,
        base_z=0
    )
    
    converted_data = json.loads(converted)
    minecraft_points = converted_data['total_minecraft_points']
    
    print(f"After surface interpolation: {minecraft_points} points")
    print()
    
    # Calculate interpolation ratio
    interpolation_ratio = minecraft_points / original_points
    print(f"Interpolation ratio: {interpolation_ratio:.1f}x")
    print()
    
    # Analyze coordinate distribution
    coords = converted_data['minecraft_coordinates']
    x_coords = [c['x'] for c in coords]
    z_coords = [c['z'] for c in coords]
    
    unique_x = len(set(x_coords))
    unique_z = len(set(z_coords))
    
    print(f"Coordinate distribution:")
    print(f"  - Unique X values: {unique_x}")
    print(f"  - Unique Z values: {unique_z}")
    print(f"  - Coverage: {unique_x} x {unique_z} = {unique_x * unique_z} potential positions")
    print()
    
    print("=" * 60)
    print("RESULT")
    print("=" * 60)
    
    # Check if we have good surface coverage (not just lines)
    if minecraft_points > original_points * 5 and unique_x > 3 and unique_z > 3:
        print("✅ SUCCESS: Horizon is now a SOLID SURFACE (not just strands)")
        print(f"   {original_points} original points → {minecraft_points} interpolated points")
        print(f"   Fills {unique_x} x {unique_z} area - creates a solid plane!")
        return True
    else:
        print("❌ FAIL: Still looks like strands, not a solid surface")
        print(f"   Only {minecraft_points} points from {original_points} original")
        print(f"   Coverage: {unique_x} x {unique_z} - too sparse")
        return False

if __name__ == "__main__":
    success = test_horizon_surface_fill()
    sys.exit(0 if success else 1)
