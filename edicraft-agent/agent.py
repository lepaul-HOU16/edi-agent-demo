import os
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent, tool
from tools.rcon_tool import execute_rcon_command
from tools.osdu_client import search_wellbores_live, get_trajectory_coordinates_live
from tools.coordinates import transform_utm_to_minecraft, build_wellbore_path
from tools.trajectory_tools import calculate_trajectory_coordinates, parse_osdu_trajectory_file, build_wellbore_in_minecraft
from tools.horizon_tools import search_horizons_live, parse_horizon_file, convert_horizon_to_minecraft, download_horizon_data
from tools.surface_tools import build_horizon_surface
from tools.workflow_tools import build_wellbore_trajectory_complete, build_horizon_surface_complete, get_system_status, clear_minecraft_environment, lock_world_time, build_drilling_rig, reset_demo_environment

app = BedrockAgentCoreApp()

# Environment variables
REGION = os.getenv('REGION', '')
AGENT_NAME = os.getenv('AGENT_NAME', '')
MINECRAFT_HOST = os.getenv('MINECRAFT_HOST', '')
MINECRAFT_RCON_PORT = os.getenv('MINECRAFT_RCON_PORT', '')
MINECRAFT_RCON_PASSWORD = os.getenv('MINECRAFT_RCON_PASSWORD', '')
BEDROCK_MODEL_ID = os.getenv('BEDROCK_MODEL_ID', '')
IMAGE_TAG = os.getenv('IMAGE_TAG', '')
NETWORK_MODE = os.getenv('NETWORK_MODE', '')
EDI_USERNAME = os.getenv('EDI_USERNAME', '')
EDI_PASSWORD = os.getenv('EDI_PASSWORD', '')
EDI_CLIENT_ID = os.getenv('EDI_CLIENT_ID', '')
EDI_CLIENT_SECRET = os.getenv('EDI_CLIENT_SECRET', '')
EDI_PARTITION = os.getenv('EDI_PARTITION', '')
EDI_PLATFORM_URL = os.getenv('EDI_PLATFORM_URL', '')

# Removed show_config tool - it was triggering welcome messages
# @tool
# def show_config() -> str:
#     """Show current agent configuration."""
#     config = {
#         'REGION': REGION, 'AGENT_NAME': AGENT_NAME, 'MINECRAFT_HOST': MINECRAFT_HOST,
#         'MINECRAFT_RCON_PORT': MINECRAFT_RCON_PORT, 'BEDROCK_MODEL_ID': BEDROCK_MODEL_ID,
#         'EDI_PLATFORM_URL': EDI_PLATFORM_URL, 'EDI_PARTITION': EDI_PARTITION
#     }
#     return f"Configuration: {config}"

@tool
def search_wellbores() -> str:
    """Search for wellbore trajectories in OSDU platform.
    
    LOW-LEVEL tool for searching wellbores.
    
    USE THIS TOOL when:
    - User asks "what wellbores are available?"
    - User wants to search or list wellbores
    
    DO NOT use this tool when:
    - User asks to BUILD a wellbore (use build_wellbore_trajectory_complete instead)
    """
    return search_wellbores_live()

@tool
def get_trajectory_coordinates(wellbore_id: str) -> str:
    """Get trajectory coordinates for a specific wellbore from OSDU.
    
    LOW-LEVEL tool - part of wellbore workflow.
    This is STEP 1 of 3 in the manual wellbore workflow.
    
    PREFER using build_wellbore_trajectory_complete instead of this tool.
    
    Only use this if you need raw trajectory data without building.
    """
    return get_trajectory_coordinates_live(wellbore_id)

@tool
def minecraft_command(command: str) -> str:
    """Execute a raw Minecraft RCON command.
    
    LOW-LEVEL tool for advanced Minecraft commands.
    
    Only use this for custom commands not covered by other tools.
    """
    return execute_rcon_command(command)

@tool
def list_players() -> str:
    """Get list of currently online players in Minecraft.
    
    USE THIS TOOL when user asks:
    - "List players"
    - "Who is online?"
    - "Show me players"
    - "How many players?"
    
    DO NOT use this tool when:
    - User asks to build wellbore trajectories
    - User asks to build horizon surfaces
    - User asks about system status (use get_system_status instead)
    """
    return execute_rcon_command("list")

