#!/usr/bin/env python3
"""
Get AgentCore Runtime ARN for renewable energy integration
"""

import boto3
from boto3.session import Session

def get_runtime_arn():
    boto_session = Session()
    region = boto_session.region_name
    account_id = boto3.client('sts').get_caller_identity()['Account']
    
    # Use the correct client for AgentCore
    agentcore_client = boto3.client('bedrock-agentcore-control', region_name=region)
    
    print("\n🔍 Searching for AgentCore Runtimes...\n")
    
    try:
        # List all runtimes
        response = agentcore_client.list_agent_runtimes()
        
        runtimes = response.get('agentRuntimes', [])
        
        if not runtimes:
            print("❌ No AgentCore runtimes found!")
            print("\nYou need to run Cell 22 in the Jupyter notebook to create a runtime.")
            return None
        
        print("=" * 80)
        print(f"{'Name':<30} {'Status':<15} {'Runtime ID':<35}")
        print("=" * 80)
        
        ready_runtimes = []
        
        for runtime in runtimes:
            name = runtime.get('agentRuntimeName', 'N/A')
            runtime_id = runtime.get('agentRuntimeId', 'N/A')
            status = runtime.get('status', 'N/A')
            
            print(f"{name:<30} {status:<15} {runtime_id:<35}")
            
            if status == 'READY' and 'wind_farm' in name.lower():
                ready_runtimes.append({
                    'name': name,
                    'runtime_id': runtime_id,
                    'arn': f"arn:aws:bedrock-agentcore:{region}:{account_id}:agent-runtime/{runtime_id}"
                })
        
        print("=" * 80)
        
        if not ready_runtimes:
            print("\n⏳ No READY runtimes found yet.")
            print("\nWait for runtimes to finish creating, or run Cell 22 in the notebook.")
            return None
        
        # Prefer wind_farm_dev_agent
        selected = None
        for rt in ready_runtimes:
            if 'wind_farm_dev_agent' in rt['name'] and 'wind_farm_dev_agent_1' not in rt['name']:
                selected = rt
                break
        
        if not selected:
            selected = ready_runtimes[0]
        
        print(f"\n✅ Recommended Runtime: {selected['name']}")
        print(f"\n📋 Copy this ARN to your .env.local file:\n")
        print(f"NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT={selected['arn']}")
        print()
        
        return selected['arn']
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure you have:")
        print("1. AWS credentials configured")
        print("2. Proper permissions for bedrock-agentcore-control")
        print("3. Deployed at least one runtime via the Jupyter notebook")
        return None

if __name__ == "__main__":
    get_runtime_arn()
