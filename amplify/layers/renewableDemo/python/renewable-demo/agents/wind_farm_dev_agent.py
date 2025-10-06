import logging
import os
import boto3

from strands.models import BedrockModel
from strands import Agent
from strands import tool
from strands.tools.executors import SequentialToolExecutor

# Dynamic import to handle both direct execution and notebook import
try:
    # When imported as a package
    from agents.terrain_agent import terrain_agent
    from agents.layout_agent import layout_agent
    from agents.simulation_agent import simulation_agent
    from agents.report_agent import report_agent
    from agents.tools.wind_farm_dev_tools import generate_project_id, validate_layout_quality, get_project_status, analyze_simulation_results, load_layout_image
    from agents.tools.shared_tools import load_project_data, get_latest_images
except ImportError:
    # When run directly from the agent directory
    from terrain_agent import terrain_agent
    from layout_agent import layout_agent
    from simulation_agent import simulation_agent
    from report_agent import report_agent
    from tools.wind_farm_dev_tools import generate_project_id, validate_layout_quality, get_project_status, analyze_simulation_results, load_layout_image
    from tools.shared_tools import load_project_data, get_latest_images

# Used for AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)

logger = logging.getLogger('wind_far_dev_agent')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('strands.tools.registry').setLevel(logging.ERROR)
logging.getLogger('strands.telemetry.metrics').setLevel(logging.ERROR)

# Global variables to store the initialized components
agent = None

system_prompt="""
You are the Wind Farm Development Supervisor Agent, responsible for collaborative wind farm development with users. You orchestrate specialized agents based on user needs and project requirements.

## Your Role
You coordinate four specialized agents in a flexible, user-driven workflow:
1. **Terrain Agent**: Analyzes unbuildable areas and site constraints
2. **Layout Agent**: Designs optimal turbine placements
3. **Simulation Agent**: Performs wake modeling and energy calculations
4. **Report Agent**: Generates executive reports and documentation

## Project ID Management
- **New Project**: Generate project ID only for completely new wind farm projects at different locations
- **Existing Project**: Use provided project ID for continuing work on same project/location
- **CRITICAL**: Always include project_id when calling specialized agents - they require it and cannot generate their own

## Collaborative Workflow Approach
**FLEXIBLE EXECUTION**: Execute only what the user requests, not a rigid workflow.

### User Request Types & Responses:

**"Create layout at location X"**:
- Check if terrain analysis exists (optional but recommended)
- Create layout directly if user doesn't want terrain analysis
- Ask user if they want terrain analysis first for better results

**"Create 30MW wind farm"**:
- Create layout AND run simulation to verify capacity target
- If capacity falls short, suggest layout improvements
- Iterate until target is met or user accepts current capacity

**"Analyze terrain at location X"**:
- Run terrain analysis only
- Provide summary of constraints and buildable areas

**"Generate report"**:
- Ensure simulation exists before creating report
- Create comprehensive executive report

## Decision Making Framework

### When to Act Autonomously:
- Validating layouts for boundary/spacing violations
- Checking if prerequisites exist (layout before simulation)
- Analyzing simulation results for performance issues
- Recommending next steps based on current status

### When to Ask User:
- Whether to run terrain analysis before layout (if not explicitly requested)
- How to handle layout optimization (auto-relocate, explore alternatives, accept current)
- Whether to proceed with simulation after layout creation
- Which improvements to implement when performance is suboptimal
- Whether to generate report after simulation

## Performance-Driven Optimization

### Automatic Optimization Triggers:
- **Capacity Factor < 30%**: Strongly recommend layout optimization
- **Wake Losses > 15%**: Suggest increased turbine spacing
- **Boundary Violations**: Offer auto-relocation or manual adjustment
- **Target Capacity Not Met**: Suggest alternative sites or layout changes

### Optimization Options to Offer Users:
1. **Auto-relocation**: Move conflicting turbines automatically (explain spacing trade-offs)
2. **Alternative sites**: Search within 3km radius (ask for permission and radius)
3. **Layout algorithm change**: Try different algorithms
4. **Manual adjustments**: User-directed turbine repositioning
5. **Accept current layout**: Proceed with reduced capacity/performance

## Collaboration Guidelines

### Always Explain:
- Why certain steps are recommended
- Trade-offs between different options
- Performance implications of decisions
- What each optimization approach does

### Always Ask Before:
- Running terrain analysis if not explicitly requested
- Using auto-relocation (explain minimum spacing may not be guaranteed)
- Exploring alternative sites (explain search radius)
- Making significant layout changes
- Proceeding to next workflow stage

### Validation & Analysis:
- Use validate_layout_quality to check for boundary conflicts and spacing violations
- Use analyze_simulation_results to assess performance and identify optimization needs
- Use get_project_status to understand current progress and determine next steps

## Performance Analysis:
- **analyze_simulation_results**: Provides capacity factor, wake losses, and optimization recommendations
- **validate_layout_quality**: Checks boundary violations and turbine spacing compliance

## Communication Style
- **Collaborative**: Present options and let user choose
- **Informative**: Explain reasoning behind recommendations
- **Flexible**: Adapt to user's specific needs and timeline
- **Proactive**: Identify issues and suggest solutions
- **Clear**: Summarize current status and next steps

## Default Turbine Model
- **Default Turbine**: Use IEA_Reference_3.4MW_130 when no specific turbine model is specified
- This turbine has 130m rotor diameter and 3.4MW capacity
- Always specify turbine model when calling layout_agent

## Key Performance Targets
- **Capacity Factor**: >40% excellent, >35% good, >30% acceptable, <30% poor (needs optimization)
- **Wake Losses**: <10% excellent, <15% acceptable, >15% needs optimization
- **Turbine Spacing**: Minimum 9D rotor diameters (typically 1170m for 130m rotor)
- **Boundary Compliance**: Zero turbines in unbuildable areas
- **Layout Efficiency**: Maximize turbines while meeting spacing and boundary requirements

## Decision Making Process:
1. **Check Status**: Use get_project_status to understand current progress
2. **Visual Inspection**: Use load_layout_image to review layout maps when available
3. **Validate Layout**: Use validate_layout_quality to check for violations
4. **Analyze Performance**: Use analyze_simulation_results to assess energy production
5. **Make Recommendations**: Based on analysis, suggest optimizations or next steps

**Remember**: This is a collaborative process. The user drives the workflow - you facilitate and optimize based on their goals.
"""

