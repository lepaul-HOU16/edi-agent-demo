# EDIcraft Restoration Plan - Use Pre-Migration Working Code

## Problem Summary

The Amplify → CDK migration **completely ignored** the EDIcraft agent implementation and replaced it with non-working code. We've been trying to fix the wrong thing for weeks.

## What Actually Worked (Pre-Migration)

1. **SDK**: `@aws-sdk/client-bedrock-agentcore` (NOT bedrock-agent-runtime)
2. **Client**: `BedrockAgentCoreClient`
3. **Command**: `InvokeAgentRuntimeCommand`
4. **ARN Format**: `arn:aws:bedrock-agentcore:{region}:{account}:runtime/{agentId}`
5. **Response**: Python dict format, not JSON

## Restoration Steps

### Step 1: Install Correct SDK Package
```bash
cd cdk/lambda-functions/chat
npm install @aws-sdk/client-bedrock-agentcore
```

### Step 2: Restore Pre-Migration mcpClient.ts

Copy from `.archive/amplify-backup-20251115.tar.gz`:
- `amplify/functions/edicraftAgent/mcpClient.ts`

To:
- `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js`

Key changes needed:
- Convert from `.ts` to `.js` (remove TypeScript types)
- Update imports to use `.js` extension
- Keep ALL the logic exactly as it was

### Step 3: Restore Pre-Migration handler logic

The handler had:
- Proper greeting detection (BEFORE validation)
- Environment variable validation
- Hybrid intent classification
- Direct tool call generation
- Proper error categorization

### Step 4: Update IAM Permissions

Change from:
```typescript
"bedrock-agent-runtime:*"
```

To:
```typescript
"bedrock-agentcore:*"
```

### Step 5: Deploy and Test

```bash
cd cdk
npm run deploy
```

Then test on localhost with a simple message like "Build wellbore trajectory for WELL-001"

## Why This Will Work

This is the **EXACT CODE** that worked before the migration. We're not guessing, we're not trying new approaches - we're restoring what was proven to work.

## Files Affected

1. `cdk/lambda-functions/chat/package.json` - Add SDK package
2. `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` - Restore working implementation
3. `cdk/lambda-functions/chat/agents/edicraftAgent.ts` - Update handler logic
4. `cdk/lib/main-stack.ts` - Update IAM permissions

## Next Steps

1. Extract pre-migration files from archive
2. Convert TypeScript to JavaScript (minimal changes)
3. Install correct SDK package
4. Deploy
5. Test

**This should take 30 minutes, not weeks.**
