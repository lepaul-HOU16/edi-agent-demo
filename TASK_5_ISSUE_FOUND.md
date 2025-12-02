# Task 5: Issue Found - Clear Button Doesn't Clear Minecraft

## Issue Report

**Status**: UX works correctly, but backend operation fails

### What Works ✅
- Button shows loading spinner (restored UX)
- Success alert appears (restored UX)
- Alert auto-dismisses after 5 seconds (restored UX)
- Message sent through chat (kept functionality)
- Agent responds in chat (kept functionality)

### What Doesn't Work ❌
- **Minecraft environment does NOT actually clear**
- The agent receives the message but doesn't execute the clear operation

## Root Cause Analysis

### Frontend (Working Correctly)
The smart merge successfully restored all UX patterns:
```typescript
// Message sent: "Clear the Minecraft environment and fill any terrain holes"
await onSendMessage('Clear the Minecraft environment and fill any terrain holes');
```

### Backend (Issue Here)
The message reaches the EDIcraft agent, which forwards it to Bedrock AgentCore. However, the actual clearing doesn't happen in Minecraft.

**Possible causes:**

1. **Agent Configuration Issue**
   - Bedrock AgentCore agent may not have the clear tool configured
   - Agent may not recognize the natural language command
   - Agent may need a more specific command format

2. **RCON Connection Issue**
   - Minecraft server may not be accessible
   - RCON password may be incorrect
   - RCON port may be blocked

3. **Environment Variables**
   - `MINECRAFT_HOST` may not be set correctly
   - `MINECRAFT_PORT` may not be set correctly
   - `MINECRAFT_RCON_PASSWORD` may not be set correctly
   - `BEDROCK_AGENT_ID` may not point to correct agent

4. **Agent Tool Configuration**
   - The Bedrock AgentCore agent may not have the "clear" action configured
   - The agent may need explicit tool definitions

## Diagnostic Steps

### 1. Check Environment Variables
```bash
# Check if Minecraft connection is configured
echo $MINECRAFT_HOST
echo $MINECRAFT_PORT
echo $MINECRAFT_RCON_PASSWORD

# Check if Bedrock agent is configured
echo $BEDROCK_AGENT_ID
echo $BEDROCK_AGENT_ALIAS_ID
```

### 2. Check Agent Response
When you click the clear button, check the agent's response in chat:
- Does it say it's clearing?
- Does it report any errors?
- Does it say the command was successful?

### 3. Check CloudWatch Logs
Look for logs from the EDIcraft Lambda function:
```bash
# Search for EDIcraft agent logs
aws logs tail /aws/lambda/chat-handler --follow --filter-pattern "EDIcraft"
```

Look for:
- `[EDIcraft MCP Client] Processing message`
- `[EDIcraft MCP Client] Agent invocation successful`
- Any error messages

### 4. Test Direct RCON Connection
Try connecting to Minecraft directly to verify RCON works:
```bash
# If you have mcrcon installed
mcrcon -H $MINECRAFT_HOST -P $MINECRAFT_PORT -p $MINECRAFT_RCON_PASSWORD "say Test"
```

## Comparison with Pre-Migration

### Pre-Migration Behavior
Need to check what the pre-migration code did:
```bash
git show 925b396:src/components/agent-landing-pages/EDIcraftAgentLanding.tsx
```

Look for:
- What message was sent?
- Was there a different API endpoint?
- Was there direct RCON communication?

## Possible Solutions

### Solution 1: Update Command Format
The agent might need a more specific command:
```typescript
// Instead of:
'Clear the Minecraft environment and fill any terrain holes'

// Try:
'Execute clear command'
// or
'/clear'
// or
'Clear all structures and entities'
```

### Solution 2: Check Agent Configuration
The Bedrock AgentCore agent needs to have:
- Action group with "clear" function
- RCON tool configured
- Proper permissions to invoke RCON

### Solution 3: Verify Environment
Ensure all environment variables are set in the Lambda function:
- MINECRAFT_HOST
- MINECRAFT_PORT
- MINECRAFT_RCON_PASSWORD
- BEDROCK_AGENT_ID
- BEDROCK_AGENT_ALIAS_ID

### Solution 4: Check Agent Logs
The agent response should tell us what happened:
- Did it try to clear?
- Did it encounter an error?
- Did it not recognize the command?

## Next Steps

1. **Check agent response in chat** - What does the agent say when you click clear?
2. **Check CloudWatch logs** - What do the Lambda logs show?
3. **Verify environment variables** - Are they set correctly?
4. **Compare with pre-migration** - What did the old code do differently?
5. **Test RCON connection** - Can we connect to Minecraft directly?

## Task 5 Status

**UX Testing**: ✅ PASSED - All UX patterns work correctly
**Functional Testing**: ❌ FAILED - Clear operation doesn't execute in Minecraft

The smart merge successfully restored the UX, but there's a backend/configuration issue preventing the actual clear operation from working.

## Requirements Impact

This issue affects:
- **Requirement 1.2**: Clear button should execute clear action (FAILS)
- **Requirement 1.3**: No user message in chat (PASSES - message sent via onSendMessage)
- **Requirement 1.4**: Only agent response in chat (PASSES)
- **Requirement 1.5**: Button shows loading state (PASSES)

The UX requirements pass, but the functional requirement fails.

## Recommendation

This is NOT a regression from the migration - this is a backend configuration issue. The smart merge successfully restored the UX patterns. The issue is that the EDIcraft agent backend isn't properly configured or connected to Minecraft.

**We need to:**
1. Investigate the agent configuration
2. Check environment variables
3. Verify RCON connection
4. Compare with pre-migration to see if there was a different approach

This is a separate issue from the migration regression fix.
