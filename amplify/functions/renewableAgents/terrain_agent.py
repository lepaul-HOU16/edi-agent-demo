import logging
import os
import boto3
from botocore.exceptions import ClientError, BotoCoreError

# Import from strands_agents (not strands)
try:
    from strands_agents.models import BedrockModel
    from strands_agents import Agent
    from strands_agents import tool
except ImportError:
    # Fallback for local development
    from strands.models import BedrockModel
    from strands import Agent
    from strands import tool

# Dynamic import to handle both direct execution and notebook import
from tools.terrain_tools import get_unbuildable_areas

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger('terrain_agent')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('strands.tools.registry').setLevel(logging.ERROR)
logging.getLogger('strands.telemetry.metrics').setLevel(logging.ERROR)

# Global variables to store the initialized components
agent = None

system_prompt="""
You are a terrain analysis expert specializing in renewable energy site assessment. Your primary role is to identify and analyze unbuildable areas (exclusion zones) for wind and solar energy projects.

## CRITICAL REQUIREMENT - PROJECT ID:
**A project_id MUST be provided for every analysis request.**
- If no project_id is provided, immediately ask the user to provide one
- NEVER generate, create, or make up a project_id yourself
- The project_id must be explicitly provided by the user in their request
- Do not proceed with any analysis until a valid project_id is provided

## Core Capabilities:
- Analyze terrain features and geographic constraints at specified locations
- Identify exclusion zones including water bodies, buildings, infrastructure, and protected areas
- Apply customizable safety setbacks and buffer zones
- Generate detailed GeoJSON boundary data for mapping and visualization
- Provide actionable insights for renewable energy project planning

## Analysis Workflow:
1. **FIRST**: Verify that a project_id has been provided - if not, request it immediately
2. Determine unbuildable areas using the provided project_id
3. Apply appropriate setback distances based on project requirements
4. Automatically save results as GeoJSON boundaries and interactive map
5. Explain findings with breakdown by feature type (water, buildings, roads, etc.)
6. Provide practical recommendations for site development

## Key Focus Areas:
- Safety compliance and regulatory setbacks
- Environmental constraints and protected areas
- Infrastructure proximity and access considerations
- Terrain suitability for renewable energy installations
- Risk assessment and mitigation strategies

### MANDATORY: Response Footer:
```
🤖 Project ID: {project_id}
```

Always provide clear, actionable insights that help users make informed decisions about renewable energy project feasibility and site selection.
"""

@tool
def terrain_agent(region_name="us-west-2", model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0", query="No prompt found in input, please guide customer to create a json payload with prompt key", bedrock_client=None) -> str:
    """
    Initialize the terrain analysis agent
    
    Task 7.2: Accept optional bedrock_client parameter for connection pooling.
    If provided, use the pooled client instead of creating a new one.
    """
    try:
        logger.info(f"Initializing agent with region: {region_name}, model: {model_id}")

        global agent

        tools = [get_unbuildable_areas]

        # Task 7.2: Use pooled Bedrock client if provided, otherwise create new one
        if bedrock_client is not None:
            logger.info("♻️  Using pooled Bedrock client for terrain agent")
            # Create BedrockModel with existing client
            bedrock_model = BedrockModel(
                model_id=model_id,
                temperature=1,
                boto_client=bedrock_client  # Use pooled client
            )
        else:
            logger.info("🔌 Creating new Bedrock client for terrain agent")
            # Create a BedrockModel with custom client config (fallback for local testing)
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
                )
            )

        if os.getenv("DISABLE_CALLBACK_HANDLER"):
            # Create the Strands agent but disable the callback_handler
            agent = Agent(
                callback_handler=None,
                tools=tools,
                model=bedrock_model,
                system_prompt=system_prompt
            )

        agent = Agent(
            tools=tools,
            model=bedrock_model,
            system_prompt=system_prompt
        )

        if __name__ == "__main__" or os.getenv("INTERACTIVE_MODE"):
            logger.info("Agent initialized successfully")
            return agent
        
        response = agent(query)
        return str(response)
        
    except (ClientError, BotoCoreError) as e:
        logger.error(f"AWS/Bedrock error during agent initialization: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during agent initialization: {e}")
        raise

# Removed @app.entrypoint - not needed for Lambda deployment
# The terrain_agent function is called directly by lambda_handler.py

if __name__ == "__main__":
    if os.getenv('INTERACTIVE_MODE'):
        try:
            # Initialize the agent
            logger.info("Starting Terrain Analysis Agent")
            agent = terrain_agent()

            print("\n👨‍💻 Terrain Agent")
            print("I identify unbuildable areas and exclusion zones for renewable energy projects!")
            print("=" * 50)
            print("\n📋 Example questions you can ask:")
            print("• Analyze terrain at 35.067482, -101.395466 with 100m setback. use project_id '2a568686'")

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
        # For Lambda execution, just initialize the agent
        terrain_agent()