# AgentCore Solution for Petrophysics Calculations

## Problem Solved

**Bedrock AgentCore** is the perfect solution for connecting the TypeScript agent (running in Lambda) to Python calculation tools (MCP server logic).

## Architecture

```
User Query
  ↓
Chat Interface (Browser)
  ↓
AWS Lambda (enhancedStrandsAgent - TypeScript)
  ↓
Bedrock AgentCore (Action Groups)
  ↓
Python Lambda (petrophysics calculations)
  ↓
S3 (well data)
  ↓
Response with real calculations
```

## Why AgentCore?

1. **Language Bridge**: Connects TypeScript agents to Python tools
2. **AWS Native**: Fully integrated with Lambda, S3, and Bedrock
3. **Tool Registry**: Manages tool definitions and routing
4. **Already Installed**: You have `@aws-sdk/client-bedrock-agentcore` in package.json
5. **Proven Pattern**: Already used for renewable energy features

## Implementation Steps

### Step 1: Create Python Lambda with Calculations

```python
# amplify/functions/petrophysicsCalculator/handler.py
import json
import boto3
from petrophysics_calculators import PorosityCalculator

s3_client = boto3.client('s3')
porosity_calc = PorosityCalculator()

def handler(event, context):
    """
    AgentCore action handler for petrophysics calculations
    """
    action = event.get('actionGroup')
    api_path = event.get('apiPath')
    parameters = event.get('parameters', [])
    
    # Convert parameters to dict
    params = {p['name']: p['value'] for p in parameters}
    
    if api_path == '/calculate_porosity':
        return calculate_porosity(params)
    elif api_path == '/list_wells':
        return list_wells(params)
    elif api_path == '/get_well_info':
        return get_well_info(params)
    
    return {
        'statusCode': 400,
        'body': json.dumps({'error': 'Unknown action'})
    }

def calculate_porosity(params):
    well_name = params.get('wellName')
    method = params.get('method', 'density')
    
    # Load data from S3
    # Run calculations
    # Return results
    
    result = {
        'well_name': well_name,
        'method': method,
        'statistics': {
            'mean': 0.11,
            'std_dev': 0.09,
            'min': 0.0,
            'max': 0.636
        },
        'curve_data': {
            'DEPT': [...],
            'POROSITY': [...],
            'RHOB': [...],
            'GR': [...]
        }
    }
    
    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
```

### Step 2: Define AgentCore Action Group

```typescript
// amplify/functions/petrophysicsCalculator/resource.ts
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

export const petrophysicsCalculator = defineFunction((scope) => {
  return new lambda.Function(scope, 'PetrophysicsCalculator', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(300),
    memorySize: 1024,
    environment: {
      S3_BUCKET: process.env.S3_BUCKET || '',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1'
    }
  });
});
```

### Step 3: Register with AgentCore

```typescript
// amplify/backend.ts
import { BedrockAgentCoreClient, CreateActionGroupCommand } from '@aws-sdk/client-bedrock-agentcore';

const agentcoreClient = new BedrockAgentCoreClient({ region: 'us-east-1' });

// Register petrophysics action group
const actionGroup = await agentcoreClient.send(new CreateActionGroupCommand({
  agentId: process.env.AGENT_ID,
  actionGroupName: 'petrophysics-calculations',
  actionGroupExecutor: {
    lambda: backend.petrophysicsCalculator.resources.lambda.functionArn
  },
  apiSchema: {
    payload: JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'Petrophysics API',
        version: '1.0.0'
      },
      paths: {
        '/calculate_porosity': {
          post: {
            description: 'Calculate porosity for a well',
            parameters: [
              { name: 'wellName', in: 'query', required: true, schema: { type: 'string' } },
              { name: 'method', in: 'query', required: false, schema: { type: 'string' } }
            ]
          }
        },
        '/list_wells': {
          get: {
            description: 'List all available wells'
          }
        }
      }
    })
  }
}));
```

### Step 4: Update TypeScript Agent to Use AgentCore

```typescript
// amplify/functions/agents/enhancedStrandsAgent.ts
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

private agentcoreClient = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

private async callMCPTool(toolName: string, parameters: any): Promise<any> {
  console.log('🔧 Calling AgentCore tool:', toolName);
  
  // Map tool names to AgentCore actions
  const actionMap: Record<string, string> = {
    'list_wells': '/list_wells',
    'get_well_info': '/get_well_info',
    'calculate_porosity': '/calculate_porosity',
    'calculate_shale_volume': '/calculate_shale_volume',
    'calculate_saturation': '/calculate_saturation'
  };
  
  const apiPath = actionMap[toolName];
  if (!apiPath) {
    return { success: false, message: `Unknown tool: ${toolName}` };
  }
  
  try {
    const response = await this.agentcoreClient.send(new InvokeAgentCommand({
      agentId: process.env.AGENTCORE_AGENT_ID,
      agentAliasId: process.env.AGENTCORE_ALIAS_ID,
      sessionId: this.sessionId,
      inputText: JSON.stringify({
        action: 'petrophysics-calculations',
        apiPath,
        parameters
      })
    }));
    
    // Parse AgentCore response
    const result = JSON.parse(response.completion);
    return {
      success: true,
      ...result
    };
    
  } catch (error) {
    console.error('❌ AgentCore call failed:', error);
    return {
      success: false,
      message: `AgentCore error: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
}
```

## Benefits of This Approach

✅ **Reuses Existing Python Code**: Copy calculation logic from `scripts/mcp-well-data-server.py`
✅ **AWS Native**: No external services or custom infrastructure
✅ **Scalable**: Lambda auto-scales with demand
✅ **Type Safe**: AgentCore handles parameter validation
✅ **Proven Pattern**: Already working for renewable energy features
✅ **Easy Testing**: Can test Python Lambda independently

## Comparison with Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **AgentCore** (Recommended) | AWS native, proven pattern, reuses Python | Requires AgentCore setup |
| Python Lambda | Simple, direct | Need Lambda-to-Lambda calls |
| TypeScript Rewrite | Single language | Complex calculations, maintenance |
| HTTP MCP Bridge | Flexible | Complex, latency, hosting |

## Next Steps

1. ✅ Copy Python calculation code to Lambda function
2. ✅ Define AgentCore action group schema
3. ✅ Register action group with AgentCore
4. ✅ Update TypeScript agent to call AgentCore
5. ✅ Test end-to-end flow
6. ✅ Deploy and verify

## Estimated Effort

- Python Lambda setup: 20 minutes
- AgentCore registration: 15 minutes
- TypeScript integration: 15 minutes
- Testing: 15 minutes
- **Total: ~1 hour**

## References

- [Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Action Groups Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-action-groups.html)
- Existing implementation: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/`
