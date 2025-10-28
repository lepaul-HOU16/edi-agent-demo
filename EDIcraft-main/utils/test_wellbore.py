#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.trajectory_tools import calculate_trajectory_coordinates
from tools.coordinates import transform_trajectory_to_minecraft
import json

def test_vertical_wellbore():
    """Test a simple vertical wellbore from surface to 2000m depth."""
    
    print("=== Testing Vertical Wellbore ===")
    print("Real world: Northing-Easting (3000, 3000) at surface to 2000m straight down")
    print()
    
    # Create survey data for vertical wellbore
    # TVD = True Vertical Depth, Azimuth = direction, Inclination = angle from vertical
    survey_data = [
        {"tvd": 0, "azimuth": 0, "inclination": 0},      # Surface
        {"tvd": 500, "azimuth": 0, "inclination": 0},    # 500m down
        {"tvd": 1000, "azimuth": 0, "inclination": 0},   # 1000m down
        {"tvd": 1500, "azimuth": 0, "inclination": 0},   # 1500m down
        {"tvd": 2000, "azimuth": 0, "inclination": 0}    # 2000m down (target)
    ]
    
    print("Survey data:")
    for i, point in enumerate(survey_data):
        print(f"  Station {i+1}: TVD={point['tvd']}m, Az={point['azimuth']}°, Inc={point['inclination']}°")
    print()
    
    # Calculate 3D coordinates (starting at 3000, 3000, 0)
    coords_result = calculate_trajectory_coordinates(
        json.dumps(survey_data), 
        start_x=3000,  # Easting
        start_y=3000,  # Northing  
        start_z=0      # Surface elevation
    )
    
    # Parse the result
    coords_data = json.loads(coords_result)
    world_coords = coords_data["world_coordinates"]
    minecraft_coords = coords_data["minecraft_coordinates"]
    
    print(f"Generated {len(world_coords)} world coordinates")
    print(f"Generated {len(minecraft_coords)} minecraft coordinates")
    print()
    
    print("World coordinates (first 5 and last 5):")
    for i in range(min(5, len(world_coords))):
        coord = world_coords[i]
        print(f"  Point {i+1}: x={coord['x']:.1f}, y={coord['y']:.1f}, z={coord['z']:.1f}")
    if len(world_coords) > 10:
        print("  ...")
        for i in range(max(0, len(world_coords)-5), len(world_coords)):
            coord = world_coords[i]
            print(f"  Point {i+1}: x={coord['x']:.1f}, y={coord['y']:.1f}, z={coord['z']:.1f}")
    print()
    
    print("Minecraft coordinates (first 5 and last 5):")
    for i in range(min(5, len(minecraft_coords))):
        coord = minecraft_coords[i]
        print(f"  Point {i+1}: x={coord['x']}, y={coord['y']}, z={coord['z']}")
    if len(minecraft_coords) > 10:
        print("  ...")
        for i in range(max(0, len(minecraft_coords)-5), len(minecraft_coords)):
            coord = minecraft_coords[i]
            print(f"  Point {i+1}: x={coord['x']}, y={coord['y']}, z={coord['z']}")
    print()
    
    print("Trajectory stats:")
    stats = coords_data["trajectory_stats"]
    print(f"  Max depth: {stats['max_depth']:.1f}m")
    print(f"  Horizontal displacement: {stats['horizontal_displacement']:.1f}m")
    print()
    
    # Check Y-axis direction
    mc_y_values = [coord['y'] for coord in minecraft_coords]
    print("Minecraft Y-axis analysis:")
    print(f"  Y range: {min(mc_y_values)} to {max(mc_y_values)}")
    print(f"  Direction: {'DOWN (correct)' if mc_y_values[0] > mc_y_values[-1] else 'UP (wrong)'}")
    
    return coords_result

if __name__ == "__main__":
    test_vertical_wellbore()
