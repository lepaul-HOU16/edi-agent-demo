#!/usr/bin/env python3
"""
Test Strands Agent locally
"""
import json
import os
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool
import boto3

# Simple tools for energy data analysis
@tool
def calculate_permeability(porosity: float, grain_size: float) -> str:
    """Calculate permeability from porosity and grain size"""
    # Simplified Kozeny-Carman equation
    permeability = (porosity**3 / (1-porosity)**2) * (grain_size**2) / 180
    return f"Estimated permeability: {permeability:.2e} mD"

@tool
def analyze_well_data(well_name: str) -> str:
    """Analyze well data from S3 storage"""
    return f"Analysis for {well_name}: Good production potential, recommend completion"

@tool
def create_plot(data_type: str, well_name: str) -> str:
    """Create visualization plots for well data"""
    return f"Created {data_type} plot for {well_name}. Plot saved to artifacts."

def test_strands_agent():
    try:
        print("🚀 Testing Strands Agent locally...")
        
        # Initialize Bedrock model (will use default credentials)
        session = boto3.Session()
        model = BedrockModel(
            model_id='us.anthropic.claude-3-haiku-20240307-v1:0',
            boto_session=session
        )
        
        # Create agent with energy-specific tools
        agent = Agent(
            model=model,
            tools=[calculate_permeability, analyze_well_data, create_plot],
            system_prompt="""You are an AI assistant specialized in energy data analysis, 
            particularly oil and gas exploration. You help with petrophysical analysis, 
            well data interpretation, and visualization of subsurface data."""
        )
        
        # Test messages
        test_messages = [
            "Hello, can you help me with energy data analysis?",
            "Calculate permeability for a well with 20% porosity and 0.1mm grain size",
            "Analyze well data for Well-A-123",
            "Create a density plot for Well-B-456"
        ]
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n📝 Test {i}: {message}")
            response = agent(message)
            print(f"🤖 Response: {response}")
            
        print("\n✅ Strands Agent test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Strands Agent test failed: {e}")
        return False

if __name__ == '__main__':
    success = test_strands_agent()
    exit(0 if success else 1)
