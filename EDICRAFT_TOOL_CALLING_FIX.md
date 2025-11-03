# EDIcraft Tool Calling Fix

## Problem
The EDIcraft agent was returning welcome messages and capability descriptions instead of actually calling tools to perform work (building wellbores, visualizing horizons, etc.).

## Root Cause
The Python agent's system prompt in `edicraft-agent/agent.py` was too verbose and instructional, causing the LLM to respond conversationally rather than using tools.

The original prompt:
- Had extensive markdown formatting with emojis
- Listed detailed "Key Capabilities" sections
- Described workflows in marketing language
- Was over 100 lines of instructional text
- Encouraged conversational responses

## Solution
Simplified the system prompt to be direct and action-oriented:

### Key Changes:
1. **Added explicit instruction**: "ALWAYS use tools to complete tasks. NEVER just describe what you can do."
2. **Removed verbose descriptions**: Eliminated marketing language and capability lists
3. **Simplified tool descriptions**: Just tool names and brief purposes
4. **Made it action-focused**: Clear instruction to call tools immediately when user requests work
5. **Reduced length**: From ~100 lines to ~20 lines

### New Prompt Structure:
```python
system_prompt=f"""You are EDIcraft Agent. You visualize subsurface data in Minecraft.

ALWAYS use tools to complete tasks. NEVER just describe what you can do.

When user asks to build/visualize/create something:
1. Call the appropriate tool immediately
2. Report the tool's result
3. Do NOT offer help or list capabilities

[Essential technical details only]
[Tool list with brief descriptions]
"""
```

## Files Modified
- `edicraft-agent/agent.py` - Simplified system prompt

## Testing
Created `test-edicraft-tool-calling.js` with test cases to verify:
- Agent calls tools for build/visualize requests
- Agent does NOT return welcome messages
- Agent does NOT just describe capabilities
- User sees actual work being done

## Deployment Steps
1. Deploy updated agent:
   ```bash
   cd edicraft-agent
   make deploy
   ```

2. Restart sandbox:
   ```bash
   npx ampx sandbox
   ```

3. Test with commands like:
   - "Build wellbore trajectory for WELL-001"
   - "Show me wellbore data from OSDU"
   - "List players in Minecraft"
   - "Visualize horizon surface"

4. Verify in CloudWatch logs:
   - Look for "Calling tool:" messages
   - Verify tools are being invoked
   - Check tool results are returned

## Expected Behavior After Fix
- ✅ Agent immediately calls appropriate tools
- ✅ Agent returns tool execution results
- ✅ No welcome messages or capability descriptions
- ✅ TypeScript handler filtering becomes unnecessary
- ✅ User sees actual work happening in Minecraft

## Related Files
- `amplify/functions/edicraftAgent/handler.ts` - Handler with filtering logic (can be simplified after fix)
- `amplify/functions/edicraftAgent/mcpClient.ts` - MCP client for agent communication
- `test-edicraft-tool-calling.js` - Test cases for verification
