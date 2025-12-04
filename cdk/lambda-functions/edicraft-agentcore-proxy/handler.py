"""
EDIcraft AgentCore Proxy Lambda
Invokes the EDIcraft Bedrock AgentCore agent using boto3
"""

import json
import os
import boto3

def handler(event, context):
    """
    Invoke the EDIcraft Bedrock AgentCore agent
    
    Expected event format:
    {
        "prompt": "user message",
        "sessionId": "optional-session-id"
    }
    """
    try:
        # Parse input - handle both direct invocation and API Gateway
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        prompt = body.get('prompt', body.get('message', ''))
        session_id = body.get('sessionId', body.get('session_id', f"session-{context.request_id}"))
        
        if not prompt:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing prompt or message'})
            }
        
        # Get agent configuration from environment
        agent_id = os.environ.get('BEDROCK_AGENT_ID', 'kl1b6iGNug')
        region = os.environ['AWS_REGION']  # Automatically set by Lambda runtime
        
        print(f"Invoking Bedrock AgentCore agent: {agent_id}")
        print(f"Prompt: {prompt[:100]}...")
        print(f"Session: {session_id}")
        
        # Use boto3 to invoke Bedrock AgentCore
        # The service name is 'bedrock-agent-runtime' but we're calling AgentCore endpoint
        client = boto3.client('bedrock-agent-runtime', region_name=region)
        
        # Build the runtime ARN for AgentCore
        account_id = context.invoked_function_arn.split(':')[4]
        runtime_arn = f"arn:aws:bedrock-agentcore:{region}:{account_id}:runtime/{agent_id}"
        
        # Invoke the agent
        # Note: This uses the bedrock-agent-runtime client but with AgentCore ARN
        response = client.invoke_agent(
            agentId=agent_id,
            agentAliasId='DEFAULT',
            sessionId=session_id,
            inputText=prompt
        )
        
        # Process the streaming response
        completion = ""
        for event in response.get('completion', []):
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    completion += chunk['bytes'].decode('utf-8')
        
        print(f"Response length: {len(completion)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'message': completion,
                'sessionId': session_id
            })
        }
        
    except Exception as e:
        print(f"Error invoking EDIcraft agent: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error but don't crash
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'message': f"Failed to invoke EDIcraft agent: {str(e)}"
            })
        }
