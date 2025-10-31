"""
Composite workflow tools for EDIcraft agent.
These high-level tools execute complete workflows, making it easier for the LLM to select the right action.
"""

import json
from strands import tool
from .osdu_client import search_wellbores_live, get_trajectory_coordinates_live
from .trajectory_tools import calculate_trajectory_coordinates, build_wellbore_in_minecraft, build_wellbore_in_minecraft_enhanced
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
def build_wellbore_trajectory_complete(wellbore_id: str, build_rig: bool = True, color_scheme: str = "default") -> str:
    """Build a complete wellbore trajectory visualization in Minecraft with enhanced features.
    
    This is a HIGH-LEVEL tool that executes the entire wellbore workflow automatically:
    1. Fetches trajectory data from OSDU platform
    2. Parses and validates the data format
    3. Converts to Minecraft coordinates (handles both coordinate and survey formats)
    4. Builds the wellbore path in Minecraft world with color coding
    5. Places enhanced depth markers at regular intervals
    6. Adds ground-level markers at wellhead
    7. Builds drilling rig at wellhead (optional)
    8. Uses simplified well names for all markers and signs
    
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
        build_rig: Whether to build a drilling rig at the wellhead (default: True)
        color_scheme: Color scheme for wellbore blocks - "default", "depth", "type" (default: "default")
    
    Returns:
        Success message with details about the built trajectory
    """
    from .response_templates import CloudscapeResponseBuilder
    from .name_utils import simplify_well_name
    
    try:
        print(f"[WORKFLOW] Starting enhanced wellbore trajectory workflow for {wellbore_id}")
        
        # Simplify well name for display
        display_name = simplify_well_name(wellbore_id) if wellbore_id.startswith("osdu:") else wellbore_id
        print(f"[WORKFLOW] Display name: {display_name}")
        
        # Check if this is a short well name (like "WELL-007") and needs lookup
        trajectory_id = wellbore_id
        if not wellbore_id.startswith("osdu:"):
            print(f"[WORKFLOW] Short well name detected, searching for full trajectory ID...")
            found_id = find_trajectory_by_well_name(wellbore_id)
            if found_id:
                trajectory_id = found_id
                print(f"[WORKFLOW] Found trajectory ID: {trajectory_id[:60]}...")
            else:
                return CloudscapeResponseBuilder.error_response(
                    "Build Wellbore Trajectory",
                    f'Could not find trajectory for well "{wellbore_id}"',
                    [
                        "Use the full OSDU trajectory ID (starts with 'osdu:work-product-component--WellboreTrajectory:')",
                        "Search for available wellbores first",
                        "Check if the well name is correct",
                        "Try: 'What wellbores are available?'"
                    ]
                )
        
        # Step 1: Get trajectory data from OSDU
        print(f"[WORKFLOW] Step 1/5: Fetching trajectory data from OSDU...")
        try:
            trajectory_data = get_trajectory_coordinates_live(trajectory_id)
            
            if "error" in trajectory_data.lower() or "not found" in trajectory_data.lower():
                return CloudscapeResponseBuilder.error_response(
                    "Fetch Trajectory Data",
                    f"The trajectory record was found but the data could not be retrieved: {trajectory_data}",
                    [
                        "Data may not yet be available in OSDU",
                        "Check for file download issues",
                        "Verify data format compatibility",
                        "Try a different wellbore"
                    ]
                )
        except Exception as e:
            return CloudscapeResponseBuilder.error_response(
                "Fetch Trajectory Data",
                f"Error fetching trajectory data from OSDU: {str(e)}",
                [
                    "Check OSDU platform connection",
                    "Verify authentication credentials",
                    "Check trajectory ID is valid",
                    "Try again in a few moments"
                ]
            )
        
        # Step 2: Parse and validate trajectory data
        print(f"[WORKFLOW] Step 2/5: Parsing and validating trajectory data...")
        try:
            from .trajectory_tools import parse_trajectory_data
            parsed = parse_trajectory_data(trajectory_data)
            
            if not parsed["valid"]:
                error_msg = parsed.get("error", "Unknown validation error")
                metadata = parsed.get("metadata", {})
                context = f" (Total points: {metadata.get('total_points', 'unknown')})" if metadata.get('total_points') else ""
                return CloudscapeResponseBuilder.error_response(
                    "Parse Trajectory Data",
                    f"Invalid trajectory data format: {error_msg}{context}",
                    [
                        "Check data format is supported (coordinates or survey)",
                        "Verify data file is not corrupted",
                        "Try downloading data again",
                        "Contact data administrator if issue persists"
                    ]
                )
            
            data_format = parsed["format"]
            data = parsed["data"]
            metadata = parsed.get("metadata", {})
            total_points = metadata.get('total_points', 0)
            
            print(f"[WORKFLOW] Data format detected: {data_format}")
            print(f"[WORKFLOW] Total points: {total_points}")
            print(f"[WORKFLOW] Source: {metadata.get('source', 'unknown')}")
            
        except Exception as e:
            return CloudscapeResponseBuilder.error_response(
                "Parse Trajectory Data",
                f"Error parsing trajectory data: {str(e)}",
                [
                    "Check data format is valid JSON or CSV",
                    "Verify data structure matches expected format",
                    "Try a different wellbore",
                    "Check server logs for details"
                ]
            )
        
        # Step 3: Convert to Minecraft coordinates (branch based on format)
        print(f"[WORKFLOW] Step 3/5: Converting to Minecraft coordinates...")
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
                    return CloudscapeResponseBuilder.error_response(
                        "Transform Coordinates",
                        f"Failed to transform coordinates: {error_msg}",
                        [
                            "Check coordinate values are valid",
                            "Verify coordinate system is supported",
                            "Try a different wellbore",
                            "Check transformation parameters"
                        ]
                    )
                    
            elif data_format == "survey":
                # Calculate from survey data
                print(f"[WORKFLOW] Using survey data calculation...")
                survey_json = json.dumps(data)
                minecraft_coords = calculate_trajectory_coordinates(survey_json)
                
                if "error" in minecraft_coords.lower():
                    return CloudscapeResponseBuilder.error_response(
                        "Calculate Coordinates",
                        f"Failed to calculate coordinates from survey data: {minecraft_coords}",
                        [
                            "Check survey data format is valid",
                            "Verify MD, INC, AZI values are present",
                            "Try a different wellbore",
                            "Check calculation parameters"
                        ]
                    )
                    
            else:
                return CloudscapeResponseBuilder.error_response(
                    "Transform Coordinates",
                    f"Unknown data format: {data_format}",
                    [
                        "Expected format: 'coordinates' or 'survey'",
                        "Check data file format",
                        "Try a different wellbore",
                        "Contact data administrator"
                    ]
                )
            
        except Exception as e:
            print(f"[WORKFLOW] Error during coordinate conversion: {str(e)}")
            print(f"[WORKFLOW] Data format was: {data_format}")
            print(f"[WORKFLOW] Input data sample: {str(data)[:200]}...")
            return CloudscapeResponseBuilder.error_response(
                "Transform Coordinates",
                f"Error converting coordinates: {str(e)}",
                [
                    "Check coordinate data is valid",
                    "Verify transformation parameters",
                    "Try a different wellbore",
                    "Check server logs for details"
                ]
            )
        
        # Parse minecraft coordinates to get wellhead location
        coords_data = json.loads(minecraft_coords)
        minecraft_points = coords_data.get("coordinates", [])
        wellhead_x = coords_data.get("wellhead_x", 0)
        wellhead_y = coords_data.get("wellhead_y", 100)
        wellhead_z = coords_data.get("wellhead_z", 0)
        
        # Step 4: Build wellbore with enhanced features
        print(f"[WORKFLOW] Step 4/5: Building wellbore with enhanced features...")
        try:
            # Build wellbore with color coding and enhanced markers
            build_result = build_wellbore_in_minecraft_enhanced(
                minecraft_coords,
                well_name=display_name,
                color_scheme=color_scheme
            )
            
            if "error" in build_result.lower():
                return CloudscapeResponseBuilder.error_response(
                    "Build Wellbore",
                    f"Failed to build wellbore in Minecraft: {build_result}",
                    [
                        "Check Minecraft server connection",
                        "Verify RCON is enabled and accessible",
                        "Check coordinate values are within world bounds",
                        "Try restarting Minecraft server"
                    ]
                )
            
            # Parse build result to get blocks placed
            blocks_placed = 0
            import re
            match = re.search(r'(\d+)\s+block', build_result.lower())
            if match:
                blocks_placed = int(match.group(1))
                
        except Exception as e:
            return CloudscapeResponseBuilder.error_response(
                "Build Wellbore",
                f"Error building wellbore in Minecraft: {str(e)}",
                [
                    "Check Minecraft server is running",
                    "Verify RCON connection",
                    "Check server logs for errors",
                    "Try restarting the workflow"
                ]
            )
        
        # Step 5: Build drilling rig at wellhead (if requested)
        rig_built = False
        if build_rig:
            print(f"[WORKFLOW] Step 5/5: Building drilling rig at wellhead...")
            try:
                rig_result = build_drilling_rig(
                    x=wellhead_x,
                    y=wellhead_y,
                    z=wellhead_z,
                    well_name=display_name,
                    rig_style="standard"
                )
                
                if CloudscapeResponseBuilder.SUCCESS_ICON in rig_result:
                    rig_built = True
                    print(f"[WORKFLOW] Drilling rig built successfully")
                else:
                    print(f"[WORKFLOW] Drilling rig build failed: {rig_result}")
                    # Don't fail the whole workflow if rig fails
                    
            except Exception as e:
                print(f"[WORKFLOW] Error building drilling rig: {str(e)}")
                # Don't fail the whole workflow if rig fails
        else:
            print(f"[WORKFLOW] Step 5/5: Skipping drilling rig (build_rig=False)")
        
        # Return success response using Cloudscape template
        print(f"[WORKFLOW] Wellbore build complete!")
        return CloudscapeResponseBuilder.wellbore_success(
            well_name=display_name,
            data_points=total_points,
            blocks_placed=blocks_placed if blocks_placed > 0 else total_points,
            coordinates={
                'x': wellhead_x,
                'y': wellhead_y,
                'z': wellhead_z
            },
            has_rig=rig_built
        )
        
    except Exception as e:
        print(f"[WORKFLOW] Unexpected error in workflow: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Build Wellbore Trajectory",
            f"Unexpected error: {str(e)}",
            [
                "Check all system components are running",
                "Verify configuration is correct",
                "Try restarting the workflow",
                "Check server logs for details",
                "Contact system administrator if issue persists"
            ]
        )


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
def clear_minecraft_environment(area: str = "all", preserve_terrain: bool = True) -> str:
    """Clear wellbore visualizations and structures from Minecraft world.
    
    This tool removes wellbore blocks, drilling rigs, and markers from the Minecraft
    environment to prepare for fresh demonstrations. It can selectively clear different
    types of structures while preserving the natural terrain.
    
    USE THIS TOOL when user asks to:
    - "Clear the Minecraft environment"
    - "Clear all wellbores"
    - "Remove visualizations"
    - "Clean up the world"
    - "Reset the environment"
    
    Args:
        area: Area to clear - "all" (default), "wellbores", "rigs", "markers", or coordinates
        preserve_terrain: If True (default), preserves natural terrain blocks
    
    Returns:
        Cloudscape-formatted response with clear results
    """
    from .response_templates import CloudscapeResponseBuilder
    
    try:
        print(f"[CLEAR] Starting clear operation: area={area}, preserve_terrain={preserve_terrain}")
        
        # Track cleared blocks
        wellbores_cleared = 0
        rigs_cleared = 0
        entities_cleared = 0
        total_blocks = 0
        
        # Define block types to clear - EXPANDED LIST
        wellbore_blocks = [
            "obsidian", "glowstone", "emerald_block", "diamond_block",
            "gold_block", "iron_block", "lapis_block", "redstone_block",
            "coal_block", "quartz_block", "prismarine", "dark_prismarine"
        ]
        
        rig_blocks = [
            "iron_bars", "smooth_stone_slab", "furnace", "hopper", "chest",
            "oak_sign", "wall_sign", "iron_block", "iron_trapdoor",
            "ladder", "torch", "wall_torch", "lantern", "chain",
            "anvil", "crafting_table", "barrel", "smoker", "blast_furnace"
        ]
        
        marker_blocks = [
            "beacon", "sea_lantern", "end_rod", "redstone_lamp",
            "glowstone", "shroomlight"
        ]
        
        # Determine which blocks to clear based on area parameter
        blocks_to_clear = []
        if area == "all":
            blocks_to_clear = wellbore_blocks + rig_blocks + marker_blocks
            # Remove duplicates
            blocks_to_clear = list(set(blocks_to_clear))
        elif area == "wellbores":
            blocks_to_clear = wellbore_blocks
        elif area == "rigs":
            blocks_to_clear = rig_blocks
        elif area == "markers":
            blocks_to_clear = marker_blocks
        else:
            return CloudscapeResponseBuilder.error_response(
                "Clear Environment",
                f"Custom area clearing not yet implemented: {area}",
                [
                    "Use area='all' to clear everything",
                    "Use area='wellbores' to clear only wellbores",
                    "Use area='rigs' to clear only drilling rigs",
                    "Use area='markers' to clear only markers"
                ]
            )
        
        # Step 1: Kill all non-player entities (item frames, armor stands, etc.)
        print(f"[CLEAR] Step 1: Removing entities...")
        try:
            kill_result = execute_rcon_command("kill @e[type=!player]")
            print(f"[CLEAR] Entity removal result: {kill_result}")
            # Parse entity count
            import re
            match = re.search(r'killed\s+(\d+)', kill_result.lower())
            if match:
                entities_cleared = int(match.group(1))
                print(f"[CLEAR] Removed {entities_cleared} entities")
        except Exception as e:
            print(f"[CLEAR] Error removing entities: {str(e)}")
        
        # Step 2: Clear blocks in smaller, more manageable chunks
        # Use 50x50x50 chunks for better performance
        chunk_size = 50
        
        # Define the overall area to clear (smaller area for better performance)
        x_min, x_max = -300, 300
        y_min, y_max = 50, 200  # Focus on build height, not deep underground
        z_min, z_max = -300, 300
        
        print(f"[CLEAR] Step 2: Clearing blocks from ({x_min},{y_min},{z_min}) to ({x_max},{y_max},{z_max})")
        print(f"[CLEAR] Using chunk size: {chunk_size}x{chunk_size}x{chunk_size}")
        print(f"[CLEAR] Block types to clear: {len(blocks_to_clear)} types")
        
        # Clear each block type
        for block_type in blocks_to_clear:
            block_count_for_type = 0
            
            # Use larger fill commands (Minecraft can handle up to 32768 blocks)
            # 50x50x50 = 125,000 blocks, so we need to be more conservative
            # Use 30x30x30 = 27,000 blocks per command
            for x in range(x_min, x_max, 30):
                for y in range(y_min, y_max, 30):
                    for z in range(z_min, z_max, 30):
                        try:
                            x1, x2 = x, min(x + 29, x_max)
                            y1, y2 = y, min(y + 29, y_max)
                            z1, z2 = z, min(z + 29, z_max)
                            
                            # Use fill command to replace specific blocks with air
                            fill_command = f"fill {x1} {y1} {z1} {x2} {y2} {z2} air replace {block_type}"
                            
                            result = execute_rcon_command(fill_command)
                            
                            # Parse result
                            match = re.search(r'(\d+)\s+block', result.lower())
                            if match:
                                blocks_count = int(match.group(1))
                                if blocks_count > 0:
                                    block_count_for_type += blocks_count
                                    total_blocks += blocks_count
                                    
                        except Exception as e:
                            # Continue on error
                            continue
            
            # Categorize blocks
            if block_count_for_type > 0:
                if block_type in wellbore_blocks:
                    wellbores_cleared += 1
                elif block_type in rig_blocks:
                    rigs_cleared += 1
                print(f"[CLEAR] Cleared {block_count_for_type} {block_type} blocks")
        
        # Step 3: Fill any air pockets underground with stone to fix terrain
        if preserve_terrain:
            print(f"[CLEAR] Step 3: Repairing terrain...")
            try:
                # Fill underground air with stone (below y=60)
                repair_command = f"fill {x_min} {y_min} {z_min} {x_max} 60 {z_max} stone replace air"
                repair_result = execute_rcon_command(repair_command)
                print(f"[CLEAR] Terrain repair result: {repair_result}")
            except Exception as e:
                print(f"[CLEAR] Error repairing terrain: {str(e)}")
        
        # Return success response
        print(f"[CLEAR] Clear operation complete: {total_blocks} blocks cleared, {entities_cleared} entities removed")
        return CloudscapeResponseBuilder.clear_confirmation(
            wellbores_cleared=wellbores_cleared,
            rigs_cleared=rigs_cleared,
            blocks_cleared=total_blocks
        )
        
    except Exception as e:
        print(f"[CLEAR] Error in clear operation: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Clear Environment",
            f"Failed to clear Minecraft environment: {str(e)}",
            [
                "Check Minecraft server connection",
                "Verify RCON is enabled and accessible",
                "Try clearing a smaller area",
                "Check server logs for errors"
            ]
        )