@tool
def get_player_positions() -> str:
    """Get detailed positions of all online players in Minecraft.
    
    USE THIS TOOL when user asks:
    - "Where are the players?"
    - "Player positions"
    - "Show player coordinates"
    
    DO NOT use this tool when:
    - User asks to build wellbore trajectories
    - User asks to build horizon surfaces
    """
    return execute_rcon_command("execute as @a run tellraw @a [\"\",{\"text\":\"Player: \"},{\"selector\":\"@s\"},{\"text\":\" at \"},{\"score\":{\"name\":\"@s\",\"objective\":\"x\"}},{\"text\":\", \"},{\"score\":{\"name\":\"@s\",\"objective\":\"y\"}},{\"text\":\", \"},{\"score\":{\"name\":\"@s\",\"objective\":\"z\"}}]")

@tool
def transform_coordinates(x: float, y: float, z: float) -> str:
    """Transform UTM coordinates to Minecraft coordinates."""
    mc_x, mc_y, mc_z = transform_utm_to_minecraft(x, y, z)
    return f"UTM ({x}, {y}, {z}) -> Minecraft ({mc_x}, {mc_y}, {mc_z})"

@tool
def build_wellbore(coordinates_str: str) -> str:
    """Build a wellbore path in Minecraft. Coordinates as 'x1,y1,z1;x2,y2,z2;...'"""
    try:
        coords = []
        for coord_set in coordinates_str.split(';'):
            x, y, z = map(float, coord_set.split(','))
            coords.append((x, y, z))
        return build_wellbore_path(coords)
    except Exception as e:
        return f"Error parsing coordinates: {str(e)}"

@tool
def setup_coordinate_tracking() -> str:
    """Set up coordinate tracking system in Minecraft."""
    commands = [
        "scoreboard objectives add x dummy",
        "scoreboard objectives add y dummy", 
        "scoreboard objectives add z dummy",
        "execute as @a store result score @s x run data get entity @s Pos[0]",
        "execute as @a store result score @s y run data get entity @s Pos[1]",
        "execute as @a store result score @s z run data get entity @s Pos[2]"
    ]
    results = []
    for cmd in commands:
        results.append(execute_rcon_command(cmd))
    return f"Coordinate tracking setup completed. Results: {'; '.join(results)}"

agent = Agent(
    model=BEDROCK_MODEL_ID,
    # HIGH-LEVEL TOOLS FIRST - LLM should prefer these
    tools=[
        # Composite workflow tools (preferred)
        build_wellbore_trajectory_complete,
        build_horizon_surface_complete,
        clear_minecraft_environment,
        get_system_status,
        # Player information tools
        list_players,
        get_player_positions,
        # Low-level tools (for advanced use)
        search_wellbores,
        get_trajectory_coordinates,
        minecraft_command,
        transform_coordinates,
        build_wellbore,
        setup_coordinate_tracking,
        calculate_trajectory_coordinates,
        parse_osdu_trajectory_file,
        build_wellbore_in_minecraft,
        search_horizons_live,
        parse_horizon_file,
        convert_horizon_to_minecraft,
        download_horizon_data,
        build_horizon_surface
    ],
    system_prompt=f"""You are a Minecraft visualization execution agent that handles both direct tool calls and natural language queries.

HYBRID APPROACH:
- Direct tool calls are pre-classified and routed directly to composite workflow tools
- Natural language queries are processed by you using the decision tree below

DECISION TREE - Follow this EXACTLY for natural language queries:

Step 1: Does the user message contain words like "clear", "remove", "clean", "reset", or "delete"?
  YES → Call clear_minecraft_environment() with appropriate parameters
  NO → Go to Step 2

Step 2: Does the user message contain a well ID pattern (WELL-XXX where XXX is digits)?
  YES → Extract the well ID and call build_wellbore_trajectory_complete(well_id)
  NO → Go to Step 3

Step 3: Does the user message contain the word "wellbore" or "trajectory" or "well"?
  YES → If no well ID found, ask user to specify well ID. Otherwise call build_wellbore_trajectory_complete()
  NO → Go to Step 4

Step 4: Does the user message contain the word "horizon" or "surface"?
  YES → Call build_horizon_surface_complete()
  NO → Go to Step 5

Step 5: Does the user message contain "list" AND ("players" OR "online")?
  YES → Call list_players()
  NO → Go to Step 6

Step 6: Does the user message contain ("position" OR "where") AND "player"?
  YES → Call get_player_positions()
  NO → Go to Step 7

Step 7: Is this ONLY a greeting (hello/hi/hey) with NO other action words?
  YES → Call get_system_status()
  NO → Explain what you can do and ask for clarification

EXAMPLES:
"Clear the Minecraft environment" → Contains "clear" → clear_minecraft_environment()
"Remove all wellbores" → Contains "remove" → clear_minecraft_environment(area="wellbores")
"Clean up the world" → Contains "clean" → clear_minecraft_environment()
"Build wellbore trajectory for WELL-011" → Contains "WELL-011" → build_wellbore_trajectory_complete("WELL-011")
"Visualize wellbore WELL-005" → Contains "WELL-005" → build_wellbore_trajectory_complete("WELL-005")
"Show me wellbore WELL-003" → Contains "WELL-003" → build_wellbore_trajectory_complete("WELL-003")
"Hello" → ONLY greeting, no action words → get_system_status()
"List players" → Contains "list" and "players" → list_players()
"Build horizon surface" → Contains "horizon" → build_horizon_surface_complete()

CRITICAL RULES:
1. ANY message containing "clear", "remove", "clean", "reset", or "delete" MUST call clear_minecraft_environment
2. ANY message containing "WELL-" followed by digits MUST call build_wellbore_trajectory_complete with that well ID
3. NEVER call get_system_status() if the message contains action words like "build", "visualize", "show", "create", "clear"
4. ALWAYS use composite workflow tools (build_wellbore_trajectory_complete, build_horizon_surface_complete, clear_minecraft_environment) instead of low-level tools
5. Low-level tools are only for advanced debugging or custom workflows
6. Composite workflow tools handle the complete end-to-end workflow automatically

Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.4, 3.5"""
)

