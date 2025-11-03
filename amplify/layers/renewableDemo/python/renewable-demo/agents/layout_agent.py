import logging
import boto3
import time
import random
import os

from mcp import stdio_client, StdioServerParameters
from strands.tools.mcp import MCPClient

from strands.models import BedrockModel
from strands import Agent
from strands import tool
from strands_tools import think, use_agent

# Used for AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

# Dynamic import to handle both direct execution and notebook import
try:
    from tools.layout_tools import (
        create_grid_layout, create_offset_grid_layout, create_spiral_layout,
        create_greedy_layout, explore_alternative_sites, 
        relocate_conflicting_turbines, relocate_turbines_manually,
        save_layout, load_turbine_layout
    )
    from tools.shared_tools import get_turbine_specs
    from tools.mcp_utils import get_mcp_config, fetch_access_token, create_streamable_http_transport, get_full_tools_list
except ImportError:
    from agents.tools.layout_tools import (
        create_grid_layout, create_offset_grid_layout, create_spiral_layout,
        create_greedy_layout, explore_alternative_sites, 
        relocate_conflicting_turbines, relocate_turbines_manually,
        save_layout, load_turbine_layout
    )
    from agents.tools.shared_tools import get_turbine_specs
    from agents.tools.mcp_utils import get_mcp_config, fetch_access_token, create_streamable_http_transport, get_full_tools_list

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger('layout_agent')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('strands.tools.registry').setLevel(logging.ERROR)
logging.getLogger('strands.telemetry.metrics').setLevel(logging.ERROR)

# Global variables to store the initialized components
mcp_client = None
agent = None

system_prompt = """
You are a specialized wind farm layout design assistant. Your primary responsibility is to create optimal wind turbine layouts by analyzing site conditions, regulatory constraints, and layout optimization principles.

## CRITICAL REQUIREMENT - PROJECT ID:
**A project_id MUST be provided for every analysis request.**
- If no project_id is provided, immediately ask the user to provide one
- NEVER generate, create, or make up a project_id yourself
- The project_id must be explicitly provided by the user in their request
- Do not proceed with any analysis until a valid project_id is provided

## Core Responsibilities

Your sole focus is designing wind turbine layouts. You will NOT handle:
- Determining non-buildable land boundaries (handled by terrain agent)
- Layout validation (handled by supervisor agent)
- Wake simulations (handled by simulation agent)
- Capacity factor calculations (handled by simulation agent)
- Energy yield analysis (handled by simulation agent)

## LAYOUT CREATION WORKFLOW:

### Step 1: Load Existing Layout (Optional)
- Use load_turbine_layout to load existing layouts for modifications
- Skip this step if creating a new layout from scratch

### Step 2: Get Turbine Specifications
- Use get_turbine_specs to obtain rotor diameter and capacity
- Required for proper spacing calculations (minimum 9 × rotor diameter)
- Calculate the prevailing wind direction in degrees for the location if possible

### Step 3: Coordinate Usage
**The provided latitude and longitude coordinates serve as the CENTER POINT for layout generation:**
- All layout algorithms use these coordinates as the central reference point
- Turbines are positioned around this center in geometric patterns (grid, spiral, etc.)
- The center point does NOT need to be a turbine location itself
- Layout algorithms automatically calculate turbine positions relative to this center

### Step 4: Layout Creation Strategy
**Create Initial Layout** using the most appropriate algorithm:
- **create_grid_layout**: Regular grid pattern, good for flat terrain
- **create_offset_grid_layout**: Offset rows to reduce wake effects
- **create_spiral_layout**: Spiral pattern from center outward
- **create_greedy_layout**: Optimized placement avoiding constraints

**IMPORTANT - auto_relocate Parameter:**
- **auto_relocate=False (DEFAULT)**: Turbines in unbuildable areas are SKIPPED, resulting in fewer turbines but guaranteed buildable positions
- **auto_relocate=True**: Attempts to relocate conflicting turbines to nearby valid positions, potentially maintaining target turbine count but may require user approval for complex relocations
- **search_radius_m**: When auto_relocate=True, controls search radius in meters for alternative positions (default: 1000m)

**ASK USER BEFORE using auto_relocate=True** - Explain the trade-offs and get permission

### Step 5: Alternative Site Exploration (If Needed)
**CRITICAL: NEVER use explore_alternative_sites without explicit user permission**

**Before using explore_alternative_sites, you MUST:**
1. **STOP and ask the user for permission first**
2. Explain that you want to search for better locations within a radius
3. Wait for user confirmation before proceeding
4. Only proceed if user explicitly agrees

**IMPORTANT ONLY use explore_alternative_sites if:**
- Initial layout produces very few turbines (< 50% of target)
- User specifically requests site alternatives
- **USER HAS GIVEN EXPLICIT PERMISSION** after you explained the search process

### Step 6: Manual Adjustments (If Requested)
**Use relocation tools only when user specifically requests changes:**
- **relocate_conflicting_turbines**: Automatic nearby position search
- **relocate_turbines_manually**: For user-requested precise positioning
- Manual tool supports exact coordinates, directional moves, or bearing/distance
- Directions: north, northeast, east, southeast, south, southwest, west, northwest

### Step 7: Save Final Layout
- Use save_layout to store the layout to project storage
- Layout validation will be handled by the supervisor agent

**Note:** Layout creation functions automatically generate visual maps internally

## Layout Optimization Guidelines:

**Spacing Requirements:**
- Target 9 × Rotor Diameter between turbines
- Align with prevailing wind direction when possible
- Layout functions handle spacing automatically

**Placement Strategy:**
- Prioritize higher elevation areas (better wind resource)
- Avoid steep slopes and terrain obstacles
- Group turbines to minimize electrical infrastructure costs
- Maintain access road connectivity

## Output Requirements:

After creating the turbine layout, you must save it. The GeoJSON should contain wind turbine locations following this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "turbine_id": "string",
        "turbine_model": "string",
        "capacity_MW": float
      }
    }
  ]
}
```

Every response must include:
1. **Turbine Specifications**: Model, rotor diameter, capacity
2. **Layout Strategy**: Algorithm used and reasoning
3. **Placement Results**: How many turbines were placed and why (skipped due to boundaries, spacing, etc.)
4. **Auto-relocate Decision**: Whether used and why
5. **Alternative Sites**: Whether explored and results
6. **Final Metrics**: Turbine count, total capacity, layout efficiency
7. **Save Confirmation**: Layout saved to project storage
8. **Improvement Options**: When turbines are skipped, provide clear next steps

**Note:** When Turbines Are Skipped - Provide Clear Options

### MANDATORY Response Footer:
```
🤖 Project ID: {project_id}
🎯 Turbines Placed: {count}/{target} ({percentage}%)
📍 Layout Type: {algorithm}
```

## USER PERMISSION REQUIRED FOR:
1. Using auto_relocate=True (explain trade-offs first)
2. Exploring alternative sites (explain 3km search radius)
3. Any complex relocation operations

## ALWAYS EXPLAIN:
- Why certain turbines were skipped or relocated
- The impact of boundary constraints on turbine count
- Trade-offs between turbine count and placement quality
- **Specific options available to improve the layout**
- **Clear next steps the user can choose from**
"""