@tool
def lock_world_time(time: str = "day", enabled: bool = True) -> str:
    """Lock Minecraft world time for consistent visibility during demonstrations.
    
    This tool sets the world time and locks/unlocks the daylight cycle to ensure
    visualizations are always visible. Useful for demos where you want consistent
    lighting conditions.
    
    USE THIS TOOL when user asks to:
    - "Lock the world time"
    - "Set time to day"
    - "Keep it daytime"
    - "Lock daylight cycle"
    - "Make it always day"
    
    Args:
        time: Time to set - "day" (1000), "noon" (6000), "sunset" (12000), "night" (13000)
        enabled: If True, locks time; if False, unlocks and resumes normal cycle
    
    Returns:
        Cloudscape-formatted response with time lock status
    """
    from .response_templates import CloudscapeResponseBuilder
    
    try:
        print(f"[TIME_LOCK] Starting time lock operation: time={time}, enabled={enabled}")
        
        # Map time strings to Minecraft time values
        time_values = {
            "day": 1000,
            "morning": 1000,
            "noon": 6000,
            "midday": 6000,
            "afternoon": 9000,
            "sunset": 12000,
            "dusk": 12000,
            "night": 13000,
            "midnight": 18000
        }
        
        # Get the time value
        time_lower = time.lower()
        if time_lower not in time_values:
            return CloudscapeResponseBuilder.error_response(
                "Time Lock",
                f"Invalid time value: {time}",
                [
                    "Use 'day' or 'morning' for daytime (1000)",
                    "Use 'noon' or 'midday' for noon (6000)",
                    "Use 'afternoon' for afternoon (9000)",
                    "Use 'sunset' or 'dusk' for sunset (12000)",
                    "Use 'night' for nighttime (13000)",
                    "Use 'midnight' for midnight (18000)"
                ]
            )
        
        time_value = time_values[time_lower]
        
        # Step 1: Set the world time
        print(f"[TIME_LOCK] Setting world time to {time} ({time_value})...")
        try:
            time_command = f"time set {time_value}"
            time_result = execute_rcon_command(time_command)
            print(f"[TIME_LOCK] Time set result: {time_result}")
        except Exception as e:
            print(f"[TIME_LOCK] Error setting time: {str(e)}")
            return CloudscapeResponseBuilder.error_response(
                "Time Lock",
                f"Failed to set world time: {str(e)}",
                [
                    "Check Minecraft server connection",
                    "Verify RCON is enabled and accessible",
                    "Ensure you have operator permissions",
                    "Try setting time manually: /time set day"
                ]
            )
        
        # Step 2: Lock or unlock the daylight cycle
        print(f"[TIME_LOCK] {'Locking' if enabled else 'Unlocking'} daylight cycle...")
        try:
            # Set doDaylightCycle gamerule
            cycle_value = "false" if enabled else "true"
            cycle_command = f"gamerule doDaylightCycle {cycle_value}"
            cycle_result = execute_rcon_command(cycle_command)
            print(f"[TIME_LOCK] Daylight cycle result: {cycle_result}")
        except Exception as e:
            print(f"[TIME_LOCK] Error setting daylight cycle: {str(e)}")
            return CloudscapeResponseBuilder.error_response(
                "Time Lock",
                f"Time was set but failed to lock daylight cycle: {str(e)}",
                [
                    "Time is set to {time} but may change",
                    "Try manually: /gamerule doDaylightCycle false",
                    "Check server permissions",
                    "Verify RCON connection"
                ]
            )
        
        # Return success response
        print(f"[TIME_LOCK] Time lock operation complete")
        return CloudscapeResponseBuilder.time_lock_confirmation(
            time=time,
            locked=enabled
        )
        
    except Exception as e:
        print(f"[TIME_LOCK] Unexpected error in time lock operation: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Time Lock",
            f"Unexpected error: {str(e)}",
            [
                "Check Minecraft server status",
                "Verify RCON configuration",
                "Try restarting the Minecraft server",
                "Check server logs for errors"
            ]
        )


