# EDIcraft Python Lambda Proxy - DEPLOYED ✅

## Summary

Successfully implemented and deployed a Python Lambda proxy that enables the Node.js Chat Lambda to invoke the Bedrock AgentCore EDIcraft agent.

## Architecture

```
User → Frontend → API Gateway → Node.js Chat Lambda → Python Proxy Lambda → Bedrock AgentCore → EDIcraft Agent
```

## What Was Deployed

### 1. Python Proxy Lambda
- **Function**: `EnergyInsights-development-edicraft-agentcore-proxy`
- **Runtime**: Python 3.12
- **Handler**: `handler.handler`
- **Purpose**: Wraps boto3 calls to Bedrock AgentCore
- **Location**: `cdk/lambda-functions/edicraft-agentcore-proxy/handler.py`

### 2. Updated Node.js MCP Client
- **Location**: `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js`
- **Change**: Now invokes Python Lambda instead of trying HTTP API
- **Uses**: AWS Lambda SDK to invoke proxy

### 3. IAM Permissions
- ✅ Python Lambda has `bedrock-agent-runtime:InvokeAgent` permission
- ✅ Python Lambda has `bedrock-agentcore:InvokeAgent` permission
- ✅ Node.js Lambda can invoke Python Lambda
- ✅ Python Lambda ARN passed to Node.js via environment variable

## How It Works

1. **User sends message** to EDIcraft agent
2. **Node.js Lambda** receives request
3. **MCP Client** checks for `EDICRAFT_PROXY_LAMBDA_ARN` env var
4. **Invokes Python Lambda** with `{prompt, sessionId}`
5. **Python Lambda** uses boto3 to call Bedrock AgentCore
6. **Bedrock AgentCore** invokes the EDIcraft agent
7. **Response flows back** through the chain

## Environment Variables

### Node.js Chat Lambda
```
EDICRAFT_PROXY_LAMBDA_ARN=arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-edicraft-agentcore-proxy
```

### Python Proxy Lambda
```
BEDROCK_AGENT_ID=kl1b6iGNug
AWS_REGION=us-east-1 (automatic)
```

## Testing

Test on localhost:

```bash
npm run dev
```

Open `test-edicraft-http-api.html` and click "Test EDIcraft Agent". 

Expected behavior:
- Node.js Lambda invokes Python Lambda
- Python Lambda calls Bedrock AgentCore
- EDIcraft agent processes the message
- Response returns through the chain

## Files Modified

1. `cdk/lambda-functions/edicraft-agentcore-proxy/handler.py` - Python proxy implementation
2. `cdk/lambda-functions/edicraft-agentcore-proxy/requirements.txt` - Python dependencies
3. `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` - Updated to use proxy
4. `cdk/lib/main-stack.ts` - Added Python Lambda to CDK stack

## Deployment Output

```
✅ EnergyInsights-development.EDIcraftProxyFunctionArn = 
   arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-edicraft-agentcore-proxy
```

## Why This Approach

1. **No Node.js SDK** - AWS doesn't provide Node.js SDK for Bedrock AgentCore yet
2. **Python SDK exists** - boto3 has bedrock-agent-runtime client
3. **Clean separation** - Python handles AgentCore, Node.js handles everything else
4. **Maintainable** - When Node.js SDK arrives, we can remove the proxy
5. **Works now** - Immediate solution without waiting for AWS

## Next Steps

1. **Test on localhost** - Verify the full chain works
2. **Monitor CloudWatch logs** - Check both Lambda functions
3. **Test with real prompts** - "Build a wellbore trajectory"
4. **Future**: Remove proxy when Node.js SDK is available

## CloudWatch Logs

### Node.js Chat Lambda
```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow
```

### Python Proxy Lambda
```bash
aws logs tail /aws/lambda/EnergyInsights-development-edicraft-agentcore-proxy --follow
```

## Success Criteria

✅ Python Lambda deployed
✅ Node.js Lambda updated
✅ IAM permissions configured
✅ Environment variables set
✅ No deployment errors

**Ready to test!**
