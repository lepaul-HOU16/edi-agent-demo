# Adding New Agents - Step-by-Step Guide

This guide walks you through adding a new agent to the platform.

## Overview

Adding a new agent involves:
1. Creating the agent class
2. Registering with the agent router
3. (Optional) Creating a tool Lambda
4. (Optional) Creating frontend components
5. Deploying and testing

## Step 1: Create Agent Class

Create a new file in `cdk/lambda-functions/chat/agents/`:

```typescript
// cdk/lambda-functions/chat/agents/myNewAgent.ts
import { BaseEnhancedAgent } from './BaseEnhancedAgent';

export class MyNewAgent extends BaseEnhancedAgent {
  constructor() {
    super(true); // Enable verbose logging
  }

  async processMessage(message: string): Promise<any> {
    const thoughtSteps = [];
    
    // Step 1: Intent detection
    thoughtSteps.push({
      id: `step_${Date.now()}`,
      type: 'intent_detection',
      timestamp: Date.now(),
      title: 'Analyzing Request',
      summary: 'Understanding user intent',
      status: 'in_progress',
    });
    
    // Your logic here
    const result = await this.performAnalysis(message);
    
    thoughtSteps[0].status = 'complete';
    
    return {
      success: true,
      message: result.message,
      artifacts: result.artifacts || [],
      thoughtSteps,
    };
  }
  
  private async performAnalysis(message: string) {
    // Implement your agent logic
    return {
      message: 'Analysis complete',
      artifacts: [],
    };
  }
}
```

## Step 2: Register with Agent Router

Update `cdk/lambda-functions/chat/agents/agentRouter.ts`:

```typescript
import { MyNewAgent } from './myNewAgent';

export class AgentRouter {
  private myNewAgent: MyNewAgent;
  
  constructor() {
    // ... existing agents
    this.myNewAgent = new MyNewAgent();
  }
  
  private determineAgentType(message: string): AgentType {
    // Add your patterns
    if (/my.*pattern/i.test(message)) {
      return 'my_new_agent';
    }
    
    // ... existing patterns
  }
  
  async routeQuery(message: string, context?: any) {
    const agentType = this.determineAgentType(message);
    
    switch (agentType) {
      case 'my_new_agent':
        return await this.myNewAgent.processMessage(message);
      // ... existing cases
    }
  }
}
```

## Step 3: Create Tool Lambda (Optional)

If your agent needs specialized processing, create a tool Lambda:

### TypeScript Tool

```typescript
// cdk/lambda-functions/tools/my-tool/handler.ts
export const handler = async (event: any) => {
  const params = JSON.parse(event.body);
  
  // Your tool logic
  const result = await processData(params);
  
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
```

### Python Tool

```python
# cdk/lambda-functions/tools/my-tool/handler.py
import json

def handler(event, context):
    params = json.loads(event['body'])
    
    # Your tool logic
    result = process_data(params)
    
    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
```

### Register Tool in CDK

Update `cdk/lib/main-stack.ts`:

```typescript
const myToolFunction = new lambda.Function(this, 'MyToolFunction', {
  functionName: `${env}-my-tool`,
  runtime: lambda.Runtime.NODEJS_20_X, // or PYTHON_3_12
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(
    path.join(__dirname, '../lambda-functions/tools/my-tool')
  ),
  timeout: cdk.Duration.seconds(60),
  memorySize: 512,
  environment: {
    STORAGE_BUCKET: this.storageBucket.bucketName,
  },
});

// Grant permissions
this.storageBucket.grantReadWrite(myToolFunction);
myToolFunction.grantInvoke(this.chatFunction);

// Add environment variable to chat function
this.chatFunction.addEnvironment(
  'MY_TOOL_FUNCTION_NAME',
  myToolFunction.functionName
);
```

## Step 4: Invoke Tool from Agent

Update your agent to call the tool:

```typescript
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export class MyNewAgent extends BaseEnhancedAgent {
  private lambdaClient = new LambdaClient({});
  
  private async invokeTool(params: any) {
    const command = new InvokeCommand({
      FunctionName: process.env.MY_TOOL_FUNCTION_NAME,
      Payload: JSON.stringify(params),
    });
    
    const response = await this.lambdaClient.send(command);
    const result = JSON.parse(
      new TextDecoder().decode(response.Payload)
    );
    
    return JSON.parse(result.body);
  }
}
```

## Step 5: Create Frontend Components (Optional)

If your agent generates artifacts, create React components to render them:

