# Fix EDIcraft Execution Issue

## Problem
When sending "Build wellbore trajectory for WELL-001", the agent returns the welcome message instead of executing the command.

## Root Causes Identified

### 1. Circular JSON Reference Error (FIXED)
**Error:** `Converting circular structure to JSON --> starting at object with constructor 'TLSSocket'`

**Cause:** The MCP client was trying to log/stringify the Bedrock response object which contains circular references.

**Fix Applied:**
- Updated `mcpClient.ts` to avoid logging full response objects
- Added `extractTextFromResponse()` method to safely parse various response formats
- Removed problematic `JSON.stringify()` calls on response objects

**Status:** ✅ Fixed in code, will apply on next sandbox hot-reload

### 2. Python Agent Welcome Message Logic (NEEDS DEPLOYMENT)
**Problem:** The Python agent's system prompt is too vague about when to show the welcome message.

**Current prompt says:**
```
When a user first connects or sends an empty/greeting message, respond with:
```

**This is ambiguous** - the agent interprets "Build wellbore trajectory for WELL-001" as a greeting.

**Fix Applied:**
Updated `edicraft-agent/agent.py` system prompt to:
```python
## Welcome Message (ONLY for greetings)
ONLY respond with the welcome message if the user sends a simple greeting like "hello", "hi", "hey", or an empty message.
If the user asks you to DO something (build, visualize, search, etc.), DO NOT send the welcome message - execute their request instead.
```

**Status:** ⚠️ Fixed in code, but NEEDS REDEPLOYMENT to Bedrock AgentCore

## Steps to Complete the Fix

### Step 1: TypeScript Changes (Auto-Applied)
The TypeScript changes in `mcpClient.ts` will hot-reload automatically in the running sandbox.

**No action needed** - changes are already applied.

### Step 2: Redeploy Python Agent to Bedrock AgentCore

The Python agent changes require redeployment:

```bash
# Navigate to edicraft-agent directory
cd edicraft-agent

# Redeploy the agent
make deploy

# This will:
# 1. Build the Docker image with updated agent.py
# 2. Push to ECR
# 3. Update the Bedrock AgentCore agent
# 4. Take ~5-10 minutes
```

**After deployment:**
- The agent will correctly distinguish between greetings and commands
- "Build wellbore trajectory for WELL-001" will execute instead of showing welcome
- "hello" or "hi" will still show the welcome message

### Step 3: Test the Fix

After redeployment, test with:

1. **Test greeting (should show welcome):**
   ```
   hello
   ```
   Expected: Welcome message

2. **Test command (should execute):**
   ```
   Build wellbore trajectory for WELL-001
   ```
   Expected: Agent searches OSDU, builds wellbore, returns success message

3. **Test another command:**
   ```
   list players
   ```
   Expected: Shows online players from Minecraft

## Current Status

- ✅ TypeScript circular reference fix applied
- ✅ Python agent logic fix applied to code
- ⚠️ Python agent needs redeployment to Bedrock AgentCore
- ⏳ Waiting for user to run `cd edicraft-agent && make deploy`

## Expected Behavior After Fix

### Greeting Input
**User:** "hello"

**Agent Response:**
```
Hello! 🎮⛏️ I'm your EDIcraft agent, ready to bring subsurface data to life in Minecraft.

**What I Can Help With:**

🔍 **Wellbore Trajectories**
   • Search and retrieve wellbore data from OSDU
   • Calculate 3D paths from survey data
   • Build complete wellbore visualizations in Minecraft

🌍 **Geological Horizons**
   • Find horizon surface data
   • Process large coordinate datasets
   • Create solid underground surfaces

🎮 **Minecraft Integration**
   • Transform real-world coordinates to Minecraft space
   • Track player positions
   • Build structures in real-time

I'm connected and ready to visualize your subsurface data. What would you like to explore?
```

### Command Input
**User:** "Build wellbore trajectory for WELL-001"

**Agent Response:**
```
✅ Wellbore trajectory for WELL-001 has been built in Minecraft!

The wellbore path starts at ground level and extends 2,500 meters underground,
following the survey data from OSDU.

🎮 Connect to the Minecraft server to explore the visualization in 3D.
```

## Troubleshooting

### If still getting welcome message after redeployment:

1. **Check deployment completed:**
   ```bash
   # Verify agent was updated
   aws bedrock-agentcore describe-agent --agent-id <AGENT_ID>
   ```

2. **Check CloudWatch logs:**
   ```bash
   # Look for the updated system prompt in logs
   aws logs tail /aws/lambda/edicraft-agent --follow
   ```

3. **Verify environment variables:**
   ```bash
   # Ensure BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID are correct
   echo $BEDROCK_AGENT_ID
   echo $BEDROCK_AGENT_ALIAS_ID
   ```

### If getting different errors:

1. **Check Minecraft server connectivity:**
   ```bash
   telnet edicraft.nigelgardiner.com 49000
   ```

2. **Check OSDU credentials:**
   ```bash
   # Verify credentials are set
   echo $EDI_USERNAME
   echo $EDI_PLATFORM_URL
   ```

3. **Check Lambda logs:**
   - Open AWS Console
   - Navigate to CloudWatch Logs
   - Find `/aws/lambda/edicraftAgent` log group
   - Look for error details

## Next Steps

**User needs to run:**
```bash
cd edicraft-agent && make deploy
```

Then test with "Build wellbore trajectory for WELL-001" again.

---

**Summary:** The code fixes are complete. The Python agent just needs to be redeployed to Bedrock AgentCore for the changes to take effect.