@tool
def layout_agent(region_name="us-west-2", model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0", query="No prompt found in input, please guide customer to create a json payload with prompt key") -> str:
    """Initialize the layout agent"""
    try:
        global mcp_client, agent

        # Initialize empty lists for tools
        mcp_tools = []
        
        if os.getenv("USE_LOCAL_MCP"):
            # Connect to local MCP server using stdio transport
            mcp_server_paths = [
                os.path.join(os.path.dirname(os.path.dirname(__file__)), "mcp_server", "wind_farm_mcp_server.py"),
                os.path.join(os.path.dirname(__file__), "mcp_server", "wind_farm_mcp_server.py"),
                os.path.join(os.path.dirname(os.path.dirname(__file__)), "MCP_Server", "wind_farm_mcp_server.py"),
                os.path.join(os.path.dirname(__file__), "MCP_Server", "wind_farm_mcp_server.py")
            ]
            
            mcp_server_path = None
            for path in mcp_server_paths:
                if os.path.exists(path):
                    mcp_server_path = path
                    break
            
            if not mcp_server_path:
                logger.warning(f"MCP server not found at any expected paths: {mcp_server_paths}")
                mcp_tools = []
            else:
                logger.info(f"Connecting to local MCP server at: {mcp_server_path}")
                max_attempts = 5
                for attempt in range(1, max_attempts + 1):
                    try:
                        logger.info(f"[Local MCP] Attempt {attempt}/{max_attempts}: Creating MCPClient")
                        mcp_client = MCPClient(
                            lambda: stdio_client(
                                StdioServerParameters(
                                    command="uv",
                                    args=["run", mcp_server_path]
                                )
                            )
                        )
                        
                        mcp_client.__enter__()
                        mcp_tools = mcp_client.list_tools_sync()
                        logger.info(f"[Local MCP] Loaded {len(mcp_tools)} tools from local MCP server")
                        break
                        
                    except Exception as e:
                        logger.error(f"[Local MCP] Attempt {attempt}/{max_attempts} failed: {e}")
                        try:
                            if 'mcp_client' in locals():
                                mcp_client.__exit__(None, None, None)
                        except:
                            pass
                        
                        if attempt < max_attempts:
                            delay = 20 if attempt == 1 else 10 if attempt == 2 else 5
                            print(f"\n⚠️ Failed to connect to local MCP server (attempt {attempt}/{max_attempts}): {e}")
                            print(f"   Retrying in {delay} seconds...")
                            time.sleep(delay)
                        else:
                            print(f"\n⚠️ All attempts to connect to local MCP server failed. Continuing with local tools only.")
                            mcp_tools = []
        
        else:
            # Try to connect to remote MCP server via AgentCore gateway
            mcp_config = get_mcp_config()
            if mcp_config:
                try:
                    logger.info("Connecting to remote MCP server via AgentCore gateway")
                    access_token = fetch_access_token(
                        mcp_config['client_id'], 
                        mcp_config['client_secret'], 
                        mcp_config['token_url']
                    )
                    mcp_client = MCPClient(lambda: create_streamable_http_transport(
                        mcp_config['gateway_url'], access_token
                    ))
                    
                    mcp_client.__enter__()
                    mcp_tools = get_full_tools_list(mcp_client)
                    logger.info(f"[Remote MCP] Loaded {len(mcp_tools)} tools from remote MCP server")
                        
                except Exception as e:
                    logger.error(f"Failed to connect to remote MCP server: {e}")
                    mcp_tools = []
            else:
                logger.info("No MCP configuration found, using local tools only")
                mcp_tools = []
        
        # Combine MCP tools with our custom layout tools
        custom_tools = [
            get_turbine_specs,
            create_grid_layout, 
            create_offset_grid_layout, 
            create_spiral_layout,
            create_greedy_layout, 
            explore_alternative_sites, 
            relocate_conflicting_turbines, 
            relocate_turbines_manually,
            save_layout,
            load_turbine_layout
        ]
        
        # Combine all tools
        tools = mcp_tools + custom_tools
        logger.info(f"Total tools available: {len(tools)}")

        # Create a BedrockModel with custom client config
        bedrock_model = BedrockModel(
            model_id=model_id,
            temperature=1,
            boto_client_config=boto3.session.Config(
                region_name=region_name,
                read_timeout=300,  # 5 minutes for reading responses
                connect_timeout=60,  # 1 minute for initial connection
                retries={
                    'max_attempts': 5,
                    'total_max_attempts': 10
                }
            ),
            additional_request_fields={
                "thinking": {
                    "type": "enabled",
                    "budget_tokens": 4096 # Minimum of 1,024
                }
            }
        )
        
        if os.getenv("DISABLE_CALLBACK_HANDLER"):
            # Create the Strands agent but disable the callback_handler
            agent = Agent(
                callback_handler=None,
                tools=tools,
                model=bedrock_model,
                system_prompt=system_prompt
            )
        
        # Create the Strands agent
        agent = Agent(
            tools=tools,
            model=bedrock_model,
            system_prompt=system_prompt
        )
        
        # Log available tools
        logger.info(f"Available tools: {agent.tool_names}")

        if __name__ == "__main__" or os.getenv("INTERACTIVE_MODE"):
            logger.info("Agent initialized successfully")
            return agent
        
        response = agent(query)
        return str(response)
    
    except Exception as e:
        logger.error(f"Error in layout agen: {e}")
        return f"Error in layout agent: {str(e)}"

@app.entrypoint
async def agent_invocation(payload):
    """
    Handler for agent invocation
    """

    global agent
    
    if agent is None:
        yield {"error": "Agent not initialized"}
        return
    
    user_message = payload.get("prompt", "No prompt found in input, please guide customer to create a json payload with prompt key")
    
    try:
        stream = agent.stream_async(user_message)
        async for event in stream:
            yield event
    except Exception as e:
        yield {"error": f"Error processing request: {str(e)}"}

if __name__ == "__main__":
    if os.getenv('INTERACTIVE_MODE'):
        try:
            # Initialize the agent
            logger.info("Starting Layout Agent")
            agent = layout_agent()

            print("\n👨‍💻 Layout Agent")
            print("I design optimal wind turbine layouts for renewable energy projects!")
            print("=" * 50)
            print("\n📋 Example questions you can ask:")
            print("• Create a 30MW wind farm at lat=35.067482, lon=-101.395466 using IEA_Reference_3.4MW_130 turbines with project_id '2a568686'")

            while True:
                try:
                    user_input = input("\n🎯 Your request (or 'quit' to exit): ")
                    if user_input.lower() in ['quit', 'exit', 'q']:
                        print("\n\n👋 Have a good day!")
                        break

                    if not user_input.strip():
                        print("Please enter a valid request.")
                        continue

                    print("\n🤖 Processing...\n")
                    
                    response = agent(user_input)
                    print(f"\nAgent: {response}\n")
                    
                except KeyboardInterrupt:
                    print("\n\n👋 Have a good day!")
                    break
                except Exception as e:
                    logger.error(f"Error processing user request: {e}")
                    print(f"\n❌ Sorry, an error occurred: {e}")
                    print("Please try again or type 'quit' to exit.\n")
                    
        except Exception as e:
            logger.critical(f"Critical error during layout agent startup: {e}")
            print(f"\n❌ Failed to start the application: {e}")
            print("Please check the logs for more details.")
    else:
        layout_agent()
        app.run()