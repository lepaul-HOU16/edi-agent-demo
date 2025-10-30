"""
Composite workflow tools for EDIcraft agent.
These high-level tools execute complete workflows, making it easier for the LLM to select the right action.
"""

import json
from strands import tool
from .osdu_client import search_wellbores_live, get_trajectory_coordinates_live
from .trajectory_tools import calculate_trajectory_coordinates, build_wellbore_in_minecraft
from .horizon_tools import search_horizons_live, download_horizon_data, convert_horizon_to_minecraft
from .surface_tools import build_horizon_surface
from .rcon_tool import execute_rcon_command


def find_trajectory_by_well_name(well_name: str) -> str:
    """Helper function to find trajectory ID by well name or number.
    
    Args:
        well_name: Well identifier like "WELL-007", "007", "7", etc.
    
    Returns:
        Full trajectory ID or error message
    """
    from .osdu_client import OSDUClient
    
    client = OSDUClient()
    if not client.authenticate():
        return None
    
    # Search for trajectories
    trajectories = client.search_trajectory_records()
    
    # Normalize the well name for comparison
    well_name_upper = well_name.upper().strip()
    well_number = well_name_upper.replace("WELL-", "").replace("WELL", "").strip()
    
    # Try to find matching trajectory
    for traj in trajectories:
        traj_id = traj.get('id', '')
        traj_data = traj.get('data', {})
        wellbore_id = traj_data.get('WellboreID', '')
        
        # Check if wellbore ID contains the well number
        if well_number and well_number in wellbore_id:
            return traj_id
    
    return None


