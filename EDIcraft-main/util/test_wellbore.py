#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tools.trajectory_tools import calculate_trajectory_coordinates, build_wellbore_in_minecraft
import json

def generate_straight_wellbore():
    """Generate a straight vertical wellbore from surface to 2000m depth"""
    # For a straight vertical well, inclination = 0, azimuth doesn't matter
    survey_data = [
        {"tvd": 0.0, "azimuth": 0.0, "inclination": 0.0},
        {"tvd": 500.0, "azimuth": 0.0, "inclination": 0.0},
        {"tvd": 1000.0, "azimuth": 0.0, "inclination": 0.0},
        {"tvd": 1500.0, "azimuth": 0.0, "inclination": 0.0},
        {"tvd": 2000.0, "azimuth": 0.0, "inclination": 0.0}
    ]
    
    return survey_data

def main():
    print("=== WELLBORE TRAJECTORY TEST ===\n")
    
    # Step 1: Generate input data
    print("Step 1: Generated Survey Data (TVD, Azimuth, Inclination)")
    survey_data = generate_straight_wellbore()
    print("Survey Points:")
    for i, point in enumerate(survey_data):
        print(f"  Point {i}: TVD={point['tvd']:6.1f}m, Az={point['azimuth']:5.1f}°, Inc={point['inclination']:5.1f}°")
    
    # Step 2: Calculate 3D coordinates from survey data
    print("\nStep 2: Calculate 3D Coordinates from Survey Data")
    # Start at real world coordinates: Northing 3000, Easting 3000, Surface (TVD 0)
    start_northing = 3000.0  # Y in real world
    start_easting = 3000.0   # X in real world  
    start_elevation = 0.0    # Z in real world (surface)
    
    survey_json = json.dumps(survey_data)
    coordinates_result = calculate_trajectory_coordinates(
        survey_json, 
        start_x=start_easting,  # X = Easting
        start_y=start_northing, # Y = Northing
        start_z=start_elevation # Z = Elevation
    )
    
    coordinates_data = json.loads(coordinates_result)
    print(f"Generated {coordinates_data['total_points']} interpolated points")
    print(f"Real World Coordinates (first 10 points):")
    for i in range(min(10, len(coordinates_data['world_coordinates']))):
        coord = coordinates_data['world_coordinates'][i]
        print(f"  Point {i}: X={coord['x']:7.1f}, Y={coord['y']:7.1f}, Z={coord['z']:7.1f}")
    print(f"  ... (showing first 10 of {len(coordinates_data['world_coordinates'])} points)")
    
    print(f"\nTrajectory Stats:")
    print(f"  Max Depth: {coordinates_data['trajectory_stats']['max_depth']}m")
    print(f"  Horizontal Displacement: {coordinates_data['trajectory_stats']['horizontal_displacement']}m")
    
    # Step 3: Show Minecraft coordinates (already calculated by the tool)
    print("\nStep 3: Minecraft Coordinates (first 10 points)")
    minecraft_coords = coordinates_data['minecraft_coordinates']
    for i in range(min(10, len(minecraft_coords))):
        coord = minecraft_coords[i]
        print(f"  Point {i}: X={coord['x']:3.0f}, Y={coord['y']:3.0f}, Z={coord['z']:3.0f}")
    print(f"  ... (showing first 10 of {len(minecraft_coords)} points)")
    
    # Show key coordinate ranges
    y_coords = [coord['y'] for coord in minecraft_coords]
    print(f"\nMinecraft Y-coordinate range: {min(y_coords)} to {max(y_coords)}")
    print(f"This represents drilling from Y={max(y_coords)} (near surface) down to Y={min(y_coords)} (2000m depth)")
    print(f"Ground level is Y=100, so this wellbore goes from Y={max(y_coords)} down to Y={min(y_coords)}")
    
    # Step 4: Build in Minecraft (with duplicate removal)
    print("\nStep 4: Generate Minecraft Build Commands (with duplicate removal)")
    minecraft_coords_json = json.dumps({"minecraft_coordinates": minecraft_coords})
    
    # Show duplicate removal in action
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
    
    build_result = build_wellbore_in_minecraft(minecraft_coords_json, "red_concrete")
    
    print(f"\nBuild commands generated successfully!")
    print(f"RCON command will place {len(unique_coords)} unique red_concrete blocks")
    print("The wellbore trajectory is ready to be built in Minecraft!")

if __name__ == "__main__":
    main()