def handle_direct_tool_call(message: str) -> dict:
    """Handle direct tool call messages from the TypeScript handler.
    
    Parses DIRECT_TOOL_CALL messages and routes to appropriate composite workflow tools.
    
    Format: "DIRECT_TOOL_CALL: function_name(parameters)"
    
    Supported functions:
    - build_wellbore_trajectory_complete("WELL-XXX")
    - build_horizon_surface_complete(None) or build_horizon_surface_complete("horizon_name")
    - clear_minecraft_environment("all", True) or clear_minecraft_environment()
    - list_players()
    - get_player_positions()
    - get_system_status()
    
    Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3
    
    Args:
        message: The DIRECT_TOOL_CALL message to parse
    
    Returns:
        dict with "response" key containing the tool execution result,
        or "error" key if parsing or execution fails
    """
    import re
    
    print(f"[DIRECT TOOL CALL] Parsing message: {message}")
    
    # Parse DIRECT_TOOL_CALL format: "DIRECT_TOOL_CALL: function_name(parameters)"
    pattern = r'DIRECT_TOOL_CALL:\s*(\w+)\((.*?)\)'
    match = re.match(pattern, message.strip())
    
    if not match:
        error_msg = f"Invalid DIRECT_TOOL_CALL format. Expected: 'DIRECT_TOOL_CALL: function_name(parameters)'. Got: '{message}'"
        print(f"[DIRECT TOOL CALL] ERROR: {error_msg}")
        return {"error": error_msg}
    
    function_name = match.group(1)
    parameters_str = match.group(2).strip()
    
    print(f"[DIRECT TOOL CALL] Function: {function_name}")
    print(f"[DIRECT TOOL CALL] Parameters: {parameters_str}")
    
    try:
        # Route to appropriate composite workflow tool
        if function_name == "build_wellbore_trajectory_complete":
            # Extract well ID from parameters (e.g., "WELL-011")
            well_id_match = re.search(r'"([^"]+)"', parameters_str)
            if not well_id_match:
                return {"error": f"Invalid parameters for build_wellbore_trajectory_complete. Expected well ID string. Got: {parameters_str}"}
            
            well_id = well_id_match.group(1)
            print(f"[DIRECT TOOL CALL] Calling build_wellbore_trajectory_complete with well_id={well_id}")
            result = build_wellbore_trajectory_complete(well_id)
            return {"response": result}
        
        elif function_name == "build_horizon_surface_complete":
            # Extract horizon name from parameters (optional, can be None or "horizon_name")
            horizon_name = None
            if parameters_str and parameters_str != "None":
                horizon_name_match = re.search(r'"([^"]+)"', parameters_str)
                if horizon_name_match:
                    horizon_name = horizon_name_match.group(1)
            
            print(f"[DIRECT TOOL CALL] Calling build_horizon_surface_complete with horizon_name={horizon_name}")
            result = build_horizon_surface_complete(horizon_name)
            return {"response": result}
        
        elif function_name == "list_players":
            # No parameters expected
            print(f"[DIRECT TOOL CALL] Calling list_players")
            result = list_players()
            return {"response": result}
        
        elif function_name == "get_player_positions":
            # No parameters expected
            print(f"[DIRECT TOOL CALL] Calling get_player_positions")
            result = get_player_positions()
            return {"response": result}
        
        elif function_name == "clear_minecraft_environment":
            # Extract area and preserve_terrain parameters (optional)
            area = "all"
            preserve_terrain = True
            
            if parameters_str:
                # Parse parameters like "all", True or "wellbores", False
                params = parameters_str.split(',')
                if len(params) >= 1:
                    area_match = re.search(r'"([^"]+)"', params[0])
                    if area_match:
                        area = area_match.group(1)
                if len(params) >= 2:
                    preserve_terrain = "true" in params[1].lower()
            
            print(f"[DIRECT TOOL CALL] Calling clear_minecraft_environment with area={area}, preserve_terrain={preserve_terrain}")
            result = clear_minecraft_environment(area, preserve_terrain)
            return {"response": result}
        
        elif function_name == "get_system_status":
            # No parameters expected
            print(f"[DIRECT TOOL CALL] Calling get_system_status")
            result = get_system_status()
            return {"response": result}
        
        else:
            error_msg = f"Unknown function: {function_name}. Supported functions: build_wellbore_trajectory_complete, build_horizon_surface_complete, clear_minecraft_environment, list_players, get_player_positions, get_system_status"
            print(f"[DIRECT TOOL CALL] ERROR: {error_msg}")
            return {"error": error_msg}
    
    except Exception as e:
        error_msg = f"Error executing {function_name}: {str(e)}"
        print(f"[DIRECT TOOL CALL] ERROR: {error_msg}")
        return {"error": error_msg}


