import math
import csv
import io
import json
from typing import List, Tuple, Dict, Any
from strands import tool

@tool
def calculate_trajectory_coordinates(survey_data_json: str, start_x: float = 0, start_y: float = 0, start_z: float = 0) -> str:
    """
    Calculate 3D coordinates from wellbore survey data (TVD, Azimuth, Inclination).
    
    Args:
        survey_data_json: JSON string of survey points: [{"tvd": 25, "azimuth": 310.2, "inclination": 0.18}, ...]
        start_x: Starting X coordinate (default 0)
        start_y: Starting Y coordinate (default 0) 
        start_z: Starting Z coordinate (default 0)
    
    Returns:
        JSON string with calculated coordinates and Minecraft positions
    """
    import json
    
    try:
        survey_points = json.loads(survey_data_json)
        
        coordinates = [(start_x, start_y, start_z)]
        
        for i in range(1, len(survey_points)):
            prev = survey_points[i-1]
            curr = survey_points[i]
            
            prev_tvd, prev_az, prev_inc = prev['tvd'], prev['azimuth'], prev['inclination']
            curr_tvd, curr_az, curr_inc = curr['tvd'], curr['azimuth'], curr['inclination']
            
            # Calculate segment between survey points
            depth_diff = curr_tvd - prev_tvd
            
            # Average angles (minimum curvature method)
            avg_azimuth = math.radians((prev_az + curr_az) / 2)
            avg_inclination = math.radians((prev_inc + curr_inc) / 2)
            
            # Calculate 3D displacement
            dz = depth_diff * math.cos(avg_inclination)
            horizontal_dist = depth_diff * math.sin(avg_inclination)
            dx = horizontal_dist * math.sin(avg_azimuth)  # East
            dy = horizontal_dist * math.cos(avg_azimuth)  # North
            
            # Get previous position
            prev_x, prev_y, prev_z = coordinates[-1]
            
            # Interpolate points along the segment for continuous path
            segment_length = math.sqrt(dx*dx + dy*dy + dz*dz)
            num_points = max(2, int(segment_length / 2))  # Point every 2 units
            
            for j in range(1, num_points + 1):
                t = j / num_points
                interp_x = prev_x + dx * t
                interp_y = prev_y + dy * t
                interp_z = prev_z + dz * t
                coordinates.append((interp_x, interp_y, interp_z))
        
        # Use smart scaling for trajectories
        from .coordinates import transform_trajectory_to_minecraft
        minecraft_coords = transform_trajectory_to_minecraft(coordinates)
        minecraft_coords_dict = [{"x": x, "y": y, "z": z} for x, y, z in minecraft_coords]
        
        result = {
            "total_points": len(coordinates),
            "world_coordinates": [{"x": x, "y": y, "z": z} for x, y, z in coordinates],
            "minecraft_coordinates": minecraft_coords_dict,
            "trajectory_stats": {
                "max_depth": max(z for _, _, z in coordinates),
                "horizontal_displacement": ((coordinates[-1][0] - coordinates[0][0])**2 + 
                                         (coordinates[-1][1] - coordinates[0][1])**2)**0.5
            }
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return f"Error calculating coordinates: {str(e)}"

@tool
def parse_osdu_trajectory_file(file_content: str) -> str:
    """
    Parse OSDU trajectory CSV file and extract survey data (TVD, Azimuth, Inclination).
    
    Args:
        file_content: CSV content from OSDU trajectory file
    
    Returns:
        JSON string with parsed survey data ready for coordinate calculation
    """
    try:
        lines = file_content.strip().split('\n')
        if not lines:
            return "Error: Empty file content"
        
        # Parse CSV
        survey_data = []
        reader = csv.reader(io.StringIO(file_content))
        header = next(reader)
        
        for row in reader:
            if len(row) >= 6 and row[2] and row[3] and row[4] and row[5]:
                try:
                    measured_depth = float(row[2]) if row[2] else 0
                    tvd = float(row[3])
                    azimuth = float(row[4])
                    inclination = float(row[5])
                    
                    survey_data.append({
                        "measured_depth": measured_depth,
                        "tvd": tvd,
                        "azimuth": azimuth,
                        "inclination": inclination,
                        "well_name": row[1] if len(row) > 1 else "Unknown"
                    })
                except ValueError:
                    continue
        
        if not survey_data:
            return "Error: No valid survey data found in file"
        
        result = {
            "total_survey_points": len(survey_data),
            "well_name": survey_data[0]["well_name"] if survey_data else "Unknown",
            "depth_range": {
                "min_tvd": min(p["tvd"] for p in survey_data),
                "max_tvd": max(p["tvd"] for p in survey_data)
            },
            "survey_data": survey_data
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return f"Error parsing trajectory file: {str(e)}"

@tool
def build_wellbore_in_minecraft(minecraft_coordinates_json: str, block_type: str = "obsidian") -> str:
    """
    Build complete wellbore trajectory in Minecraft using RCON commands.
    
    Args:
        minecraft_coordinates_json: JSON string with minecraft coordinates from calculate_trajectory_coordinates
        block_type: Minecraft block type to use (default: obsidian)
    
    Returns:
        String with RCON execution results for the complete wellbore
    """
    import json
    from .rcon_tool import execute_rcon_command
    
    try:
        data = json.loads(minecraft_coordinates_json)
        coords = data.get("minecraft_coordinates", [])
        
        if not coords:
            return "Error: No minecraft coordinates found"
        
        # Remove duplicates by converting to set of tuples, then back to list
        unique_coords = []
        seen = set()
        for coord in coords:
            pos = (coord["x"], coord["y"], coord["z"])
            if pos not in seen:
                seen.add(pos)
                unique_coords.append(coord)
        
        results = []
        results.append(f"Building wellbore with {len(unique_coords)} unique points (from {len(coords)} total) using {block_type}")
        
        # Clear area first
        clear_result = execute_rcon_command("fill 15 50 15 45 100 45 air")
        results.append(f"Cleared area: {clear_result}")
        
        # Build complete wellbore path with RCON calls
        for i, coord in enumerate(unique_coords):
            x, y, z = coord["x"], coord["y"], coord["z"]
            
            # Place wellbore block
            block_result = execute_rcon_command(f"setblock {x} {y} {z} {block_type}")
            
            # Add markers every 10 points
            if i % 10 == 0:
                marker_result = execute_rcon_command(f"setblock {x} {y+1} {z} glowstone")
                results.append(f"Marker {i//10 + 1}: {marker_result}")
        
        # Add surface marker at wellhead (ground level Y=100)
        if unique_coords:
            first_coord = unique_coords[0]
            wellhead_result = execute_rcon_command(f"setblock {first_coord['x']} 100 {first_coord['z']} emerald_block")
            results.append(f"Wellhead marker at ground level Y=100: {wellhead_result}")
        
        # Completion message
        completion_result = execute_rcon_command("say Continuous wellbore trajectory completed!")
        results.append(f"Completion: {completion_result}")
        
        return f"Wellbore built successfully with {len(unique_coords)} unique blocks. " + "; ".join(results)
        
    except Exception as e:
        return f"Error building wellbore: {str(e)}"
        
    except Exception as e:
        return f"Error generating Minecraft commands: {str(e)}"
