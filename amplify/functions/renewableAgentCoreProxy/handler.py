"""
Renewable AgentCore Proxy Lambda
Bridges TypeScript/JavaScript to Python boto3 for AgentCore access
"""

import json
import boto3
import os
from botocore.config import Config

# Initialize AgentCore client
agentcore_client = boto3.client(
    'bedrock-agentcore',
    config=Config(
        read_timeout=900,
        connect_timeout=300
    )
)

def handler(event, context):
    """
    Lambda handler for AgentCore proxy
    
    Expected event structure:
    {
        "prompt": "User query",
        "sessionId": "optional-session-id",
        "agentRuntimeArn": "arn:aws:bedrock-agentcore:..."
    }
    """
    
    print(f"🌱 RenewableAgentCoreProxy: Received event")
    
    try:
        # Parse input
        if isinstance(event, str):
            event = json.loads(event)
        
        # Extract parameters
        prompt = event.get('prompt')
        session_id = event.get('sessionId', f'session-{context.aws_request_id}')
        agent_runtime_arn = event.get('agentRuntimeArn') or os.environ.get('AGENT_RUNTIME_ARN')
        
        if not prompt:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameter: prompt'})
            }
        
        if not agent_runtime_arn:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameter: agentRuntimeArn'})
            }
        
        print(f"🌱 Calling AgentCore with prompt: {prompt[:100]}...")
        print(f"🌱 Runtime ARN: {agent_runtime_arn}")
        
        # Call AgentCore
        boto3_response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=agent_runtime_arn,
            qualifier="DEFAULT",
            payload=json.dumps({"prompt": prompt})
        )
        
        # Process streaming response
        full_response = ""
        artifacts = []
        thought_steps = []
        
        if "text/event-stream" in boto3_response.get("contentType", ""):
            streaming_body = boto3_response["response"]
            
            for line in streaming_body.iter_lines(chunk_size=2024):
                if line:
                    line_decoded = line.decode("utf-8")
                    if line_decoded.startswith("data: "):
                        line_json = line_decoded[6:]
                        try:
                            # Handle string-wrapped JSON
                            if line_json.startswith('"{'): 
                                line_json = line_json.strip('"').replace("'", '"')
                            
                            data = json.loads(line_json)
                            
                            # Extract text content
                            if 'event' in data and 'contentBlockDelta' in data['event']:
                                delta = data['event']['contentBlockDelta']['delta']
                                
                                if 'text' in delta:
                                    full_response += delta['text']
                                elif 'reasoningContent' in delta and 'text' in delta['reasoningContent']:
                                    # Add reasoning as thought step
                                    thought_steps.append({
                                        'id': f'reasoning-{len(thought_steps)}',
                                        'type': 'execution',
                                        'timestamp': context.get_remaining_time_in_millis(),
                                        'title': 'Agent Reasoning',
                                        'summary': delta['reasoningContent']['text'],
                                        'status': 'complete'
                                    })
                            
                            # Extract tool use
                            if 'event' in data and 'contentBlockStart' in data['event']:
                                if 'toolUse' in data['event']['contentBlockStart']['start']:
                                    tool_info = data['event']['contentBlockStart']['start']['toolUse']
                                    thought_steps.append({
                                        'id': f'tool-{len(thought_steps)}',
                                        'type': 'tool_selection',
                                        'timestamp': context.get_remaining_time_in_millis(),
                                        'title': f'Using Tool: {tool_info["name"]}',
                                        'summary': f'Tool input: {json.dumps(tool_info.get("input", {}))}',
                                        'status': 'complete'
                                    })
                        
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            print(f"⚠️ Error processing line: {e}")
                            continue
        
        print(f"✅ AgentCore response received: {len(full_response)} chars")
        
        # Return response in EDI Platform format
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': full_response or 'Analysis completed successfully.',
                'artifacts': artifacts,
                'thoughtSteps': thought_steps,
                'projectId': session_id,
                'status': 'success'
            })
        }
    
    except Exception as e:
        print(f"❌ Error in AgentCore proxy: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to invoke AgentCore runtime'
            })
        }
