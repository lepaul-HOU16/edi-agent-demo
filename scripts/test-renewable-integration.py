#!/usr/bin/env python3
"""
Test the renewable energy integration end-to-end
"""

import boto3
import json

# Configuration
AGENT_ARN = "arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind_farm_layout_agent-7DnHlIBg3o"
REGION = "us-east-1"

def test_agentcore_invocation():
    """Test invoking the AgentCore runtime"""
    print("=" * 70)
    print("  Testing Renewable Energy Backend")
    print("=" * 70)
    print()
    
    # Create client
    client = boto3.client('bedrock-agentcore', region_name=REGION)
    print(f"✅ Created Bedrock AgentCore client for {REGION}")
    print(f"📍 Agent ARN: {AGENT_ARN}")
    print()
    
    # Test payload
    test_prompt = "Analyze terrain for wind farm at 35.067482, -101.395466"
    payload = {
        "prompt": test_prompt,
        "project_id": "test_integration_123"
    }
    
    print(f"🧪 Test prompt: {test_prompt}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        print("🚀 Invoking AgentCore runtime...")
        
        response = client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            payload=json.dumps(payload).encode('utf-8')
        )
        
        print("✅ Invocation successful!")
        print()
        print("📥 Response:")
        print(f"  Status Code: {response['ResponseMetadata']['HTTPStatusCode']}")
        
        # Parse response body
        if 'payload' in response:
            response_body = json.loads(response['payload'].read())
            print(f"  Response: {json.dumps(response_body, indent=2)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Invocation failed: {e}")
        print()
        print("💡 Troubleshooting:")
        print("  1. Verify the agent ARN is correct")
        print("  2. Check IAM permissions for bedrock-agentcore:InvokeAgentRuntime")
        print("  3. Verify the agent is deployed and active")
        print("  4. Check CloudWatch logs for runtime errors")
        return False

if __name__ == "__main__":
    success = test_agentcore_invocation()
    exit(0 if success else 1)
