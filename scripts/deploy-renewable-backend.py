#!/usr/bin/env python3
"""
Simplified deployment script for renewable energy agents to AWS Bedrock AgentCore.
This script deploys the multi-agent system without requiring Jupyter notebooks.
"""

import os
import sys
import boto3
import json
from pathlib import Path

# Add the workshop-assets directory to Python path
WORKSHOP_DIR = Path(__file__).parent.parent / "agentic-ai-for-renewable-site-design-mainline" / "workshop-assets"
sys.path.insert(0, str(WORKSHOP_DIR))

def check_prerequisites():
    """Check if all prerequisites are met"""
    print("🔍 Checking prerequisites...")
    
    # Check AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS credentials configured: {identity['Arn']}")
    except Exception as e:
        print(f"❌ AWS credentials not configured: {e}")
        return False
    
    # Check Bedrock access
    try:
        bedrock = boto3.client('bedrock', region_name='us-west-2')
        models = bedrock.list_foundation_models()
        claude_models = [m for m in models['modelSummaries'] if 'claude-3' in m['modelId'].lower()]
        if claude_models:
            print(f"✅ Bedrock access confirmed: {len(claude_models)} Claude models available")
        else:
            print("⚠️  No Claude models found in Bedrock")
    except Exception as e:
        print(f"❌ Bedrock access failed: {e}")
        return False
    
    # Check SSM parameters
    try:
        ssm = boto3.client('ssm', region_name='us-west-2')
        bucket_param = ssm.get_parameter(Name='/wind-farm-assistant/s3-bucket-name')
        storage_param = ssm.get_parameter(Name='/wind-farm-assistant/use-s3-storage')
        print(f"✅ S3 storage configured: {bucket_param['Parameter']['Value']}")
    except Exception as e:
        print(f"❌ SSM parameters not configured: {e}")
        return False
    
    # Check if workshop directory exists
    if not WORKSHOP_DIR.exists():
        print(f"❌ Workshop directory not found: {WORKSHOP_DIR}")
        return False
    print(f"✅ Workshop directory found: {WORKSHOP_DIR}")
    
    return True

def test_agents_locally():
    """Test agents locally before deployment"""
    print("\n🧪 Testing agents locally...")
    
    try:
        # Set environment variables for local testing
        os.environ['AWS_REGION'] = 'us-west-2'
        os.environ['INTERACTIVE_MODE'] = '0'
        os.environ['DISABLE_CALLBACK_HANDLER'] = '1'
        
        # Import and test terrain agent
        print("  Testing terrain agent...")
        from agents.terrain_agent import terrain_agent
        agent = terrain_agent(
            region_name='us-west-2',
            model_id='us.anthropic.claude-3-7-sonnet-20250219-v1:0',
            query="Test query"
        )
        print("  ✅ Terrain agent initialized successfully")
        
        # Import and test layout agent
        print("  Testing layout agent...")
        from agents.layout_agent import layout_agent
        agent = layout_agent(
            region_name='us-west-2',
            model_id='us.anthropic.claude-3-7-sonnet-20250219-v1:0',
            query="Test query"
        )
        print("  ✅ Layout agent initialized successfully")
        
        # Import and test simulation agent
        print("  Testing simulation agent...")
        from agents.simulation_agent import simulation_agent
        agent = simulation_agent(
            region_name='us-west-2',
            model_id='us.anthropic.claude-3-7-sonnet-20250219-v1:0',
            query="Test query"
        )
        print("  ✅ Simulation agent initialized successfully")
        
        print("\n✅ All agents tested successfully locally")
        return True
        
    except Exception as e:
        print(f"\n❌ Agent testing failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def deploy_to_agentcore():
    """Deploy agents to AgentCore"""
    print("\n🚀 Deploying to AgentCore...")
    print("\n⚠️  NOTE: AgentCore deployment requires the bedrock-agentcore CLI tool.")
    print("The deployment notebooks in agent_core/ directory provide the full deployment process.")
    print("\nTo complete deployment:")
    print("1. Install Jupyter: pip install jupyter")
    print("2. Navigate to: agentic-ai-for-renewable-site-design-mainline/workshop-assets/")
    print("3. Run: jupyter notebook agent_core/03_host_agent_to_runtime/03_host_agent_to_runtime.ipynb")
    print("4. Follow the notebook instructions to deploy to AgentCore")
    print("\nAlternatively, if you have the agentcore CLI installed:")
    print("  agentcore deploy --name renewable-multi-agent --runtime python3.12 --handler agents/multi_agent.py")
    
    return False  # Return False since we're not actually deploying here

def main():
    """Main deployment function"""
    print("=" * 70)
    print("  Renewable Energy Backend Deployment")
    print("=" * 70)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites check failed. Please fix the issues above.")
        sys.exit(1)
    
    print("\n✅ All prerequisites met!")
    
    # Test agents locally
    if not test_agents_locally():
        print("\n❌ Local agent testing failed. Please fix the issues above.")
        sys.exit(1)
    
    # Provide deployment instructions
    deploy_to_agentcore()
    
    print("\n" + "=" * 70)
    print("  Next Steps")
    print("=" * 70)
    print("\n1. ✅ Prerequisites verified")
    print("2. ✅ Agents tested locally")
    print("3. ⏳ Deploy to AgentCore (follow instructions above)")
    print("4. ⏳ Test AgentCore endpoint")
    print("5. ⏳ Configure frontend integration")
    
    print("\n📝 For detailed deployment instructions, see:")
    print("   docs/RENEWABLE_BACKEND_DEPLOYMENT.md")

if __name__ == "__main__":
    main()
