#!/usr/bin/env python3
"""
Test Strands Agent with MCP Well Data Server
"""
import asyncio
from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp.mcp_client import MCPClient
from strands.tools import tool
import boto3

@tool
def calculate_permeability(porosity: float, grain_size: float) -> str:
    """Calculate permeability from porosity and grain size"""
    permeability = (porosity**3 / (1-porosity)**2) * (grain_size**2) / 180
    return f"Estimated permeability: {permeability:.2e} mD"

async def test_strands_with_mcp():
    try:
        print("🚀 Testing Strands Agent with MCP Well Data Server...")
        
        # Initialize Bedrock model
        session = boto3.Session()
        model = BedrockModel(
            model_id='us.anthropic.claude-3-haiku-20240307-v1:0',
            boto_session=session
        )
        
        # Create MCP client for well data using subprocess transport
        mcp_client = MCPClient(
            lambda: ["python3", "/Users/cmgabri/edi-agent-demo/mcp-well-data-server.py"]
        )
        
        async with mcp_client:
            # Get MCP tools
            mcp_tools = await mcp_client.list_tools()
            print(f"📊 Available MCP tools: {[tool.name for tool in mcp_tools]}")
            
            # Create agent with both custom tools and MCP tools
            agent = Agent(
                model=model,
                tools=[calculate_permeability] + mcp_tools,
                system_prompt="""You are an AI assistant specialized in energy data analysis. 
                You have access to well log data through MCP tools and can perform petrophysical calculations."""
            )
            
            # Test messages
            test_messages = [
                "What wells are available in the database?",
                "Get information about SANDSTONE_RESERVOIR_001 well",
                "Calculate permeability for 25% porosity and 0.15mm grain size"
            ]
            
            for i, message in enumerate(test_messages, 1):
                print(f"\n📝 Test {i}: {message}")
                response = await agent.ainvoke(message)
                print(f"🤖 Response: {response}")
                
        print("\n✅ Strands Agent with MCP test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(test_strands_with_mcp())
    exit(0 if success else 1)
