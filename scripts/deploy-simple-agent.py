#!/usr/bin/env python3
"""
Deploy the simplified agent to AgentCore (without MCP dependencies)
"""

import os
import sys
from pathlib import Path

# Add workshop directory to path
WORKSHOP_DIR = Path(__file__).parent.parent / "agentic-ai-for-renewable-site-design-mainline" / "workshop-assets"
sys.path.insert(0, str(WORKSHOP_DIR))
os.chdir(WORKSHOP_DIR / "agent_core" / "03_host_agent_to_runtime")

print("=" * 70)
print("  Deploying Simplified Agent to AgentCore")
print("=" * 70)

from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session

boto_session = Session()
region = boto_session.region_name
account_id = boto_session.client("sts").get_caller_identity()["Account"]

print(f"\n📍 Region: {region}")
print(f"📍 Account: {account_id}")

# Get the IAM role ARN
runtime_role_arn = f"arn:aws:iam::{account_id}:role/agentcore-runtime-role"
print(f"📍 IAM Role: {runtime_role_arn}")

# Initialize AgentCore Runtime
agentcore_runtime = Runtime()
agent_name = "wind_farm_simple_agent"

print(f"\n🔧 Configuring agent: {agent_name}")

# Configure the agent
response = agentcore_runtime.configure(
    entrypoint="layout_agent_simple.py",
    execution_role=runtime_role_arn,
    auto_create_ecr=True,
    requirements_file="requirements_simple.txt",
    region=region,
    agent_name=agent_name
)

print("\n✅ Agent configured successfully")
print("\n🚀 Launching agent to AgentCore...")
print("   This will build and deploy the Docker image...")

# Launch the agent
try:
    launch_response = agentcore_runtime.launch()
    
    print("\n✅ Agent deployed successfully!")
    print("\n📦 Deployment Details:")
    print(f"   Agent Name: {agent_name}")
    
    # Try to get the agent ARN from the config
    config_file = Path(".bedrock_agentcore.yaml")
    if config_file.exists():
        import yaml
        with open(config_file) as f:
            config = yaml.safe_load(f)
            agent_arn = config.get('agents', {}).get(agent_name, {}).get('bedrock_agentcore', {}).get('agent_arn')
            if agent_arn:
                print(f"   Agent ARN: {agent_arn}")
                
                # Save to a file for easy access
                with open("agent_endpoint.txt", "w") as f:
                    f.write(f"AGENT_ARN={agent_arn}\n")
                    f.write(f"REGION={region}\n")
                print(f"\n💾 Endpoint saved to: agent_endpoint.txt")
    
    print("\n🧪 Test the agent with:")
    print("   python3 scripts/invoke-renewable-agent.py")
    
except Exception as e:
    print(f"\n❌ Deployment failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 70)
print("  Deployment Complete!")
print("=" * 70)