```typescript
// frontend/src/components/artifacts/MyArtifact.tsx
import React from 'react';

interface MyArtifactProps {
  artifact: {
    type: string;
    data: any;
  };
}

export const MyArtifact: React.FC<MyArtifactProps> = ({ artifact }) => {
  return (
    <div className="my-artifact">
      <h3>{artifact.data.title}</h3>
      {/* Render your artifact */}
    </div>
  );
};
```

Register in `ChatMessage.tsx`:

```typescript
import { MyArtifact } from './artifacts/MyArtifact';

const renderArtifact = (artifact: any) => {
  switch (artifact.type) {
    case 'my_artifact_type':
      return <MyArtifact artifact={artifact} />;
    // ... existing cases
  }
};
```

## Step 6: Deploy

```bash
# Deploy infrastructure
npm run deploy:dev

# Test your agent
npm run test-agent "trigger my new agent"
```

## Step 7: Test

Create a test file:

```typescript
// tests/myNewAgent.test.ts
import { MyNewAgent } from '../cdk/lambda-functions/chat/agents/myNewAgent';

describe('MyNewAgent', () => {
  let agent: MyNewAgent;
  
  beforeEach(() => {
    agent = new MyNewAgent();
  });
  
  it('should process message successfully', async () => {
    const result = await agent.processMessage('test query');
    
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });
  
  it('should generate thought steps', async () => {
    const result = await agent.processMessage('test query');
    
    expect(result.thoughtSteps).toBeDefined();
    expect(result.thoughtSteps.length).toBeGreaterThan(0);
  });
});
```

Run tests:

```bash
npm test
```

## Checklist

- [ ] Created agent class extending `BaseEnhancedAgent`
- [ ] Implemented `processMessage()` method
- [ ] Added intent detection patterns to `AgentRouter`
- [ ] Registered agent in router constructor
- [ ] Added routing case in `routeQuery()`
- [ ] Created tool Lambda (if needed)
- [ ] Configured IAM permissions
- [ ] Defined artifact types
- [ ] Created frontend rendering component (if needed)
- [ ] Registered artifact renderer
- [ ] Added unit tests
- [ ] Deployed and verified
- [ ] Documented usage examples

## Best Practices

### 1. Thought Steps

Always generate detailed thought steps for transparency:

```typescript
const thoughtSteps = [
  {
    type: 'intent_detection',
    title: 'Analyzing Request',
    summary: 'Understanding what the user wants',
    status: 'complete',
  },
  {
    type: 'execution',
    title: 'Processing Data',
    summary: 'Performing analysis',
    status: 'complete',
  },
  {
    type: 'completion',
    title: 'Generating Response',
    summary: 'Formatting results',
    status: 'complete',
  },
];
```

### 2. Error Handling

Handle errors gracefully:

```typescript
try {
  const result = await this.performAnalysis(message);
  return {
    success: true,
    message: result.message,
    thoughtSteps,
  };
} catch (error: any) {
  console.error('Agent error:', error);
  return {
    success: false,
    message: `Analysis failed: ${error.message}`,
    thoughtSteps,
  };
}
```

### 3. Artifact Structure

Use consistent artifact structure:

```typescript
{
  type: 'my_artifact_type',
  data: {
    messageContentType: 'my_artifact_type',
    title: 'Artifact Title',
    content: { /* your data */ },
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0',
    },
  },
}
```

### 4. Intent Detection

Use specific patterns with exclusions:

```typescript
private determineAgentType(message: string): AgentType {
  // Specific patterns first
  if (this.matchesPattern(message, /specific.*pattern/i) &&
      !this.matchesPattern(message, /exclude.*this/i)) {
    return 'my_agent';
  }
  
  // General patterns last
  return 'general';
}
```

## Troubleshooting

### Agent Not Being Called

1. Check intent detection patterns
2. Verify agent is registered in router
3. Test pattern matching in isolation

### Tool Lambda Fails

1. Check IAM permissions
2. Verify environment variables
3. Check CloudWatch logs
4. Test Lambda directly

### Artifacts Not Rendering

1. Verify artifact type matches component
2. Check artifact structure
3. Ensure component is registered
4. Check browser console for errors

## Examples

See the `examples/` directory for complete implementations:
- `weather-agent/` - Simple external API integration
- `calculator-agent/` - Pure TypeScript agent
- `data-analysis-agent/` - Python tool with visualizations

## Next Steps

- Add monitoring and alerts
- Implement caching for performance
- Add rate limiting
- Create comprehensive tests
- Document API endpoints
- Add usage examples