@tool
def build_drilling_rig(
    x: int,
    y: int,
    z: int,
    well_name: str,
    rig_style: str = "standard"
) -> str:
    """Build a drilling rig structure at wellhead location.
    
    This tool creates a realistic drilling rig visualization in Minecraft with:
    - Derrick tower (iron bars)
    - Platform (smooth stone slabs)
    - Equipment (furnaces, hoppers, chests)
    - Signage with well name
    - Lighting (glowstone)
    
    USE THIS TOOL when user asks to:
    - "Build a drilling rig"
    - "Add a rig at the wellhead"
    - "Create drilling equipment"
    - "Build rig for WELL-XXX"
    
    Args:
        x: X coordinate of wellhead
        y: Y coordinate (ground level, typically 100)
        z: Z coordinate of wellhead
        well_name: Short well name for signage (e.g., "WELL-007")
        rig_style: "standard" (default), "compact", or "detailed"
    
    Returns:
        Cloudscape-formatted response with rig details
    """
    from .response_templates import CloudscapeResponseBuilder
    from .name_utils import simplify_well_name
    
    try:
        print(f"[RIG_BUILDER] Starting rig build: ({x}, {y}, {z}), style={rig_style}")
        
        # Simplify well name if it's a full OSDU ID
        if well_name.startswith("osdu:"):
            well_name = simplify_well_name(well_name)
        
        # Validate rig style
        valid_styles = ["standard", "compact", "detailed"]
        if rig_style not in valid_styles:
            return CloudscapeResponseBuilder.error_response(
                "Build Drilling Rig",
                f"Invalid rig style: {rig_style}",
                [
                    "Use 'standard' for default rig (recommended)",
                    "Use 'compact' for smaller rig (3x3 platform)",
                    "Use 'detailed' for larger rig with more equipment"
                ]
            )
        
        # Adjust rig dimensions based on style
        if rig_style == "compact":
            platform_size = 3
            derrick_height = 12
            derrick_size = 2
        elif rig_style == "detailed":
            platform_size = 7
            derrick_height = 18
            derrick_size = 4
        else:  # standard
            platform_size = 5
            derrick_height = 15
            derrick_size = 3
        
        commands_executed = 0
        blocks_placed = 0
        
        # Calculate platform corners
        half_platform = platform_size // 2
        platform_x1 = x - half_platform
        platform_x2 = x + half_platform
        platform_z1 = z - half_platform
        platform_z2 = z + half_platform
        
        # Step 1: Build platform (smooth stone slabs at ground level)
        print(f"[RIG_BUILDER] Building {platform_size}x{platform_size} platform...")
        try:
            platform_cmd = f"fill {platform_x1} {y} {platform_z1} {platform_x2} {y} {platform_z2} smooth_stone_slab"
            result = execute_rcon_command(platform_cmd)
            commands_executed += 1
            
            # Count blocks from result
            import re
            match = re.search(r'(\d+)\s+block', result.lower())
            if match:
                blocks_placed += int(match.group(1))
            
            print(f"[RIG_BUILDER] Platform built: {result}")
        except Exception as e:
            print(f"[RIG_BUILDER] Error building platform: {str(e)}")
        
        # Step 2: Build derrick structure (iron bars tower)
        print(f"[RIG_BUILDER] Building {derrick_height}-block derrick...")
        
        # Build derrick frame (4 corner posts)
        half_derrick = derrick_size // 2
        corners = [
            (x - half_derrick, z - half_derrick),  # NW corner
            (x + half_derrick, z - half_derrick),  # NE corner
            (x - half_derrick, z + half_derrick),  # SW corner
            (x + half_derrick, z + half_derrick),  # SE corner
        ]
        
        for corner_x, corner_z in corners:
            try:
                # Build vertical post
                post_cmd = f"fill {corner_x} {y+1} {corner_z} {corner_x} {y+derrick_height} {corner_z} iron_bars"
                result = execute_rcon_command(post_cmd)
                commands_executed += 1
                
                match = re.search(r'(\d+)\s+block', result.lower())
                if match:
                    blocks_placed += int(match.group(1))
            except Exception as e:
                print(f"[RIG_BUILDER] Error building derrick post: {str(e)}")
        
        # Add horizontal cross-beams at top
        try:
            # X-axis beam
            beam_x_cmd = f"fill {x - half_derrick} {y+derrick_height} {z} {x + half_derrick} {y+derrick_height} {z} iron_bars"
            result = execute_rcon_command(beam_x_cmd)
            commands_executed += 1
            
            match = re.search(r'(\d+)\s+block', result.lower())
            if match:
                blocks_placed += int(match.group(1))
            
            # Z-axis beam
            beam_z_cmd = f"fill {x} {y+derrick_height} {z - half_derrick} {x} {y+derrick_height} {z + half_derrick} iron_bars"
            result = execute_rcon_command(beam_z_cmd)
            commands_executed += 1
            
            match = re.search(r'(\d+)\s+block', result.lower())
            if match:
                blocks_placed += int(match.group(1))
        except Exception as e:
            print(f"[RIG_BUILDER] Error building cross-beams: {str(e)}")
        
        # Step 3: Place equipment on platform
        print(f"[RIG_BUILDER] Placing equipment...")
        
        equipment_placed = []
        
        # Place furnace (represents drilling equipment)
        try:
            furnace_cmd = f"setblock {x-1} {y+1} {z-1} furnace"
            execute_rcon_command(furnace_cmd)
            commands_executed += 1
            blocks_placed += 1
            equipment_placed.append("furnace")
        except Exception as e:
            print(f"[RIG_BUILDER] Error placing furnace: {str(e)}")
        
        # Place hopper (represents material handling)
        try:
            hopper_cmd = f"setblock {x+1} {y+1} {z-1} hopper"
            execute_rcon_command(hopper_cmd)
            commands_executed += 1
            blocks_placed += 1
            equipment_placed.append("hopper")
        except Exception as e:
            print(f"[RIG_BUILDER] Error placing hopper: {str(e)}")
        
        # Place chest (represents storage)
        if rig_style in ["standard", "detailed"]:
            try:
                chest_cmd = f"setblock {x-1} {y+1} {z+1} chest"
                execute_rcon_command(chest_cmd)
                commands_executed += 1
                blocks_placed += 1
                equipment_placed.append("chest")
            except Exception as e:
                print(f"[RIG_BUILDER] Error placing chest: {str(e)}")
        
        # Add stairs for access
        try:
            stairs_cmd = f"setblock {x+half_platform} {y} {z} oak_stairs"
            execute_rcon_command(stairs_cmd)
            commands_executed += 1
            blocks_placed += 1
        except Exception as e:
            print(f"[RIG_BUILDER] Error placing stairs: {str(e)}")
        
        # Step 4: Place signage with well name
        print(f"[RIG_BUILDER] Placing signage: {well_name}")
        
        try:
            # Place sign at platform edge
            sign_x = x + half_platform
            sign_cmd = f"setblock {sign_x} {y+1} {z} oak_sign"
            execute_rcon_command(sign_cmd)
            commands_executed += 1
            blocks_placed += 1
            
            # Set sign text (Note: This requires data command which may not work via RCON)
            # We'll place the sign but text setting might need manual intervention
            try:
                sign_text_cmd = f'data merge block {sign_x} {y+1} {z} {{Text1:"{{\\"text\\":\\"{well_name}\\"}}""}}'
                execute_rcon_command(sign_text_cmd)
            except:
                # Sign text setting failed, but sign is placed
                print(f"[RIG_BUILDER] Sign placed but text setting failed (expected)")
        except Exception as e:
            print(f"[RIG_BUILDER] Error placing sign: {str(e)}")
        
        # Step 5: Add lighting (glowstone)
        print(f"[RIG_BUILDER] Adding lighting...")
        
        # Place glowstone at corners of platform for visibility
        light_positions = [
            (platform_x1, y+1, platform_z1),
            (platform_x2, y+1, platform_z1),
            (platform_x1, y+1, platform_z2),
            (platform_x2, y+1, platform_z2),
        ]
        
        for light_x, light_y, light_z in light_positions:
            try:
                light_cmd = f"setblock {light_x} {light_y} {light_z} glowstone"
                execute_rcon_command(light_cmd)
                commands_executed += 1
                blocks_placed += 1
            except Exception as e:
                print(f"[RIG_BUILDER] Error placing light: {str(e)}")
        
        # Add top light on derrick
        try:
            top_light_cmd = f"setblock {x} {y+derrick_height+1} {z} glowstone"
            execute_rcon_command(top_light_cmd)
            commands_executed += 1
            blocks_placed += 1
        except Exception as e:
            print(f"[RIG_BUILDER] Error placing top light: {str(e)}")
        
        # Build success response
        print(f"[RIG_BUILDER] Rig build complete: {blocks_placed} blocks, {commands_executed} commands")
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Drilling Rig Built Successfully**