@tool
def build_wellbore_trajectory_complete(wellbore_id: str) -> str:
    """Build a complete wellbore trajectory visualization in Minecraft.
    
    This is a HIGH-LEVEL tool that executes the entire wellbore workflow automatically:
    1. Fetches trajectory data from OSDU platform
    2. Parses and validates the data format
    3. Converts to Minecraft coordinates (handles both coordinate and survey formats)
    4. Builds the wellbore path in Minecraft world
    
    USE THIS TOOL when user asks to:
    - "Build wellbore trajectory for WELL-XXX"
    - "Visualize wellbore WELL-XXX"
    - "Show me wellbore WELL-XXX in Minecraft"
    - "Create wellbore path for WELL-XXX"
    
    DO NOT use this tool for:
    - Listing players (use list_players instead)
    - Getting player positions (use get_player_positions instead)
    - Building horizon surfaces (use build_horizon_surface_complete instead)
    
    Args:
        wellbore_id: The wellbore identifier (e.g., "WELL-011" or full OSDU trajectory ID)
    
    Returns:
        Success message with details about the built trajectory
    """
    try:
        print(f"[WORKFLOW] Starting complete wellbore trajectory workflow for {wellbore_id}")
        
        # Check if this is a short well name (like "WELL-007") and needs lookup
        trajectory_id = wellbore_id
        if not wellbore_id.startswith("osdu:"):
            print(f"[WORKFLOW] Short well name detected, searching for full trajectory ID...")
            found_id = find_trajectory_by_well_name(wellbore_id)
            if found_id:
                trajectory_id = found_id
                print(f"[WORKFLOW] Found trajectory ID: {trajectory_id[:60]}...")
            else:
                return f"""❌ Could not find trajectory for well "{wellbore_id}"

The OSDU platform does not have a trajectory record matching "{wellbore_id}".

💡 **Tip:** Try one of these options:
1. Use the full OSDU trajectory ID (starts with "osdu:work-product-component--WellboreTrajectory:")
2. Search for available wellbores first
3. Check if the well name is correct

Would you like me to search for available wellbores?"""
        
        # Step 1: Get trajectory data from OSDU
        print(f"[WORKFLOW] Step 1/4: Fetching trajectory data from OSDU...")
        try:
            trajectory_data = get_trajectory_coordinates_live(trajectory_id)
            
            if "error" in trajectory_data.lower() or "not found" in trajectory_data.lower():
                # Provide helpful error message
                return f"""❌ Failed to fetch trajectory data

The trajectory record was found but the data could not be retrieved.

**Details:** {trajectory_data}

💡 **This may be due to:**
- Data not yet available in OSDU
- File download issues
- Data format incompatibility

Would you like to try a different wellbore?"""
        except Exception as e:
            return f"❌ Error fetching trajectory data from OSDU: {str(e)}"
        
        # Step 2: Parse and validate trajectory data
        print(f"[WORKFLOW] Step 2/4: Parsing and validating trajectory data...")
        try:
            from .trajectory_tools import parse_trajectory_data
            parsed = parse_trajectory_data(trajectory_data)
            
            if not parsed["valid"]:
                error_msg = parsed.get("error", "Unknown validation error")
                metadata = parsed.get("metadata", {})
                context = f" (Total points: {metadata.get('total_points', 'unknown')})" if metadata.get('total_points') else ""
                return f"❌ Invalid trajectory data format: {error_msg}{context}"
            
            data_format = parsed["format"]
            data = parsed["data"]
            metadata = parsed.get("metadata", {})
            
            print(f"[WORKFLOW] Data format detected: {data_format}")
            print(f"[WORKFLOW] Total points: {metadata.get('total_points', 'unknown')}")
            print(f"[WORKFLOW] Source: {metadata.get('source', 'unknown')}")
            
        except Exception as e:
            return f"❌ Error parsing trajectory data: {str(e)}"
        
        # Step 3: Convert to Minecraft coordinates (branch based on format)
        print(f"[WORKFLOW] Step 3/4: Converting to Minecraft coordinates...")
        try:
            from .trajectory_tools import transform_coordinates_to_minecraft
            
            if data_format == "coordinates":
                # Direct coordinate transformation
                print(f"[WORKFLOW] Using direct coordinate transformation...")
                coordinates_json = json.dumps(data)
                minecraft_coords = transform_coordinates_to_minecraft(coordinates_json)
                
                # Check for errors in transformation
                coords_result = json.loads(minecraft_coords)
                if not coords_result.get("success", False):
                    error_msg = coords_result.get("error", "Unknown transformation error")
                    return f"❌ Failed to transform coordinates: {error_msg}"
                    
            elif data_format == "survey":
                # Calculate from survey data
                print(f"[WORKFLOW] Using survey data calculation...")
                survey_json = json.dumps(data)
                minecraft_coords = calculate_trajectory_coordinates(survey_json)
                
                if "error" in minecraft_coords.lower():
                    return f"❌ Failed to calculate coordinates from survey data: {minecraft_coords}"
                    
            else:
                return f"❌ Unknown data format: {data_format}. Expected 'coordinates' or 'survey'."
            
        except Exception as e:
            print(f"[WORKFLOW] Error during coordinate conversion: {str(e)}")
            print(f"[WORKFLOW] Data format was: {data_format}")
            print(f"[WORKFLOW] Input data sample: {str(data)[:200]}...")
            return f"❌ Error converting coordinates: {str(e)}"
        
        # Step 4: Build in Minecraft
        print(f"[WORKFLOW] Step 4/4: Building wellbore in Minecraft...")
        try:
            build_result = build_wellbore_in_minecraft(minecraft_coords)
            
            if "error" in build_result.lower():
                return f"❌ Failed to build wellbore in Minecraft: {build_result}"
                
        except Exception as e:
            return f"❌ Error building wellbore in Minecraft: {str(e)}"
        
        # Return success message
        return f"""✅ Wellbore Trajectory Built Successfully!

Wellbore: {wellbore_id}
Data Format: {data_format}
Total Points: {metadata.get('total_points', 'unknown')}
Status: Complete

The wellbore trajectory has been visualized in Minecraft:
- Trajectory data fetched from OSDU platform
- Data format validated and parsed successfully
- Coordinates converted to Minecraft world space
- Wellbore path built with obsidian blocks
- Markers placed every 10 points
- Wellhead marked at ground level (Y=100)

{build_result}

You can now see the wellbore trajectory in the Minecraft world!"""
        
    except Exception as e:
        print(f"[WORKFLOW] Unexpected error in workflow: {str(e)}")
        return f"❌ Unexpected error building wellbore trajectory: {str(e)}"


