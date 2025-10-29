# EDIcraft Environment Variables Fix

## Problem
Lambda function was missing required environment variables:
- `BEDROCK_AGENT_ID`
- `BEDROCK_AGENT_ALIAS_ID`

This caused the handler to fail validation and return a configuration error.

## Root Cause
The Lambda function resource (`amplify/functions/edicraftAgent/resource.ts`) had `BEDROCK_AGENTCORE_ARN` but not the individual `BEDROCK_AGENT_ID` and `BEDROCK_AGENT_ALIAS_ID` variables that the handler expects.

## Solution
Added the missing environment variables to the Lambda function resource:

```typescript
environment: {
  // ... existing vars ...
  BEDROCK_AGENT_ID: 'edicraft-kl1b6iGNug',
  BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',
  BEDROCK_AGENTCORE_ARN: 'arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/edicraft-kl1b6iGNug'
}
```

## Deployment Required
The sandbox must be restarted to apply the environment variable changes:

```bash
# Stop current sandbox (Ctrl+C)
# Then restart:
npx ampx sandbox
```

## Verification
After sandbox restart, test the agent:
1. Send a message to EDIcraft agent in chat
2. Should NOT see configuration error
3. Should see agent calling tools and performing work

## Agent Details
- **Agent ID**: `edicraft-kl1b6iGNug`
- **Alias ID**: `TSTALIASID`
- **Region**: `us-east-1`
- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/edicraft-kl1b6iGNug`

## Files Modified
- `amplify/functions/edicraftAgent/resource.ts` - Added BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID

## Status
✅ Code fixed - awaiting sandbox restart to deploy changes