**Details:**
- **Well Name:** {well_name}
- **Rig Style:** {rig_style.capitalize()}
- **Blocks Placed:** {blocks_placed}
- **Commands Executed:** {commands_executed}

**Structure:**
- **Platform:** {platform_size}x{platform_size} smooth stone slabs
- **Derrick:** {derrick_height} blocks high, iron bars
- **Equipment:** {', '.join(equipment_placed)}
- **Lighting:** Glowstone at corners and top
- **Signage:** Oak sign with well name

**Location:**
- **Coordinates:** ({x}, {y}, {z})
- **Platform Level:** Y={y}
- **Derrick Top:** Y={y+derrick_height}

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The drilling rig is now visible in Minecraft! You can teleport to it using `/tp @s {x} {y+2} {z}`"""
        
    except Exception as e:
        print(f"[RIG_BUILDER] Unexpected error: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Build Drilling Rig",
            f"Unexpected error building rig: {str(e)}",
            [
                "Check Minecraft server connection",
                "Verify RCON is enabled and accessible",
                "Ensure coordinates are valid",
                "Try a different rig style",
                "Check server logs for errors"
            ]
        )


@tool
def visualize_collection_wells(
    collection_id: str,
    batch_size: int = 5,
    spacing: int = 50
) -> str:
    """Visualize all wellbores from a collection in Minecraft.
    
    This is a HIGH-LEVEL tool that executes batch visualization of multiple wells:
    1. Queries collection service for well list
    2. Fetches trajectory data from S3 for each well
    3. Processes wells in batches with progress updates
    4. Arranges wellheads in grid pattern with spacing
    5. Builds wellbores and drilling rigs for each well
    6. Provides summary with success/failure counts
    
    USE THIS TOOL when user asks to:
    - "Visualize all wells from collection"
    - "Build all wellbores in the collection"
    - "Show me all wells from collection [ID]"
    - "Create visualizations for the entire collection"
    
    Args:
        collection_id: Collection identifier
        batch_size: Number of wells to process simultaneously (default: 5)
        spacing: Distance between wellheads in blocks (default: 50)
    
    Returns:
        Cloudscape-formatted response with batch visualization summary
    """
    from .response_templates import CloudscapeResponseBuilder
    from .s3_data_access import S3WellDataAccess
    from .name_utils import simplify_well_name
    import math
    
    try:
        print(f"[COLLECTION_VIZ] Starting collection visualization: {collection_id}")
        print(f"[COLLECTION_VIZ] Batch size: {batch_size}, Spacing: {spacing} blocks")
        
        # Step 1: Initialize S3 data access
        print(f"[COLLECTION_VIZ] Step 1: Initializing S3 data access...")
        try:
            s3_access = S3WellDataAccess()
            
            # Validate S3 access
            validation = s3_access.validate_s3_access()
            if not validation['success']:
                return CloudscapeResponseBuilder.error_response(
                    "Collection Visualization",
                    f"S3 access validation failed: {validation['error']}",
                    validation.get('suggestions', [
                        "Check AWS credentials configuration",
                        "Verify S3 bucket permissions",
                        "Contact system administrator"
                    ])
                )
        except Exception as e:
            return CloudscapeResponseBuilder.error_response(
                "Collection Visualization",
                f"Failed to initialize S3 access: {str(e)}",
                [
                    "Check RENEWABLE_S3_BUCKET environment variable is set",
                    "Verify AWS credentials are configured",
                    "Check IAM permissions for S3 access"
                ]
            )
        
        # Step 2: List wells in collection
        print(f"[COLLECTION_VIZ] Step 2: Fetching well list from collection...")
        collection_prefix = f"collections/{collection_id}/"
        
        try:
            wells_result = s3_access.list_collection_wells(collection_prefix)
            
            if not wells_result['success']:
                return CloudscapeResponseBuilder.error_response(
                    "Fetch Collection Wells",
                    f"Failed to list wells in collection: {wells_result['error']}",
                    [
                        "Verify collection ID is correct",
                        "Check S3 bucket contains collection data",
                        "Ensure collection prefix format: collections/{collection_id}/",
                        "Check S3 permissions for listing objects"
                    ]
                )
            
            wells = wells_result['wells']
            total_wells = wells_result['total_wells']
            
            if total_wells == 0:
                return CloudscapeResponseBuilder.warning_response(
                    "No Wells Found",
                    f"Collection '{collection_id}' contains no trajectory files.",
                    "Add trajectory files to the collection in S3 before visualizing."
                )
            
            print(f"[COLLECTION_VIZ] Found {total_wells} wells in collection")
            
        except Exception as e:
            return CloudscapeResponseBuilder.error_response(
                "Fetch Collection Wells",
                f"Error listing collection wells: {str(e)}",
                [
                    "Check collection exists in S3",
                    "Verify S3 bucket configuration",
                    "Check network connectivity to S3"
                ]
            )
        
        # Step 3: Calculate grid layout for wellheads
        print(f"[COLLECTION_VIZ] Step 3: Calculating grid layout...")
        
        # Calculate grid dimensions (square grid)
        grid_size = math.ceil(math.sqrt(total_wells))
        
        # Starting position (centered around origin)
        start_x = -(grid_size * spacing) // 2
        start_z = -(grid_size * spacing) // 2
        
        print(f"[COLLECTION_VIZ] Grid: {grid_size}x{grid_size}, Starting at ({start_x}, {start_z})")
        
        # Step 4: Process wells in batches
        print(f"[COLLECTION_VIZ] Step 4: Processing wells in batches...")
        
        successful_builds = []
        failed_builds = []
        current_position = 0
        
        for batch_start in range(0, total_wells, batch_size):
            batch_end = min(batch_start + batch_size, total_wells)
            batch_wells = wells[batch_start:batch_end]
            
            print(f"[COLLECTION_VIZ] Processing batch {batch_start//batch_size + 1}: wells {batch_start+1}-{batch_end}")
            
            # Process each well in the batch
            for well_idx, well_info in enumerate(batch_wells):
                global_idx = batch_start + well_idx
                well_name = well_info['well_name']
                s3_key = well_info['s3_key']
                
                # Send progress update
                progress_msg = CloudscapeResponseBuilder.batch_progress(
                    current=global_idx + 1,
                    total=total_wells,
                    well_name=well_name,
                    status="building"
                )
                print(f"[COLLECTION_VIZ] {progress_msg}")
                
                try:
                    # Calculate wellhead position in grid
                    grid_row = global_idx // grid_size
                    grid_col = global_idx % grid_size
                    wellhead_x = start_x + (grid_col * spacing)
                    wellhead_z = start_z + (grid_row * spacing)
                    wellhead_y = 100  # Ground level
                    
                    print(f"[COLLECTION_VIZ] Well {global_idx+1}/{total_wells}: {well_name} at ({wellhead_x}, {wellhead_y}, {wellhead_z})")
                    
                    # Fetch trajectory data from S3
                    print(f"[COLLECTION_VIZ] Fetching trajectory data: {s3_key}")
                    trajectory_result = s3_access.get_trajectory_data(s3_key)
                    
                    if not trajectory_result['success']:
                        error_msg = trajectory_result.get('error', 'Unknown error')
                        print(f"[COLLECTION_VIZ] Failed to fetch trajectory: {error_msg}")
                        failed_builds.append({
                            'well_name': well_name,
                            'reason': f"Data fetch failed: {error_msg}"
                        })
                        continue
                    
                    # Get coordinates or survey data
                    data_type = trajectory_result['data_type']
                    coordinates = trajectory_result.get('coordinates')
                    survey_data = trajectory_result.get('survey_data')
                    
                    if not coordinates and not survey_data:
                        print(f"[COLLECTION_VIZ] No trajectory data found")
                        failed_builds.append({
                            'well_name': well_name,
                            'reason': "No trajectory data in file"
                        })
                        continue
                    
                    # Convert to Minecraft coordinates
                    print(f"[COLLECTION_VIZ] Converting to Minecraft coordinates (type: {data_type})...")
                    
                    if data_type == "coordinates":
                        # Direct coordinate transformation
                        from .trajectory_tools import transform_coordinates_to_minecraft
                        coordinates_json = json.dumps(coordinates)
                        minecraft_coords = transform_coordinates_to_minecraft(coordinates_json)
                        
                        # Adjust coordinates to grid position
                        coords_data = json.loads(minecraft_coords)
                        if not coords_data.get("success", False):
                            failed_builds.append({
                                'well_name': well_name,
                                'reason': f"Coordinate transformation failed: {coords_data.get('error', 'Unknown')}"
                            })
                            continue
                        
                        # Offset coordinates to grid position
                        minecraft_points = coords_data.get("coordinates", [])
                        for point in minecraft_points:
                            point['x'] += wellhead_x
                            point['z'] += wellhead_z
                        
                        coords_data['wellhead_x'] = wellhead_x
                        coords_data['wellhead_z'] = wellhead_z
                        minecraft_coords = json.dumps(coords_data)
                        
                    elif data_type == "survey":
                        # Calculate from survey data
                        from .trajectory_tools import calculate_trajectory_coordinates
                        survey_json = json.dumps(survey_data)
                        minecraft_coords = calculate_trajectory_coordinates(survey_json)
                        
                        if "error" in minecraft_coords.lower():
                            failed_builds.append({
                                'well_name': well_name,
                                'reason': f"Survey calculation failed: {minecraft_coords}"
                            })
                            continue
                        
                        # Offset coordinates to grid position
                        coords_data = json.loads(minecraft_coords)
                        minecraft_points = coords_data.get("coordinates", [])
                        for point in minecraft_points:
                            point['x'] += wellhead_x
                            point['z'] += wellhead_z
                        
                        coords_data['wellhead_x'] = wellhead_x
                        coords_data['wellhead_z'] = wellhead_z
                        minecraft_coords = json.dumps(coords_data)
                    
                    else:
                        failed_builds.append({
                            'well_name': well_name,
                            'reason': f"Unknown data type: {data_type}"
                        })
                        continue
                    
                    # Build wellbore in Minecraft
                    print(f"[COLLECTION_VIZ] Building wellbore...")
                    display_name = simplify_well_name(well_name)
                    
                    build_result = build_wellbore_in_minecraft_enhanced(
                        minecraft_coords,
                        well_name=display_name,
                        color_scheme="default"
                    )
                    
                    if "error" in build_result.lower():
                        failed_builds.append({
                            'well_name': well_name,
                            'reason': f"Wellbore build failed: {build_result}"
                        })
                        continue
                    
                    # Build drilling rig at wellhead
                    print(f"[COLLECTION_VIZ] Building drilling rig...")
                    try:
                        rig_result = build_drilling_rig(
                            x=wellhead_x,
                            y=wellhead_y,
                            z=wellhead_z,
                            well_name=display_name,
                            rig_style="standard"
                        )
                        
                        if CloudscapeResponseBuilder.SUCCESS_ICON not in rig_result:
                            print(f"[COLLECTION_VIZ] Rig build failed (non-critical): {rig_result}")
                    except Exception as e:
                        print(f"[COLLECTION_VIZ] Rig build error (non-critical): {str(e)}")
                    
                    # Record success
                    successful_builds.append({
                        'well_name': well_name,
                        'display_name': display_name,
                        'coordinates': (wellhead_x, wellhead_y, wellhead_z)
                    })
                    
                    print(f"[COLLECTION_VIZ] Well {well_name} built successfully")
                    
                except Exception as e:
                    print(f"[COLLECTION_VIZ] Error building well {well_name}: {str(e)}")
                    failed_builds.append({
                        'well_name': well_name,
                        'reason': f"Unexpected error: {str(e)}"
                    })
                    continue
        
        # Step 5: Generate summary response
        print(f"[COLLECTION_VIZ] Batch processing complete")
        print(f"[COLLECTION_VIZ] Successful: {len(successful_builds)}, Failed: {len(failed_builds)}")
        
        # Prepare failed wells list for response
        failed_well_names = None
        if failed_builds:
            failed_well_names = [f"{fb['well_name']} ({fb['reason']})" for fb in failed_builds]
        
        return CloudscapeResponseBuilder.collection_summary(
            collection_name=collection_id,
            wells_built=len(successful_builds),
            wells_failed=len(failed_builds),
            total_wells=total_wells,
            failed_wells=failed_well_names
        )
        
    except Exception as e:
        print(f"[COLLECTION_VIZ] Unexpected error in collection visualization: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Collection Visualization",
            f"Unexpected error: {str(e)}",
            [
                "Check all system components are running",
                "Verify collection ID is correct",
                "Check S3 bucket configuration",
                "Verify Minecraft server connection",
                "Check server logs for details"
            ]
        )


@tool
def reset_demo_environment(confirm: bool = False) -> str:
    """Reset entire demo environment to clean state.
    
    This is a HIGH-LEVEL tool that executes a complete demo reset sequence:
    1. Clears all wellbores from Minecraft world
    2. Removes all drilling rigs and markers
    3. Locks world time to daytime for visibility
    4. Teleports all players to spawn point
    5. Provides ready-for-demo confirmation
    
    USE THIS TOOL when user asks to:
    - "Reset the demo environment"
    - "Reset everything"
    - "Prepare for demo"
    - "Clean up for new demo"
    - "Start fresh"
    
    IMPORTANT: This is a destructive operation. Requires confirm=True to execute.
    
    Args:
        confirm: Must be True to execute reset (safety check)
    
    Returns:
        Cloudscape-formatted response with reset confirmation or warning
    """
    from .response_templates import CloudscapeResponseBuilder
    
    try:
        print(f"[DEMO_RESET] Demo reset requested, confirm={confirm}")
        
        # Step 1: Confirmation check
        if not confirm:
            print(f"[DEMO_RESET] Reset not confirmed, returning warning")
            return f"""{CloudscapeResponseBuilder.WARNING_ICON} **Demo Reset Confirmation Required**

