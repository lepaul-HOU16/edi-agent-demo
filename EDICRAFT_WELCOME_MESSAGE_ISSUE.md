# EDIcraft Welcome Message Issue - Root Cause Analysis

## Problem Statement

When sending "Build wellbore trajectory for WELL-001", the agent returns the welcome message instead of executing the command.

## Root Cause

The welcome message is **hardcoded in the Python agent's system prompt**. Even with explicit instructions telling the LLM to only show it for greetings, the LLM (Claude) still chooses to display it for commands because:

1. The welcome message text is present in the system prompt
2. The LLM interprets the user's intent and decides the welcome message is appropriate
3. System prompt instructions are suggestions, not hard constraints

## What We've Tried

### Attempt 1: Vague Instructions
```python
## Welcome Message (for initial/empty queries)
When a user first connects or sends an empty/greeting message, respond with:
```
**Result:** Failed - too vague, LLM treats everything as a greeting

### Attempt 2: Specific Instructions  
```python
## Welcome Message (ONLY for greetings)
ONLY respond with the welcome message if the user sends a simple greeting like "hello", "hi", "hey", or an empty message.
If the user asks you to DO something (build, visualize, search, etc.), DO NOT send the welcome message - execute their request instead.
```
**Result:** Failed - LLM still shows welcome message for commands

### Attempt 3: Explicit Examples
```python
## CRITICAL: Welcome Message Rules
The welcome message should ONLY be shown for these EXACT inputs:
- "hello", "hi", "hey"
- Empty or whitespace-only messages

Examples of commands that should NOT trigger welcome message:
- "Build wellbore trajectory for WELL-001" → Use build_wellbore_in_minecraft tool
```
**Result:** Failed - LLM still ignores instructions

## Why System Prompt Instructions Don't Work

LLMs like Claude use the system prompt as **guidance**, not **rules**. When the LLM sees:
1. A welcome message in the system prompt
2. A user query
3. Instructions about when to show the welcome message

It makes a **judgment call** about what's most helpful. Even with explicit instructions, the LLM may decide showing the welcome message is the "right" thing to do.

## The Correct Solution

**Remove the welcome message from the Python agent entirely** and handle it in the TypeScript wrapper layer.

### Architecture Change

```
Current (Broken):
User → TypeScript Handler → Python Agent (has welcome message) → Response

Correct:
User → TypeScript Handler (checks for greeting) → Python Agent (no welcome message) → Response
                ↓ (if greeting)
         Return welcome message
```

### Implementation

**1. Remove welcome message from `edicraft-agent/agent.py`:**
```python
agent = Agent(
    model=BEDROCK_MODEL_ID,
    tools=[...],
    system_prompt=f"""You are the EDIcraft Agent for visualizing subsurface data in Minecraft.

## Your Core Capabilities:

### Wellbore Trajectory Workflow:
1. Search OSDU for wellbore data
2. Parse survey measurements
3. Calculate 3D coordinates
4. Build wellbore path in Minecraft

[... rest of capabilities, NO welcome message ...]
"""
)
```

**2. Add welcome message logic to `amplify/functions/edicraftAgent/handler.ts`:**
```typescript
export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<EDIcraftAgentResponse> => {
  const message = event.arguments.message;
  
  // Check if message is a greeting
  const greetings = ['hello', 'hi', 'hey', 'greetings'];
  const isGreeting = greetings.some(g => message.trim().toLowerCase() === g) || message.trim() === '';
  
  if (isGreeting) {
    return {
      success: true,
      message: `Hello! 🎮⛏️ I'm your EDIcraft agent, ready to bring subsurface data to life in Minecraft.

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

I'm connected and ready to visualize your subsurface data. What would you like to explore?`,
      artifacts: [],
      thoughtSteps: [],
      connectionStatus: 'connected'
    };
  }
  
  // Otherwise, process through Python agent
  const mcpClient = new EDIcraftMCPClient({...});
  const response = await mcpClient.processMessage(message);
  return response;
};
```

## Why This Solution Works

1. **Deterministic Logic:** TypeScript checks exact string matches - no LLM interpretation
2. **Separation of Concerns:** Welcome message is UI logic, not agent logic
3. **Reliable:** No ambiguity about when to show welcome message
4. **Fast:** No need to call Python agent for greetings

## Current Status

- ✅ TypeScript response parsing fixed (displays welcome message correctly)
- ✅ Python agent deployed with updated system prompt
- ❌ Welcome message still shows for commands (system prompt approach doesn't work)
- ⏳ Need to implement TypeScript-level welcome message handling

## Next Steps

1. Remove welcome message from `edicraft-agent/agent.py` system prompt
2. Add greeting detection logic to `amplify/functions/edicraftAgent/handler.ts`
3. Redeploy Python agent (without welcome message)
4. Test: "hello" → shows welcome, "Build wellbore..." → executes command

## Estimated Time

- Code changes: 10 minutes
- Python agent redeployment: 5-10 minutes
- Testing: 5 minutes
- **Total: ~25 minutes**

## Conclusion

The system prompt approach fundamentally cannot work because LLMs interpret instructions as guidance, not rules. The only reliable solution is to handle the welcome message at the application level with deterministic logic.

The welcome message is working correctly (displays properly), but it's being triggered incorrectly (shows for all inputs). Moving the logic to TypeScript will fix this.

---

**Recommendation:** Implement the TypeScript-level welcome message handling as described above. This is the industry-standard approach for handling simple routing logic that doesn't require LLM intelligence.
