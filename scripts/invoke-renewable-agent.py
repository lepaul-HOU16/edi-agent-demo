#!/usr/bin/env python3
"""
Invoke the deployed renewable energy agent
"""

import boto3
import json
import sys

# From the .bedrock_agentcore.yaml file
AGENT_ARN = "arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind_farm_simple_agent-HC1T72DR7q"
REGION = "us-east-1"

def invoke_agent(prompt):
    """Invoke the AgentCore runtime with a prompt"""
    
    print("=" * 70)
    print("  Invoking Renewable Energy Agent")
    print("=" * 70)
    print(f"\nAgent ARN: {AGENT_ARN}")
    print(f"Region: {REGION}")
    print(f"\nPrompt: {prompt}")
    
    # Create client
    client = boto3.client('bedrock-agentcore', region_name=REGION)
    
    # Prepare payload
    payload = {
        "prompt": prompt
    }
    
    try:
        print("\n🚀 Invoking agent...")
        
        response = client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            payload=json.dumps(payload),
            contentType='application/json',
            accept='application/json'
        )
        
        print("\n✅ Agent invoked successfully!")
        print("\n📦 Response:")
        print(json.dumps(response, indent=2, default=str))
        
        # Try to read the response body if it's a streaming response
        if 'response' in response:
            print("\n📄 Response body:")
            body = response['response'].read()
            response_text = body.decode('utf-8') if isinstance(body, bytes) else body
            print(response_text)
            
            # Parse the streaming events
            print("\n📝 Parsed Response:")
            for line in response_text.split('\n'):
                if line.strip():
                    print(f"  {line}")
        
        return response
        
    except Exception as e:
        print(f"\n❌ Error invoking agent: {e}")
        import traceback
        traceback.print_exc()
        
        # Check CloudWatch logs
        print("\n💡 Checking CloudWatch logs for errors...")
        check_cloudwatch_logs()
        
        return None

def check_cloudwatch_logs():
    """Check CloudWatch logs for the agent runtime"""
    
    logs_client = boto3.client('logs', region_name=REGION)
    
    # Try different log group patterns
    log_group_patterns = [
        '/aws/bedrock/agentcore',
        '/aws/bedrock-agentcore',
        f'/aws/bedrock/agentcore/{AGENT_ARN.split("/")[-1]}',
        '/aws/lambda',  # In case it's running as Lambda
    ]
    
    for pattern in log_group_patterns:
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=pattern
            )
            
            if response['logGroups']:
                print(f"\n✅ Found log group: {pattern}")
                
                for log_group in response['logGroups']:
                    log_group_name = log_group['logGroupName']
                    print(f"\n  📋 Log group: {log_group_name}")
                    
                    # Get recent log streams
                    streams_response = logs_client.describe_log_streams(
                        logGroupName=log_group_name,
                        orderBy='LastEventTime',
                        descending=True,
                        limit=3
                    )
                    
                    if streams_response['logStreams']:
                        for stream in streams_response['logStreams']:
                            stream_name = stream['logStreamName']
                            print(f"\n    📄 Stream: {stream_name}")
                            
                            # Get recent events
                            events_response = logs_client.get_log_events(
                                logGroupName=log_group_name,
                                logStreamName=stream_name,
                                limit=20,
                                startFromHead=False
                            )
                            
                            if events_response['events']:
                                print(f"      Recent log events:")
                                for event in events_response['events'][-10:]:
                                    message = event['message'].strip()
                                    print(f"        {message}")
                    else:
                        print("      No log streams found")
                        
        except Exception as e:
            # Silently continue to next pattern
            pass

if __name__ == "__main__":
    # Default test prompt
    default_prompt = "Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123"
    
    # Use command line argument if provided
    prompt = sys.argv[1] if len(sys.argv) > 1 else default_prompt
    
    # Invoke the agent
    result = invoke_agent(prompt)
    
    if result:
        print("\n" + "=" * 70)
        print("  ✅ SUCCESS!")
        print("=" * 70)
        print("\nThe agent is working! You can now:")
        print("1. Use this endpoint in the frontend integration")
        print("2. Save the endpoint URL to .env.local")
        print("3. Proceed with Tasks 2-10")
        
        print(f"\nEndpoint configuration:")
        print(f"  NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT={AGENT_ARN}")
        print(f"  NEXT_PUBLIC_RENEWABLE_REGION={REGION}")
    else:
        print("\n" + "=" * 70)
        print("  ❌ FAILED")
        print("=" * 70)
        print("\nThe agent invocation failed. Check the logs above for details.")
