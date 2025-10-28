#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tools.trajectory_tools import calculate_trajectory_coordinates, build_wellbore_in_minecraft
import json

def generate_diagonal_horizontal_wellbore():
    """Generate a wellbore with vertical, diagonal, and horizontal sections"""
    survey_data = [
        # Vertical section (0-500m)
        {"tvd": 0.0, "azimuth": 45.0, "inclination": 0.0},
        {"tvd": 500.0, "azimuth": 45.0, "inclination": 0.0},
        
        # Diagonal section (500-1200m) - building angle to 60°
        {"tvd": 800.0, "azimuth": 45.0, "inclination": 30.0},
        {"tvd": 1200.0, "azimuth": 45.0, "inclination": 60.0},
        
        # Horizontal section (1200-1800m) - 90° inclination
        {"tvd": 1200.0, "azimuth": 45.0, "inclination": 90.0},
        {"tvd": 1200.0, "azimuth": 45.0, "inclination": 90.0}
    ]
    
    return survey_data

def main():
    print("=== DIAGONAL & HORIZONTAL WELLBORE TEST ===\n")
    
    # Step 1: Generate input data
    print("Step 1: Generated Survey Data (Vertical → Diagonal → Horizontal)")
    survey_data = generate_diagonal_horizontal_wellbore()
    print("Survey Points:")
    for i, point in enumerate(survey_data):
        print(f"  Point {i}: TVD={point['tvd']:6.1f}m, Az={point['azimuth']:5.1f}°, Inc={point['inclination']:5.1f}°")
    
    # Step 2: Calculate 3D coordinates
    print("\nStep 2: Calculate 3D Coordinates from Survey Data")
    start_northing = 3000.0
    start_easting = 3000.0  
    start_elevation = 0.0
    
    survey_json = json.dumps(survey_data)
    coordinates_result = calculate_trajectory_coordinates(
        survey_json, 
        start_x=start_easting,
        start_y=start_northing,
        start_z=start_elevation
    )
    
    coordinates_data = json.loads(coordinates_result)
    print(f"Generated {coordinates_data['total_points']} interpolated points")
    print(f"Real World Coordinates (first 10 points):")
    for i in range(min(10, len(coordinates_data['world_coordinates']))):
        coord = coordinates_data['world_coordinates'][i]
        print(f"  Point {i}: X={coord['x']:7.1f}, Y={coord['y']:7.1f}, Z={coord['z']:7.1f}")
    
    print(f"\nTrajectory Stats:")
    print(f"  Max Depth: {coordinates_data['trajectory_stats']['max_depth']}m")
    print(f"  Horizontal Displacement: {coordinates_data['trajectory_stats']['horizontal_displacement']:.1f}m")
    
    # Step 3: Show Minecraft coordinates
    print("\nStep 3: Minecraft Coordinates (first 10 points)")
    minecraft_coords = coordinates_data['minecraft_coordinates']
    for i in range(min(10, len(minecraft_coords))):
        coord = minecraft_coords[i]
        print(f"  Point {i}: X={coord['x']:3.0f}, Y={coord['y']:3.0f}, Z={coord['z']:3.0f}")
    
    # Step 4: Deduplication and build
    print("\nStep 4: Generate Minecraft Build Commands (with duplicate removal)")
    minecraft_coords_json = json.dumps({"minecraft_coordinates": minecraft_coords})
    
    # Show duplicate removal
    unique_coords = []
    seen = set()
    for coord in minecraft_coords:
        pos = (coord['x'], coord['y'], coord['z'])
        if pos not in seen:
            seen.add(pos)
            unique_coords.append(coord)
    
    print(f"Original coordinates: {len(minecraft_coords)} points")
    print(f"Unique coordinates: {len(unique_coords)} points")
    print(f"Duplicates removed: {len(minecraft_coords) - len(unique_coords)} points")
    
    print(f"\nAll {len(unique_coords)} unique Minecraft coordinates:")
    for i, coord in enumerate(unique_coords):
        print(f"  Block {i+1:2d}: X={coord['x']:3.0f}, Y={coord['y']:3.0f}, Z={coord['z']:3.0f}")
    
    build_result = build_wellbore_in_minecraft(minecraft_coords_json, "blue_concrete")
    
    print(f"\nBuild commands generated successfully!")
    print(f"RCON command will place {len(unique_coords)} unique blue_concrete blocks")
    print("The diagonal/horizontal wellbore trajectory is ready to be built in Minecraft!")

if __name__ == "__main__":
    main()
