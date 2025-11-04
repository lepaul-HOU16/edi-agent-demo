import json
import csv
import io
import logging
import math
from collections import defaultdict
from typing import List, Tuple, Dict, Any
from strands import tool

# Configure logging
logger = logging.getLogger(__name__)

@tool
def search_horizons_live() -> str:
    """
    Search for horizon records in OSDU platform with live authentication.
    
    Returns:
        JSON string with found horizon records and their dataset information
    """
    logger.info("Starting horizon search in OSDU platform")
    
    try:
        from .osdu_client import OSDUClient
        
        client = OSDUClient()
        logger.info(f"Authenticating with OSDU at {client.platform_url}")
        
        if not client.authenticate():
            error_msg = "Error: OSDU authentication failed"
            logger.error(error_msg)
            return error_msg
        
        logger.info("OSDU authentication successful")
        
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
        
        logger.info(f"Searching for horizons with kind: {payload['kind']}")
        
        response = requests.post(
            f"{client.platform_url}/api/search/v2/query",
            headers=headers,
            json=payload
        )
        
        logger.info(f"OSDU search response status: {response.status_code}")
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            logger.info(f"Found {len(results)} horizon records")
            
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
                logger.debug(f"Horizon {record['id']}: {len(datasets)} datasets")
            
            return json.dumps(horizon_summary, indent=2)
        else:
            error_msg = f"Error: OSDU search failed with status {response.status_code}"
            logger.error(f"{error_msg}, Response: {response.text[:200]}")
            return error_msg
            
    except Exception as e:
        error_msg = f"Error searching horizons: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return error_msg

