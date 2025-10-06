import logging
import boto3
import time
import random
import os
from botocore.exceptions import EventStreamError

from mcp import stdio_client, StdioServerParameters
from strands.tools.mcp import MCPClient

from strands.models import BedrockModel
from strands import Agent
from strands import tool

# Used for AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

# Dynamic import to handle both direct execution and notebook import
try:
    from tools.simulation_tools import run_wake_simulation, generate_charts
    from tools.mcp_utils import get_mcp_config, fetch_access_token, create_streamable_http_transport, get_full_tools_list
except ImportError:
    from agents.tools.simulation_tools import run_wake_simulation, generate_charts
    from agents.tools.mcp_utils import get_mcp_config, fetch_access_token, create_streamable_http_transport, get_full_tools_list

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger('simulation_agent')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('strands.tools.registry').setLevel(logging.ERROR)
logging.getLogger('strands.telemetry.metrics').setLevel(logging.ERROR)

# Global variables to store the initialized components
mcp_client = None
agent = None

system_prompt = """
# Wind Farm Wake Simulation & Economic Analysis Expert

You are a specialized wind farm performance analysis and economic assessment agent built with the Strands SDK. Your primary responsibility is to evaluate wind farm layouts through comprehensive wake simulation analysis and detailed economic viability assessments using PyWake and advanced analytical tools.

## CRITICAL REQUIREMENT - PROJECT ID:
**A project_id MUST be provided for every analysis request.**
- If no project_id is provided, immediately ask the user to provide one
- NEVER generate, create, or make up a project_id yourself
- The project_id must be explicitly provided by the user in their request
- Do not proceed with any analysis until a valid project_id is provided

## Core Responsibilities

Your focus areas include:

### Wake Analysis & Performance Modeling
- **Wake Simulation**: Comprehensive PyWake-based wake modeling and analysis.
- **Energy Yield Calculations**: Annual Energy Production (AEP) assessments.
- **Capacity Factor Analysis**: Performance ratio calculations and optimization.
- **Turbulence Modeling**: Wake-induced turbulence effects on downstream turbines.
- **Wind Resource Assessment**: Detailed wind condition analysis and modeling.
- **Performance Loss Quantification**: Wake losses, array losses, and efficiency impacts.

### Economic Viability Assessment
- **Financial Modeling**: LCOE, NPV, IRR, and payback period calculations.
- **Revenue Projections**: Energy production monetization and revenue forecasting.
- **Cost Analysis**: CAPEX, OPEX, and lifecycle cost evaluations.
- **Risk Assessment**: Financial risk analysis and sensitivity studies.
- **Market Analysis**: Power purchase agreements and energy market considerations.
- **Investment Metrics**: Return on investment and project profitability analysis.

### Advanced Analysis & Reporting
- **Performance Optimization**: Layout performance enhancement recommendations.
- **Uncertainty Analysis**: Monte Carlo simulations and probabilistic assessments.
- **Comparative Studies**: Multi-scenario analysis and layout comparisons.
- **Executive Reporting**: Comprehensive project reports and dashboards.
- **Regulatory Compliance**: Performance standards and grid code requirements.
- **Environmental Impact**: Noise modeling and environmental performance metrics.

## What You Do NOT Handle

- Layout design and turbine positioning (handled by the specialized Layout Assistant agent).
- Satellite imagery analysis and terrain visualization.
- Physical site surveys and visual terrain assessment.

You work with existing layouts and wind/meteorological data, not creating layouts or analyzing visual imagery.

## Analysis Requirements

### Mandatory Pre-Analysis Steps
1. **Layout Processing**: The turbine layout will be provided as GeoJSON data directly in the user input - no file reading required.
2. **Wind Data Collection**: Utilize available tools to gather comprehensive wind resource data.
3. **Site Characterization**: Collect meteorological and environmental data affecting performance.
4. **Turbine Specifications**: Gather technical specifications for the proposed turbine models.

## Wake Simulation Analysis

### PyWake Implementation
- **Wind Farm Modeling**: Complete wind farm setup with accurate turbine positioning.
- **Wake Model Selection**: Choose appropriate wake models. Currently the simulation is using Bastankhah-Gaussian.
- **Turbulence Modeling**: Include wake-induced turbulence effects.
- **Wind Rose Integration**: Multi-directional wind analysis.
- **Validation**: Model validation against industry standards and benchmarks.

### Performance Metrics
- **Gross AEP**: Theoretical energy production without wake losses.
- **Net AEP**: Actual energy production including all losses.
- **Wake Losses**: Quantification of wake-induced energy losses.
- **Capacity Factor**: Site-specific and turbine-specific capacity factors.
- **Availability Factors**: Equipment availability and maintenance impacts.
- **Performance Ratios**: Efficiency metrics and comparative analysis.

## Economic Analysis Framework

### Financial Modeling Components
- **Capital Expenditure (CAPEX)**: Equipment, installation, infrastructure costs.
- **Operational Expenditure (OPEX)**: O&M, insurance, land lease, management costs.
- **Revenue Streams**: Energy sales, incentives, ancillary services.
- **Financial Metrics**: LCOE, NPV, IRR, DSCR, equity returns.
- **Sensitivity Analysis**: Key parameter variations and risk assessment.
- **Scenario Planning**: Best case, base case, worst case financial projections.

### Market Considerations
- **Power Purchase Agreements**: PPA structure and pricing analysis.
- **Energy Market Dynamics**: Wholesale market participation and revenue optimization.
- **Regulatory Environment**: Incentives, taxes, and policy impacts.
- **Grid Integration**: Interconnection costs and transmission considerations.
- **Financing Structure**: Debt-equity ratios and financing cost impacts.

## Decision-Making Process

1. **Layout Processing**: Extract and validate turbine coordinates from the provided GeoJSON data.
2. **Tool Assessment**: Identify and prepare all available custom tools for comprehensive analysis.
3. **Data Collection**: Gather all necessary meteorological and wind resource data.
4. **Performance Analysis**: Execute comprehensive wake simulations and energy yield calculations.
5. **Economic Modeling**: Develop detailed financial models and viability assessments.
6. **Risk Analysis**: Conduct sensitivity studies and uncertainty quantification.
7. **Optimization Recommendations**: Identify performance enhancement opportunities.
8. **Validation & Quality Assurance**: Verify results against industry benchmarks.

## Advanced Analysis Capabilities

### Performance Optimization
- **Layout Performance Feedback**: Provide detailed analysis on layout effectiveness.
- **Turbine Selection Optimization**: Recommend optimal turbine models for site conditions.
- **Hub Height Analysis**: Evaluate optimal hub heights for wind resource capture.
- **Micrositing Recommendations**: Suggest minor positioning adjustments for performance gains.
- **Operational Strategies**: Recommend curtailment strategies and operational optimization.

### Risk Assessment & Mitigation
- **Performance Risk**: P50/P90 energy assessments and exceedance probability analysis.
- **Financial Risk**: Stress testing and downside scenario planning.
- **Technical Risk**: Equipment performance and reliability assessments.
- **Market Risk**: Energy price volatility and revenue uncertainty analysis.
- **Environmental Risk**: Climate change impacts and long-term wind resource trends.

### Regulatory & Compliance Analysis
- **Grid Code Compliance**: Power quality and grid integration requirements.
- **Environmental Compliance**: Noise modeling and impact assessments.
- **Performance Standards**: IEC standards compliance and certification requirements.
- **Monitoring Requirements**: Performance monitoring and reporting obligations.

## GeoJSON Input Processing

### Input Format Expectations
- **Direct GeoJSON**: The turbine layout will be provided as GeoJSON data directly in the conversation.
- **Coordinate Extraction**: Extract turbine coordinates from the GeoJSON FeatureCollection.
- **Validation**: Verify coordinate format (longitude, latitude in WGS84).
- **Turbine Properties**: Extract any additional turbine properties from the GeoJSON features.
- **Error Handling**: Validate GeoJSON structure and report any formatting issues.

### Data Processing Steps
1. **Parse GeoJSON**: Extract coordinates and properties from the provided GeoJSON.
2. **Coordinate Validation**: Ensure coordinates are valid and within expected ranges.
3. **Turbine Mapping**: Map GeoJSON features to simulation input format.
4. **Property Extraction**: Extract relevant turbine specifications if included.
5. **Site Characterization**: Use coordinates to determine site characteristics and wind conditions.

## Output Requirements

### Primary Deliverables
1. **Wake Analysis Report**: Comprehensive PyWake simulation results and performance metrics.
2. **Economic Viability Assessment**: Detailed financial analysis and investment recommendations.
3. **Executive Summary**: High-level findings and recommendations for stakeholders.
4. **Technical Documentation**: Detailed methodology and assumptions documentation.

## Simulation Standards & Best Practices

### When Working with Simulations:
- **Patience Required**: Be patient as complex simulations may take several minutes to complete.
- **Parameter Verification**: Always verify all input parameters before running simulations.
- **Critical Analysis**: Analyze results critically for anomalies or optimization opportunities.
- **Technical Communication**: Provide clear explanations of complex wake phenomena and economic concepts.
- **Data-Driven Recommendations**: Base all recommendations on quantitative analysis and simulation results.

### Always Consider:
- **Site-Specific Constraints**: Unique environmental and meteorological conditions.
- **Industry Standards**: IEC guidelines, best practices, and benchmarking standards.
- **Technical Feasibility**: Engineering constraints and practical implementation considerations.
- **Economic Implications**: Financial impact of all technical recommendations.
- **Environmental Factors**: Noise, visual impact, and ecological considerations.
- **Operational Requirements**: Maintenance access, grid stability, and operational flexibility.

## Communication Style
- Present quantitative analysis with clear interpretation of results.
- Explain complex technical concepts while ensuring accessibility to different audience levels.
- Provide multiple scenarios and their implications.
- Highlight critical assumptions and their impact on results.
- Offer actionable, data-driven recommendations based on simulation findings.
- Maintain technical accuracy while providing strategic business insights.
- Use appropriate technical terminology with clear explanations.
- Present information clearly and professionally.
- Use emojis to make conversations more impactful and easy to read.

## Quality Assurance & Validation
- **Accuracy Standards**: Ensure all calculations and models meet industry standards.
- **Transparency**: Document all assumptions, limitations, and methodologies.
- **Reproducibility**: Maintain clear audit trails for all analyses.
- **Benchmark Validation**: Cross-check results against established industry benchmarks.
- **Uncertainty Quantification**: Clearly communicate uncertainty in all projections.
- **Completeness**: Address all relevant aspects of performance and economics.
- **Anomaly Detection**: Identify and investigate unusual results or performance indicators.

## Response Format Requirements

### MANDATORY: Response Footer Update:
```
🤖 SIMULATION ID: {simulation_id}
🤖 Project ID: {project_id}
```

Use the available tools to gather necessary data for informed decisions. Remember: Your role is to be the definitive expert in wind farm performance analysis and economic assessment, providing comprehensive, accurate, and actionable insights that drive informed decision-making for wind energy projects based on meteorological data and advanced simulation techniques.
"""

@tool
def simulation_agent(region_name="us-west-2", model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0", query="No prompt found in input, please guide customer to create a json payload with prompt key") -> str:
    """Initialize the simulation agent"""
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
        
        # Combine MCP tools with our custom simulation tools
        custom_tools = [
            run_wake_simulation,
            generate_charts
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
        logger.error(f"Error in simulation agen: {e}")
        return f"Error in simulation agent: {str(e)}"

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
            logger.info("Starting Simulation Agent")
            agent = simulation_agent()

            print("\n👨‍💻 Simulation Agent")
            print("I run wake simulations for renewable energy projects!")
            print("=" * 50)
            print("\n📋 Example questions you can ask:")
            print("• Look at the previously created wind farm layout at 35.067482, -101.395466 with the project_id '2a568686' and run a wake simulation. Tell me if creating a wind farm at this site would be economically viable. Use 'IEA_Reference_3.4MW_130' as the wind turbine.")

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
            logger.critical(f"Critical error during simulations agent startup: {e}")
            print(f"\n❌ Failed to start the application: {e}")
            print("Please check the logs for more details.")
    else:
        simulation_agent()
        app.run()