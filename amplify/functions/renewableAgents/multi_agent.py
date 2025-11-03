import logging
import boto3
import os

# Strands SDK imports
try:
    from strands_agents import Agent
    from strands_agents.multiagent import GraphBuilder
except ImportError:
    # Fallback for local development
    from strands import Agent
    from strands.multiagent import GraphBuilder

# Dynamic import to handle both direct execution and notebook import
# Direct imports - Lambda environment has correct path setup
from terrain_agent import terrain_agent
from layout_agent import layout_agent
from simulation_agent import simulation_agent
from report_agent import report_agent

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)

logger = logging.getLogger('multi_agent')

# Suppress specific loggers to reduce noise
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('strands.tools.registry').setLevel(logging.ERROR)
logging.getLogger('strands.telemetry.metrics').setLevel(logging.ERROR)

def create_agent_graph():
    """Create the multi-agent graph with layout, simulation and reporting agents
    
    Args:
        region_name: AWS region for Bedrock
        model_id: Bedrock model ID to use
        
    Returns:
        The built graph ready for execution
    """
    logger.info("Creating agent graph...")
    terrain_agent_instance = terrain_agent()
    layout_agent_instance = layout_agent()
    simulation_agent_instance = simulation_agent()
    report_agent_instance = report_agent()

    logger.info("Building agent graph...")
    builder = GraphBuilder()

    # Add nodes (using the actual Strands Agent instances)
    builder.add_node(terrain_agent_instance, "terrain")
    builder.add_node(layout_agent_instance, "layout")
    builder.add_node(simulation_agent_instance, "simulation")
    builder.add_node(report_agent_instance, "reporting")

    # Add edges (dependencies)
    builder.add_edge("terrain", "layout")
    builder.add_edge("layout", "simulation")
    builder.add_edge("simulation", "reporting")

    # Set entry points
    builder.set_entry_point("terrain")

    # Build the graph
    graph = builder.build()

    # Store references to our custom agents to prevent them from being garbage collected
    graph._custom_agent_instances = {
        "terrain_agent": terrain_agent_instance,
        "layout_agent": layout_agent_instance,
        "simulation_agent": simulation_agent_instance,
        "report_agent": report_agent_instance
    }
    
    logger.info("Agent graph created successfully")
    return graph

if __name__ == "__main__":
    if os.getenv('INTERACTIVE_MODE'):
        try:
            # Initialize the agent
            logger.info("Starting Wind Farm Development Assistant")
            agent = create_agent_graph()

            print("\n👨‍💻 Wind Farm Development Assistant")
            print("I help with the creation of wind farms")
            print("=" * 50)
            print("\n📋 Example questions you can ask:")
            print("• Create a wind farm with approximately 30MW capacity within 3km of this point: longitude=-101.395466 and latitude=35.067482. Use the turbine IEA_Reference_3.4MW_130")

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
                    print(f"\nAssistant: {response}\n")
                    
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
        print(f"\n❌ The environmetal variable INTERACTIVE_MODE is not set. ")