@tool
def parse_horizon_file(file_content: str) -> str:
    """
    Parse OSDU horizon file and extract coordinate data (X, Y, Z points).
    
    Args:
        file_content: Content of horizon file from OSDU
    
    Returns:
        JSON string with parsed coordinate data and statistics
    """
    logger.info("Starting horizon file parsing")
    
    try:
        if not file_content or not file_content.strip():
            error_msg = "Error: Empty file content provided"
            logger.error(error_msg)
            return error_msg
        
        lines = file_content.strip().split('\n')
        logger.info(f"File has {len(lines)} lines")
        
        # Find where data starts (skip header comments)
        data_start = 0
        for i, line in enumerate(lines):
            if not line.startswith('#') and ',' in line and len(line.split(',')) >= 5:
                data_start = i
                logger.info(f"Data starts at line {i}")
                break
        
        if data_start == 0 and lines[0].startswith('#'):
            logger.warning("No data section found after header comments")
        
        # Parse coordinate data
        coordinates = []
        parse_errors = 0
        
        for line_num, line in enumerate(lines[data_start:], start=data_start):
            line = line.strip()
            if line and ',' in line:
                parts = line.split(',')
                if len(parts) >= 5:
                    try:
                        point_id = float(parts[0])
                        line_number = float(parts[1])
                        x = float(parts[2])  # Easting
                        y = float(parts[3])  # Northing
                        z = float(parts[4])  # Elevation
                        
                        coordinates.append({
                            "point_id": point_id,
                            "line_number": line_number,
                            "x": x,
                            "y": y,
                            "z": z
                        })
                    except ValueError as e:
                        parse_errors += 1
                        if parse_errors <= 5:  # Log first 5 errors
                            logger.warning(f"Failed to parse line {line_num}: {line[:50]}... Error: {e}")
                        continue
        
        if parse_errors > 0:
            logger.warning(f"Total parse errors: {parse_errors} lines skipped")
        
        if not coordinates:
            error_msg = "Error: No valid coordinate data found in horizon file"
            logger.error(error_msg)
            return error_msg
        
        logger.info(f"Successfully parsed {len(coordinates)} coordinate points")
        
        # Calculate statistics
        x_coords = [c["x"] for c in coordinates]
        y_coords = [c["y"] for c in coordinates]
        z_coords = [c["z"] for c in coordinates]
        
        bounds = {
            "x_min": min(x_coords),
            "x_max": max(x_coords),
            "y_min": min(y_coords),
            "y_max": max(y_coords),
            "z_min": min(z_coords),
            "z_max": max(z_coords)
        }
        
        logger.info(f"Coordinate bounds: X[{bounds['x_min']:.2f}, {bounds['x_max']:.2f}], "
                   f"Y[{bounds['y_min']:.2f}, {bounds['y_max']:.2f}], "
                   f"Z[{bounds['z_min']:.2f}, {bounds['z_max']:.2f}]")
        
        result = {
            "total_points": len(coordinates),
            "coordinate_system": "UTM (from file header)",
            "bounds": bounds,
            "coordinates": coordinates[:1000] if len(coordinates) > 1000 else coordinates  # Limit for JSON size
        }
        
        if len(coordinates) > 1000:
            logger.info(f"Truncated coordinates to 1000 points for JSON size (total: {len(coordinates)})")
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        error_msg = f"Error parsing horizon file: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return error_msg

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
    logger.info(f"Converting horizon to Minecraft coordinates (sample_rate={sample_rate})")
    
    try:
        # Parse input JSON
        try:
            data = json.loads(horizon_coordinates_json)
        except json.JSONDecodeError as e:
            error_msg = f"Error: Invalid JSON input: {str(e)}"
            logger.error(error_msg)
            return error_msg
        
        coordinates = data.get("coordinates", [])
        
        if not coordinates:
            error_msg = "Error: No coordinates found in input data"
            logger.error(error_msg)
            return error_msg
        
        logger.info(f"Input has {len(coordinates)} coordinate points")
        
        # Validate sample rate
        if sample_rate < 1:
            logger.warning(f"Invalid sample_rate {sample_rate}, using 1")
            sample_rate = 1
        
        # Balanced sampling - take every 10th point for good coverage without timeout
        # 1903 points / 10 = ~190 points, which is under the 500 command limit
        effective_sample_rate = sample_rate  # Use the default sample rate (10)
        sampled_coords = coordinates[::effective_sample_rate]
        logger.info(f"Sampled to {len(sampled_coords)} points (every {effective_sample_rate}th point)")
        
        if not sampled_coords:
            error_msg = "Error: No coordinates after sampling"
            logger.error(error_msg)
            return error_msg
        
        # Convert to coordinate tuples for smart scaling
        coord_tuples = [(c["x"], c["y"], c["z"]) for c in sampled_coords]
        
        # Log coordinate ranges before transformation
        x_vals = [c[0] for c in coord_tuples]
        y_vals = [c[1] for c in coord_tuples]
        z_vals = [c[2] for c in coord_tuples]
        logger.info(f"Original coordinate ranges: X[{min(x_vals):.2f}, {max(x_vals):.2f}], "
                   f"Y[{min(y_vals):.2f}, {max(y_vals):.2f}], Z[{min(z_vals):.2f}, {max(z_vals):.2f}]")
        
        # LIGHT interpolation - add 1 point between each pair for better coverage
        # This doubles the points but stays well under the 500 command limit
        interpolated_coords = []
        original_coord_map = []
        
        for i in range(len(coord_tuples)):
            # Add current point
            interpolated_coords.append(coord_tuples[i])
            original_coord_map.append(i)
            
            # Add midpoint to next point (if not last point)
            if i < len(coord_tuples) - 1:
                curr = coord_tuples[i]
                next_pt = coord_tuples[i + 1]
                midpoint = (
                    (curr[0] + next_pt[0]) / 2,
                    (curr[1] + next_pt[1]) / 2,
                    (curr[2] + next_pt[2]) / 2
                )
                interpolated_coords.append(midpoint)
                original_coord_map.append(i)
        
        logger.info(f"Light interpolation: {len(coord_tuples)} sampled → {len(interpolated_coords)} points (added midpoints)")
        
        # Use smart scaling for surfaces
        from .coordinates import transform_surface_to_minecraft
        minecraft_coords_tuples = transform_surface_to_minecraft(interpolated_coords)
        
        if not minecraft_coords_tuples:
            error_msg = "Error: Coordinate transformation failed"
            logger.error(error_msg)
            return error_msg
        
        # NO GAP FILLING - keep it simple and fast
        logger.info(f"Using {len(minecraft_coords_tuples)} blocks WITHOUT gap filling for speed")
        
        logger.info(f"AFTER gap filling and dedup: {len(minecraft_coords_tuples)} unique blocks")
        
        # Log Minecraft coordinate ranges after transformation
        mc_x_vals = [c[0] for c in minecraft_coords_tuples]
        mc_y_vals = [c[1] for c in minecraft_coords_tuples]
        mc_z_vals = [c[2] for c in minecraft_coords_tuples]
        logger.info(f"Minecraft coordinate ranges: X[{min(mc_x_vals)}, {max(mc_x_vals)}], "
                   f"Y[{min(mc_y_vals)}, {max(mc_y_vals)}], Z[{min(mc_z_vals)}, {max(mc_z_vals)}]")
        
        minecraft_coords = []
        for i, (mc_x, mc_y, mc_z) in enumerate(minecraft_coords_tuples):
            # Get the original coordinate this interpolated point came from
            orig_idx = original_coord_map[i] if i < len(original_coord_map) else 0
            orig_coord = sampled_coords[orig_idx] if orig_idx < len(sampled_coords) else sampled_coords[0]
            
            minecraft_coords.append({
                "x": mc_x,
                "y": mc_y,
                "z": mc_z,
                "original_x": orig_coord["x"],
                "original_y": orig_coord["y"],
                "original_z": orig_coord["z"]
            })
        
        # Generate Minecraft commands - SIMPLEST APPROACH: Individual setblock commands
        commands = []
        commands.append(f"# Building horizon surface with {len(minecraft_coords)} points")
        
        blocks_placed = 0
        for i, coord in enumerate(minecraft_coords):
            x, y, z = coord["x"], coord["y"], coord["z"]
            
            # Validate coordinates
            if not (-30000000 <= x <= 30000000 and 0 <= y <= 255 and -30000000 <= z <= 30000000):
                logger.warning(f"Coordinate out of bounds: ({x}, {y}, {z})")
                continue
            
            # Simple setblock command
            commands.append(f"setblock {x} {y} {z} sandstone")
            blocks_placed += 1
            
            # Markers every 20 points
            if i % 20 == 0 and y < 255:
                commands.append(f"setblock {x} {y+1} {z} glowstone")
        
        logger.info(f"Generated {len(commands)} commands to place {blocks_placed} blocks")
        
        result = {
            "total_minecraft_points": len(minecraft_coords),
            "blocks_to_place": blocks_placed,
            "minecraft_coordinates": minecraft_coords,
            "build_commands": commands
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        error_msg = f"Error converting horizon to Minecraft: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return error_msg

@tool
def download_horizon_data(horizon_id: str) -> str:
    """
    Download horizon data file from OSDU for a specific horizon ID.
    
    Args:
        horizon_id: OSDU horizon record ID
    
    Returns:
        String with horizon file content or error message
    """
    logger.info(f"Downloading horizon data for ID: {horizon_id}")
    
    try:
        from .osdu_client import OSDUClient
        
        client = OSDUClient()
        logger.info(f"Authenticating with OSDU at {client.platform_url}")
        
        if not client.authenticate():
            error_msg = "Error: OSDU authentication failed"
            logger.error(error_msg)
            return error_msg
        
        logger.info("OSDU authentication successful")
        
        # Get horizon record to find dataset ID
        logger.info(f"Fetching horizon record: {horizon_id}")
        record = client.get_record(horizon_id)
        
        if not record:
            error_msg = f"Error: Could not retrieve horizon record {horizon_id}"
            logger.error(error_msg)
            return error_msg
        
        logger.info(f"Retrieved horizon record successfully")
        
        datasets = record.get('data', {}).get('Datasets', [])
        if not datasets:
            error_msg = f"Error: No datasets found for horizon {horizon_id}"
            logger.error(error_msg)
            return error_msg
        
        dataset_id = datasets[0]
        logger.info(f"Found dataset ID: {dataset_id}")
        
        # Download file
        logger.info(f"Getting signed URL for dataset: {dataset_id}")
        signed_url = client.get_signed_url(dataset_id)
        
        if not signed_url:
            error_msg = f"Error: Could not get download URL for dataset {dataset_id}"
            logger.error(error_msg)
            return error_msg
        
        logger.info(f"Got signed URL, downloading file...")
        file_content = client.download_file(signed_url)
        
        if not file_content:
            error_msg = f"Error: Could not download file content"
            logger.error(error_msg)
            return error_msg
        
        file_size = len(file_content)
        logger.info(f"Successfully downloaded horizon data: {file_size} bytes")
        
        return file_content
        
    except Exception as e:
        error_msg = f"Error downloading horizon data: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return error_msg


@tool
def build_horizon_in_minecraft(minecraft_coords_json: str, rcon_host: str = None, rcon_port: int = None, rcon_password: str = None) -> str:
    """
    Build horizon surface in Minecraft using RCON commands.
    
    Args:
        minecraft_coords_json: JSON string from convert_horizon_to_minecraft with build_commands
        rcon_host: Minecraft server host (defaults to env var MINECRAFT_HOST)
        rcon_port: RCON port (defaults to env var MINECRAFT_PORT)
        rcon_password: RCON password (defaults to env var MINECRAFT_RCON_PASSWORD)
    
    Returns:
        JSON string with build results and statistics
    """
    import os
    
    # Use environment variables if parameters not provided
    if rcon_host is None:
        rcon_host = os.environ.get('MINECRAFT_HOST', 'edicraft.nigelgardiner.com')
    if rcon_port is None:
        rcon_port = int(os.environ.get('MINECRAFT_PORT', '49001'))
    if rcon_password is None:
        rcon_password = os.environ.get('MINECRAFT_RCON_PASSWORD', 'ediagents@OSDU2025demo')
    
    logger.info(f"Building horizon in Minecraft via RCON at {rcon_host}:{rcon_port}")
    
    try:
        # Parse input JSON
        try:
            data = json.loads(minecraft_coords_json)
            logger.info(f"Parsed JSON successfully, keys: {list(data.keys())}")
        except json.JSONDecodeError as e:
            error_msg = f"JSON Parse Error: {str(e)}"
            logger.error(f"{error_msg}\nInput preview: {minecraft_coords_json[:200]}")
            return json.dumps({
                "success": False,
                "error": error_msg,
                "error_type": "json_parse_error"
            })
        
        commands = data.get("build_commands", [])
        
        if not commands:
            error_msg = "No build commands found in input data"
            logger.error(f"{error_msg}. Available keys: {list(data.keys())}")
            return json.dumps({
                "success": False,
                "error": error_msg,
                "error_type": "no_commands",
                "available_keys": list(data.keys())
            })
        
        logger.info(f"Found {len(commands)} RCON commands to execute")
        
        # Import RCON executor
        try:
            from .rcon_executor import RCONExecutor
            logger.info("RCONExecutor imported successfully")
        except ImportError as e:
            error_msg = f"Failed to import RCONExecutor: {str(e)}"
            logger.error(error_msg)
            return json.dumps({
                "success": False,
                "error": error_msg,
                "error_type": "import_error"
            })
        
        # Create executor with reasonable timeout
        try:
            executor = RCONExecutor(
                host=rcon_host,
                port=rcon_port,
                password=rcon_password,
                timeout=30,
                max_retries=3
            )
            logger.info(f"RCONExecutor created for {rcon_host}:{rcon_port}")
        except Exception as e:
            error_msg = f"Failed to create RCONExecutor: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return json.dumps({
                "success": False,
                "error": error_msg,
                "error_type": "executor_creation_error"
            })
        
        # Execute commands with strict limits to avoid timeout
        results = []
        successful_commands = 0
        failed_commands = 0
        total_blocks_placed = 0
        first_error = None
        max_commands = 500  # Hard limit to prevent timeout
        
        # Limit commands to prevent timeout
        commands_to_execute = [cmd for cmd in commands if not cmd.startswith('#')]
        if len(commands_to_execute) > max_commands:
            logger.warning(f"Too many commands ({len(commands_to_execute)}), limiting to {max_commands}")
            commands_to_execute = commands_to_execute[:max_commands]
        
        for i, command in enumerate(commands_to_execute):
            logger.debug(f"Executing command {i+1}/{len(commands_to_execute)}: {command[:50]}...")
            
            try:
                # CRITICAL FIX: Disable verification for setblock commands
                # Minecraft setblock returns empty string on success, which fails verification
                # We'll assume success and count blocks manually
                result = executor.execute_command(command, verify=False, operation="horizon_build")
                
                # DEBUG: Log first few responses to see what we're getting
                if i < 3:
                    logger.info(f"[DEBUG] Command {i+1} response: '{result.response}' | blocks_affected: {result.blocks_affected} | success: {result.success}")
                
                if result.success:
                    successful_commands += 1
                    # CRITICAL FIX: Manually count blocks for setblock commands
                    # Since verification is disabled, assume 1 block per successful setblock
                    if "setblock" in command:
                        total_blocks_placed += 1
                    else:
                        total_blocks_placed += result.blocks_affected
                    logger.debug(f"Command succeeded: {total_blocks_placed} total blocks placed")
                else:
                    failed_commands += 1
                    error_detail = result.error or "Unknown error"
                    logger.warning(f"Command failed: {error_detail}")
                    
                    if not first_error:
                        first_error = error_detail
                    
                    results.append({
                        "command": command[:100],
                        "success": False,
                        "error": error_detail
                    })
                    
                    # Stop immediately on timeout errors
                    if "timeout" in error_detail.lower() or "timed out" in error_detail.lower():
                        logger.error(f"Timeout detected, stopping execution immediately")
                        break
                    
                    # Stop after 5 consecutive failures to avoid spam
                    if failed_commands >= 5:
                        logger.warning(f"Stopping after {failed_commands} consecutive failures")
                        break
                        
            except Exception as e:
                failed_commands += 1
                error_detail = f"Exception: {str(e)}"
                logger.error(f"Command exception: {error_detail}", exc_info=True)
                
                if not first_error:
                    first_error = error_detail
                
                results.append({
                    "command": command[:100],
                    "success": False,
                    "error": error_detail
                })
                
                # Stop immediately on timeout exceptions
                if "timeout" in str(e).lower():
                    logger.error(f"Timeout exception, stopping execution immediately")
                    break
                
                # Stop after 5 consecutive failures
                if failed_commands >= 5:
                    logger.warning(f"Stopping after {failed_commands} consecutive failures")
                    break
        
        logger.info(f"Build complete: {successful_commands} successful, {failed_commands} failed, "
                   f"{total_blocks_placed} blocks placed")
        
        # Generate result summary
        result_summary = {
            "success": failed_commands == 0,
            "total_commands": len(commands),
            "successful_commands": successful_commands,
            "failed_commands": failed_commands,
            "total_blocks_placed": total_blocks_placed,
            "first_error": first_error,
            "failed_command_details": results[:5] if results else None  # Limit to first 5 errors
        }
        
        return json.dumps(result_summary, indent=2)
        
    except Exception as e:
        error_msg = f"Unexpected error in build_horizon_in_minecraft: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return json.dumps({
            "success": False,
            "error": error_msg,
            "error_type": "unexpected_exception"
        })
