# EDIcraft Correct SDK Found! 🎯

## Critical Discovery

Found the original working Amplify implementation that shows the **correct SDK** to use!

## The Correct SDK

**File**: `amplify/functions/edicraftAgent/mcpClient.ts` (Line 8)

```typescript
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
```

## What We Were Using (WRONG)

```javascript
// WRONG - This is for regular Bedrock Agents
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
```

## What We Should Use (CORRECT)

```typescript
// CORRECT - This is for Bedrock AgentCore
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
```

## Key Differences

| Feature | Wrong SDK | Correct SDK |
|---------|-----------|-------------|
| Package | `@aws-sdk/client-bedrock-agent-runtime` | `@aws-sdk/client-bedrock-agentcore` |
| Client | `BedrockAgentRuntimeClient` | `BedrockAgentCoreClient` |
| Command | `InvokeAgentCommand` | `InvokeAgentRuntimeCommand` |
| Service | `bedrock-agent` | `bedrock-agentcore` |

## The Correct Implementation

From `amplify/functions/edicraftAgent/mcpClient.ts` (lines 118-138):

```typescript
private async invokeBedrockAgent(message: string): Promise<{ message: string; thoughtSteps: ThoughtStep[] }> {
  // Bedrock AgentCore uses a payload-based API with runtime ARN
  const runtimeArn = `arn:aws:bedrock-agentcore:${this.config.region}:${process.env.AWS_ACCOUNT_ID || '484907533441'}:runtime/${this.config.bedrockAgentId}`;
  
  const payload = JSON.stringify({
    message: message,
    sessionId: this.sessionId
  });
  
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: runtimeArn,
    runtimeSessionId: this.sessionId,
    contentType: 'application/json',
    accept: 'application/json',
    payload: new TextEncoder().encode(payload)
  });

  console.log('[EDIcraft MCP Client] Sending InvokeAgentRuntimeCommand');
  const response = await this.bedrockClient.send(command);
  
  // Process response...
}
```

## Why This Matters

1. **Different Service**: AgentCore is a separate AWS service from regular Bedrock Agents
2. **Different API**: Uses runtime ARN instead of agent ID + alias ID
3. **Different Payload**: Uses JSON payload with message and sessionId
4. **Different Response**: Returns streaming response in different format

## Next Steps

1. Update `cdk/lambda-functions/chat/package.json` to use correct SDK
2. Rewrite `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` to match Amplify implementation
3. Deploy and test

## Files to Reference

- **Original Working Code**: `amplify/functions/edicraftAgent/mcpClient.ts`
- **Original Handler**: `amplify/functions/edicraftAgent/handler.ts`
- **Current Broken Code**: `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js`

This is the smoking gun that shows exactly how it should work!