@app.entrypoint
def main(payload):
    """Main entry point for the EDIcraft agent with hybrid routing.
    
    HYBRID APPROACH (Requirements 3.4, 3.5):
    - Deterministic queries (high confidence) → Direct tool calls via handle_direct_tool_call()
    - Ambiguous queries (low confidence) → Natural language processing via LLM agent
    
    This wrapper function checks the message type and routes accordingly:
    1. DIRECT_TOOL_CALL messages → handle_direct_tool_call() for fast, deterministic execution
    2. Natural language messages → agent() for LLM-based intent detection and tool selection
    
    Both paths use the same composite workflow tools, ensuring consistent behavior.
    
    Args:
        payload: Dict with "prompt" key containing the user message
    
    Returns:
        Dict with "response" key (success) or "error" key (failure)
    """
    # Handle both "message" and "prompt" keys for compatibility
    prompt = payload.get("prompt") or payload.get("message") or "Hello from AgentCore!"
    
    print(f"[MAIN] Received payload keys: {list(payload.keys())}")
    print(f"[MAIN] Prompt value: {prompt[:100] if prompt else 'None'}")
    
    if not prompt or prompt.strip() == "":
        return {"error": "Empty prompt provided"}
    
    try:
        # Check if this is a DIRECT_TOOL_CALL message (deterministic routing)
        if prompt.startswith("DIRECT_TOOL_CALL:"):
            print("[HYBRID ROUTING] Detected DIRECT_TOOL_CALL message")
            print("[HYBRID ROUTING] Using deterministic routing to composite workflow tools")
            return handle_direct_tool_call(prompt)
        
        # Otherwise, route to LLM agent for natural language processing
        print("[HYBRID ROUTING] Detected natural language message")
        print("[HYBRID ROUTING] Using LLM agent for intent detection and tool selection")
        response = agent(prompt)
        
        # Handle different response formats
        if hasattr(response, 'message'):
            return {"response": response.message}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}
    except Exception as e:
        error_msg = f"Error processing message: {str(e)}"
        print(f"[HYBRID ROUTING] ERROR: {error_msg}")
        return {"error": error_msg}

if __name__ == "__main__":
    app.run()