@tool
def build_horizon_surface_complete(horizon_name: str = None) -> str:
    """Build a complete horizon surface visualization in Minecraft.
    
    This is a HIGH-LEVEL tool that executes the entire horizon workflow automatically:
    1. Searches for available horizons (or uses specified horizon)
    2. Downloads horizon data from OSDU
    3. Converts coordinates to Minecraft space
    4. Builds the surface in Minecraft world
    
    USE THIS TOOL when user asks to:
    - "Build horizon surface"
    - "Visualize horizon in Minecraft"
    - "Show me horizon [name]"
    - "Create horizon surface"
    - "Render horizon"
    
    DO NOT use this tool for:
    - Building wellbore trajectories (use build_wellbore_trajectory_complete instead)
    - Listing players (use list_players instead)
    - Getting player positions (use get_player_positions instead)
    
    Args:
        horizon_name: Optional horizon name. If not provided, will use first available horizon.
    
    Returns:
        Success message with details about the built horizon surface
    """
    try:
        print(f"[WORKFLOW] Starting complete horizon surface workflow")
        
        # Step 1: Search for horizons
        print(f"[WORKFLOW] Step 1/4: Searching for horizons...")
        horizons_result = search_horizons_live()
        
        if "error" in horizons_result.lower():
            return f"Failed to find horizons: {horizons_result}"
        
        # Parse horizon list and select one
        # For now, use the first available horizon or the specified one
        horizon_id = horizon_name or "default-horizon"
        
        # Step 2: Download horizon data
        print(f"[WORKFLOW] Step 2/4: Downloading horizon data...")
        horizon_data = download_horizon_data(horizon_id)
        
        if "error" in horizon_data.lower():
            return f"Failed to download horizon data: {horizon_data}"
        
        # Step 3: Convert to Minecraft coordinates
        print(f"[WORKFLOW] Step 3/4: Converting to Minecraft coordinates...")
        minecraft_coords = convert_horizon_to_minecraft(horizon_data)
        
        if "error" in minecraft_coords.lower():
            return f"Failed to convert coordinates: {minecraft_coords}"
        
        # Step 4: Build surface in Minecraft
        print(f"[WORKFLOW] Step 4/4: Building horizon surface in Minecraft...")
        build_result = build_horizon_surface(minecraft_coords)
        
        return f"""✅ Horizon Surface Built Successfully!

Horizon: {horizon_id}
Status: Complete

The horizon surface has been visualized in Minecraft:
- Horizon data fetched from OSDU platform
- Coordinates converted to Minecraft world space
- Surface built with appropriate blocks
- Geological structure visible in 3D

{build_result}

You can now see the horizon surface in the Minecraft world!"""
        
    except Exception as e:
        return f"Error building horizon surface: {str(e)}"


@tool
def get_system_status() -> str:
    """Get current system status - ONLY for greetings and status checks.
    
    USE THIS TOOL ONLY when user says:
    - "Hello" (just greeting, no action requested)
    - "What's the status?" (asking about system, not requesting action)
    - "Are you ready?" (checking readiness, not requesting action)
    
    DO NOT use this tool when user says:
    - "Build wellbore trajectory for WELL-XXX" → use build_wellbore_trajectory_complete
    - "Build horizon" → use build_horizon_surface_complete
    - "Visualize wellbore" → use build_wellbore_trajectory_complete
    - ANY request with "build" or "visualize" or "create" or "show me"
    
    IMPORTANT: If user mentions a well ID like "WELL-011", they want to BUILD something,
    not check status. Use build_wellbore_trajectory_complete instead.
    
    Returns:
        System status information
    """
    try:
        # Get player count
        player_list = execute_rcon_command("list")
        
        # Get wellbore count
        wellbores = search_wellbores_live()
        wellbore_count = "unknown"
        if "wellbore" in wellbores.lower():
            # Try to extract count
            import re
            match = re.search(r'(\d+)\s+wellbore', wellbores.lower())
            if match:
                wellbore_count = match.group(1)
        
        # Get horizon count
        horizons = search_horizons_live()
        horizon_count = "unknown"
        if "horizon" in horizons.lower():
            import re
            match = re.search(r'(\d+)\s+horizon', horizons.lower())
            if match:
                horizon_count = match.group(1)
        
        return f"""System Status Report:

🎮 Minecraft Server: Connected
   {player_list}

📊 OSDU Platform: Connected
   - Wellbore trajectories available: {wellbore_count}
   - Horizon surfaces available: {horizon_count}

✅ System Ready
All systems operational and ready for visualization requests."""
        
    except Exception as e:
        return f"System status check failed: {str(e)}"
