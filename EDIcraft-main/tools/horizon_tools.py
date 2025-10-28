import json
import csv
import io
from typing import List, Tuple, Dict, Any
from strands import tool

@tool
def search_horizons_live() -> str:
    """
    Search for horizon records in OSDU platform with live authentication.
    
    Returns:
        JSON string with found horizon records and their dataset information
    """
    try:
        from .osdu_client import OSDUClient
        
        client = OSDUClient()
        if not client.authenticate():
            return "Error: OSDU authentication failed"
        
        import requests
        
        headers = {
            'Authorization': f'Bearer {client.token}',
            'Content-Type': 'application/json',
            'data-partition-id': 'osdu'
        }
        
        # Search for seismic horizons
        payload = {
            "kind": "osdu:wks:work-product-component--SeismicHorizon:1.0.0",
            "limit": 10,
            "offset": 0
        }
        
        response = requests.post(
            f"{client.platform_url}/api/search/v2/query",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            
            horizon_summary = {
                "total_horizons": len(results),
                "horizons": []
            }
            
            for record in results:
                datasets = record.get('data', {}).get('Datasets', [])
                horizon_info = {
                    "id": record['id'],
                    "datasets": datasets,
                    "dataset_count": len(datasets)
                }
                horizon_summary["horizons"].append(horizon_info)
            
            return json.dumps(horizon_summary, indent=2)
        else:
            return f"Error: OSDU search failed with status {response.status_code}"
            
    except Exception as e:
        return f"Error searching horizons: {str(e)}"

@tool
def parse_horizon_file(file_content: str) -> str:
    """
    Parse OSDU horizon file and extract coordinate data (X, Y, Z points).
    
    Args:
        file_content: Content of horizon file from OSDU
    
    Returns:
        JSON string with parsed coordinate data and statistics
    """
    try:
        lines = file_content.strip().split('\n')
        
        # Find where data starts (skip header comments)
        data_start = 0
        for i, line in enumerate(lines):
            if not line.startswith('#') and ',' in line and len(line.split(',')) >= 5:
                data_start = i
                break
        
        # Parse coordinate data
        coordinates = []
        for line in lines[data_start:]:
            line = line.strip()
            if line and ',' in line:
                parts = line.split(',')
                if len(parts) >= 5:
                    try:
                        point_id = float(parts[0])
                        line_num = float(parts[1])
                        x = float(parts[2])  # Easting
                        y = float(parts[3])  # Northing
                        z = float(parts[4])  # Elevation
                        
                        coordinates.append({
                            "point_id": point_id,
                            "line_number": line_num,
                            "x": x,
                            "y": y,
                            "z": z
                        })
                    except ValueError:
                        continue
        
        if not coordinates:
            return "Error: No valid coordinate data found in horizon file"
        
        # Calculate statistics
        x_coords = [c["x"] for c in coordinates]
        y_coords = [c["y"] for c in coordinates]
        z_coords = [c["z"] for c in coordinates]
        
        result = {
            "total_points": len(coordinates),
            "coordinate_system": "UTM (from file header)",
            "bounds": {
                "x_min": min(x_coords),
                "x_max": max(x_coords),
                "y_min": min(y_coords),
                "y_max": max(y_coords),
                "z_min": min(z_coords),
                "z_max": max(z_coords)
            },
            "coordinates": coordinates[:1000] if len(coordinates) > 1000 else coordinates  # Limit for JSON size
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return f"Error parsing horizon file: {str(e)}"

@tool
def convert_horizon_to_minecraft(horizon_coordinates_json: str, sample_rate: int = 10, base_x: int = 0, base_y: int = 100, base_z: int = 0) -> str:
    """
    Convert horizon coordinates to Minecraft coordinates and generate build commands.
    
    Args:
        horizon_coordinates_json: JSON string from parse_horizon_file
        sample_rate: Take every Nth point (default 10 for performance)
        base_x: Minecraft base X coordinate
        base_y: Minecraft base Y coordinate  
        base_z: Minecraft base Z coordinate
    
    Returns:
        JSON string with Minecraft coordinates and build commands
    """
    try:
        data = json.loads(horizon_coordinates_json)
        coordinates = data.get("coordinates", [])
        
        if not coordinates:
            return "Error: No coordinates found in input data"
        
        # Sample points for performance
        sampled_coords = coordinates[::sample_rate]
        
        # Convert to coordinate tuples for smart scaling
        coord_tuples = [(c["x"], c["y"], c["z"]) for c in sampled_coords]
        
        # Use smart scaling for surfaces
        from .coordinates import transform_surface_to_minecraft
        minecraft_coords_tuples = transform_surface_to_minecraft(coord_tuples)
        
        minecraft_coords = []
        for i, (mc_x, mc_y, mc_z) in enumerate(minecraft_coords_tuples):
            minecraft_coords.append({
                "x": mc_x,
                "y": mc_y,
                "z": mc_z,
                "original_x": sampled_coords[i]["x"],
                "original_y": sampled_coords[i]["y"],
                "original_z": sampled_coords[i]["z"]
            })
        
        # Generate Minecraft commands
        commands = []
        commands.append(f"# Building horizon surface with {len(minecraft_coords)} points")
        commands.append(f"say Building horizon at {base_x},{base_y},{base_z}")
        
        # Build horizon surface
        for i, coord in enumerate(minecraft_coords):
            x, y, z = coord["x"], coord["y"], coord["z"]
            commands.append(f"setblock {x} {y} {z} sandstone")
            
            # Add markers every 50 points
            if i % 50 == 0:
                commands.append(f"setblock {x} {y+1} {z} glowstone")
        
        commands.append("say Horizon surface completed!")
        
        result = {
            "total_minecraft_points": len(minecraft_coords),
            "minecraft_coordinates": minecraft_coords,
            "build_commands": commands
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return f"Error converting horizon to Minecraft: {str(e)}"

@tool
def download_horizon_data(horizon_id: str) -> str:
    """
    Download horizon data file from OSDU for a specific horizon ID.
    
    Args:
        horizon_id: OSDU horizon record ID
    
    Returns:
        String with horizon file content or error message
    """
    try:
        from .osdu_client import OSDUClient
        
        client = OSDUClient()
        if not client.authenticate():
            return "Error: OSDU authentication failed"
        
        # Get horizon record to find dataset ID
        record = client.get_record(horizon_id)
        if not record:
            return f"Error: Could not retrieve horizon record {horizon_id}"
        
        datasets = record.get('data', {}).get('Datasets', [])
        if not datasets:
            return f"Error: No datasets found for horizon {horizon_id}"
        
        dataset_id = datasets[0]
        
        # Download file
        signed_url = client.get_signed_url(dataset_id)
        if not signed_url:
            return f"Error: Could not get download URL for dataset {dataset_id}"
        
        file_content = client.download_file(signed_url)
        if not file_content:
            return f"Error: Could not download file content"
        
        return file_content
        
    except Exception as e:
        return f"Error downloading horizon data: {str(e)}"
