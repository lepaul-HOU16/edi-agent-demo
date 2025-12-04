# EDIcraft Pre-Migration Working Implementation

## CRITICAL DISCOVERY

The EDIcraft agent **NEVER** worked with the approaches we've been trying post-migration. Here's what actually worked:

## Pre-Migration Architecture (WORKING)

### 1. Client: BedrockAgentCoreClient
```typescript
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
```

**NOT** `BedrockAgentRuntimeClient` - this is a completely different service!

### 2. Command: InvokeAgentRuntimeCommand
```typescript
const runtimeArn = `arn:aws:bedrock-agentcore:${region}:${accountId}:runtime/${agentId}`;

const command = new InvokeAgentRuntimeCommand({
  agentRuntimeArn: runtimeArn,
  runtimeSessionId: sessionId,
  contentType: 'application/json',
  accept: 'application/json',
  payload: new TextEncoder().encode(JSON.stringify({
    message: message,
    sessionId: sessionId
  }))
});
```

### 3. Response Processing
The response came back as a streaming body that needed to be:
1. Collected as chunks
2. Combined into Uint8Array
3. Decoded to text
4. Parsed (Python dict format, not JSON)

### 4. Key Differences from What We've Been Trying

| What Worked (Pre-Migration) | What We've Been Trying (Post-Migration) |
|------------------------------|------------------------------------------|
| `BedrockAgentCoreClient` | `BedrockAgentRuntimeClient` ❌ |
| `InvokeAgentRuntimeCommand` | `InvokeAgentCommand` ❌ |
| Runtime ARN format | Agent ID + Alias ID ❌ |
| Payload-based API | Input text field ❌ |
| Python dict response format | JSON response ❌ |

## Why Post-Migration Failed

1. **Wrong SDK Package**: We've been using `@aws-sdk/client-bedrock-agent-runtime` instead of `@aws-sdk/client-bedrock-agentcore`

2. **Wrong API**: `InvokeAgentCommand` vs `InvokeAgentRuntimeCommand` - completely different APIs

3. **Wrong ARN Format**: We've been using agent ID + alias ID, but it needs a runtime ARN

4. **Wrong Response Parsing**: We've been expecting JSON, but it returns Python dict format

## The Migration Broke Everything

The migration from Amplify to CDK **completely ignored** the EDIcraft implementation:
- Didn't migrate the correct SDK package
- Didn't migrate the correct API calls
- Didn't migrate the response parsing logic
- Didn't migrate the runtime ARN construction

## What Needs to Happen

1. **Install correct SDK**:
   ```bash
   npm install @aws-sdk/client-bedrock-agentcore
   ```

2. **Restore pre-migration mcpClient.ts** with:
   - BedrockAgentCoreClient
   - InvokeAgentRuntimeCommand
   - Runtime ARN construction
   - Python dict response parsing

3. **Update IAM permissions** for `bedrock-agentcore:*` (not `bedrock-agent-runtime:*`)

4. **Test with the ACTUAL working implementation**

## Files to Restore

From `.archive/amplify-backup-20251115.tar.gz`:
- `amplify/functions/edicraftAgent/mcpClient.ts` - The WORKING implementation
- `amplify/functions/edicraftAgent/handler.ts` - The WORKING handler
- `amplify/functions/edicraftAgent/intentClassifier.ts` - The WORKING classifier

## Bottom Line

**We've been trying to fix something that was never broken in the first place. The migration just threw away the working code and replaced it with a completely different (non-working) approach.**

The solution is simple: **RESTORE THE PRE-MIGRATION CODE**.
