import os
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent, tool
from tools.rcon_tool import execute_rcon_command
from tools.osdu_client import search_wellbores_live, get_trajectory_coordinates_live
from tools.coordinates import transform_utm_to_minecraft, build_wellbore_path
from tools.trajectory_tools import calculate_trajectory_coordinates, parse_osdu_trajectory_file, build_wellbore_in_minecraft
from tools.horizon_tools import search_horizons_live, parse_horizon_file, convert_horizon_to_minecraft, download_horizon_data
from tools.surface_tools import build_horizon_surface

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
    """Search for wellbore trajectories in OSDU platform with live authentication."""
    return search_wellbores_live()

@tool
def get_trajectory_coordinates(wellbore_id: str) -> str:
    """Get trajectory coordinates for a specific wellbore with live OSDU connection."""
    return get_trajectory_coordinates_live(wellbore_id)

@tool
def minecraft_command(command: str) -> str:
    """Execute a Minecraft RCON command."""
    return execute_rcon_command(command)

@tool
def list_players() -> str:
    """Get list of currently online players."""
    return execute_rcon_command("list")

@tool
def get_player_positions() -> str:
    """Get positions of all online players."""
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
    tools=[search_wellbores, get_trajectory_coordinates, minecraft_command, list_players, get_player_positions, transform_coordinates, build_wellbore, setup_coordinate_tracking, calculate_trajectory_coordinates, parse_osdu_trajectory_file, build_wellbore_in_minecraft, search_horizons_live, parse_horizon_file, convert_horizon_to_minecraft, download_horizon_data, build_horizon_surface],
    system_prompt=f"""You are a Minecraft visualization agent. You MUST call tools to execute user requests.

CRITICAL RULES:
- NEVER provide welcome messages, greetings, or capability lists
- NEVER say "I'm ready to help" or "What would you like to do"
- NEVER list your capabilities unless explicitly asked
- ALWAYS call the appropriate tool immediately
- ONLY respond with tool execution results

TOOL USAGE:
- "build wellbore": call search_wellbores, then build_wellbore_in_minecraft
- "list players": call list_players
- "search wellbores": call search_wellbores
- "horizon": call search_horizons_live

MINECRAFT COORDINATES:
- Y=100 is ground level
- Wellbores extend downward from surface"""
)

@app.entrypoint
def main(payload):
    # Handle both "message" and "prompt" keys for compatibility
    prompt = payload.get("prompt", "Hello from AgentCore!")
    if not prompt or prompt.strip() == "":
        return {"error": "Empty prompt provided"}
    
    try:
        response = agent(prompt)
        # Handle different response formats
        if hasattr(response, 'message'):
            return {"response": response.message}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

if __name__ == "__main__":
    app.run()
