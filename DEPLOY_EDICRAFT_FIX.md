# EDIcraft Agent Routing Fix

## Problem
When selecting the EDIcraft agent in the UI, users were seeing the generic petrophysics welcome message instead of the EDIcraft agent processing their requests.

## Root Cause
The `handler.ts` file was missing 'edicraft' in the TypeScript type cast for `selectedAgent`:

```typescript
// BEFORE (BROKEN):
selectedAgent: event.arguments.agentType as 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | undefined

// AFTER (FIXED):
selectedAgent: event.arguments.agentType as 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft' | undefined
```

Without 'edicraft' in the type cast, TypeScript could potentially drop or mishandle the value when it's 'edicraft'.

## Fix Applied
Updated `amplify/functions/agents/handler.ts` line 119 to include 'edicraft' in the type cast.

## Deployment Steps

1. **Stop the current sandbox** (if running):
   ```bash
   # Press Ctrl+C in the terminal running the sandbox
   ```

2. **Restart the sandbox to deploy the fix**:
   ```bash
   npx ampx sandbox
   ```

3. **Wait for deployment to complete** (look for "Deployed" message)

4. **Test the fix**:
   - Open the app in an incognito window
   - Select the EDIcraft agent from the agent switcher
   - Send a test message like: "Build wellbore trajectory for WELL-001 in Minecraft"
   - You should see EDIcraft-specific responses, NOT the petrophysics welcome message

## Verification

Check CloudWatch logs for the agent Lambda function. You should see:
```
🎮 Routing to EDIcraft Agent
```

If you still see the petrophysics welcome message, check:
1. Environment variables are set (BEDROCK_AGENT_ID, MINECRAFT_HOST, etc.)
2. The EDIcraft agent handler is returning proper responses
3. CloudWatch logs for any errors

## Related Files
- `amplify/functions/agents/handler.ts` - Fixed type cast
- `amplify/functions/agents/agentRouter.ts` - Routing logic (already correct)
- `src/components/ChatBox.tsx` - Frontend sending agentType (already correct)