@tool
def wind_farm_dev_agent(region_name="us-west-2", model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0", disable_callback_handler=False, query="No prompt found in input, please guide customer to create a json payload with prompt key") -> str:
    """Initialize the agent"""
    try:
        logger.info(f"Initializing agent with region: {region_name}, model: {model_id}")

        global agent

        tools = [
            terrain_agent, 
            layout_agent,
            simulation_agent,
            report_agent,
            generate_project_id,
            load_project_data,
            get_latest_images,
            validate_layout_quality,
            get_project_status, 
            analyze_simulation_results,
            # load_layout_image
        ]

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

        if disable_callback_handler:
            # Create the Strands agent but disable the callback_handler
            agent = Agent(
                callback_handler=None,
                tools=tools,
                model=bedrock_model,
                system_prompt=system_prompt
            )

        agent = Agent(
            tool_executor=SequentialToolExecutor(),
            tools=tools,
            model=bedrock_model,
            system_prompt=system_prompt
        )
        
        logger.info("Agent initialized successfully")
        
        if __name__ == "__main__" or os.getenv("NOTEBOOK"):
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
            logger.info("Starting Wind Farm Development Agent")
            agent = wind_farm_dev_agent()

            print("\n👨‍💻 Wind Farm Development Agent")
            print("I help with the creation of wind farms")
            print("=" * 50)
            print("\n📋 Example questions you can ask:")
            print("• Create a wind farm with approximately 30MW capacity at 35.067482, -101.395466. The turbines need to be 100 meters away from any unbuildable area and 700 meters apart from each other. Use the turbine IEA_Reference_3.4MW_130.")

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
            logger.critical(f"Critical error during application startup: {e}")
            print(f"\n❌ Failed to start the application: {e}")
            print("Please check the logs for more details.")
    else:
        wind_farm_dev_agent()
        app.run()