**Warning:** This operation will:
- Clear ALL wellbores from Minecraft
- Remove ALL drilling rigs
- Clear ALL markers and structures
- Reset world time to daytime
- Teleport all players to spawn

**To proceed, confirm the reset:**
Set `confirm=True` when calling this tool.

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** This is a safety check to prevent accidental resets during active demonstrations."""
        
        print(f"[DEMO_RESET] Reset confirmed, starting sequence...")
        
        # Step 2: Clear all wellbores, rigs, and markers
        print(f"[DEMO_RESET] Step 1/4: Clearing Minecraft environment...")
        try:
            clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)
            
            if CloudscapeResponseBuilder.ERROR_ICON in clear_result:
                print(f"[DEMO_RESET] Clear operation failed: {clear_result}")
                return CloudscapeResponseBuilder.error_response(
                    "Demo Reset",
                    "Failed to clear Minecraft environment during reset",
                    [
                        "Check Minecraft server connection",
                        "Verify RCON is enabled and accessible",
                        "Try clearing manually first",
                        "Check server logs for errors"
                    ]
                )
            
            print(f"[DEMO_RESET] Environment cleared successfully")
            
        except Exception as e:
            print(f"[DEMO_RESET] Error during clear: {str(e)}")
            return CloudscapeResponseBuilder.error_response(
                "Demo Reset - Clear Failed",
                f"Error clearing environment: {str(e)}",
                [
                    "Check Minecraft server status",
                    "Verify RCON connection",
                    "Try clearing manually",
                    "Check server logs for details"
                ]
            )
        
        # Step 3: Lock world time to daytime
        print(f"[DEMO_RESET] Step 2/4: Locking world time to daytime...")
        try:
            time_result = lock_world_time(time="day", enabled=True)
            
            if CloudscapeResponseBuilder.ERROR_ICON in time_result:
                print(f"[DEMO_RESET] Time lock failed (non-critical): {time_result}")
                # Don't fail the whole reset if time lock fails
            else:
                print(f"[DEMO_RESET] World time locked to daytime")
                
        except Exception as e:
            print(f"[DEMO_RESET] Error during time lock (non-critical): {str(e)}")
            # Don't fail the whole reset if time lock fails
        
        # Step 4: Teleport players to spawn
        print(f"[DEMO_RESET] Step 3/4: Teleporting players to spawn...")
        try:
            # Get list of online players
            player_list_result = execute_rcon_command("list")
            print(f"[DEMO_RESET] Player list: {player_list_result}")
            
            # Teleport all players to spawn (0, 100, 0)
            tp_command = "tp @a 0 100 0"
            tp_result = execute_rcon_command(tp_command)
            print(f"[DEMO_RESET] Teleport result: {tp_result}")
            
        except Exception as e:
            print(f"[DEMO_RESET] Error during teleport (non-critical): {str(e)}")
            # Don't fail the whole reset if teleport fails
        
        # Step 5: Return success confirmation
        print(f"[DEMO_RESET] Step 4/4: Demo reset complete!")
        return CloudscapeResponseBuilder.demo_reset_confirmation()
        
    except Exception as e:
        print(f"[DEMO_RESET] Unexpected error in demo reset: {str(e)}")
        return CloudscapeResponseBuilder.error_response(
            "Demo Reset",
            f"Unexpected error during reset: {str(e)}",
            [
                "Check all system components are running",
                "Verify Minecraft server connection",
                "Try resetting components individually",
                "Check server logs for details",
                "Contact system administrator if issue persists"
            ]
        )


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
