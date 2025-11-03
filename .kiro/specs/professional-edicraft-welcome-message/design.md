# Design Document

## Overview

This design improves the EDIcraft agent's welcome message to be presentation-quality while hiding technical server details. Additionally, it clarifies the agent's workflow to ensure users understand that visualizations occur in Minecraft, not in the chat interface.

## Architecture

### Current Flow
```
User opens EDIcraft chat
    ↓
Frontend sends initial/empty message
    ↓
Bedrock AgentCore agent responds with system prompt introduction
    ↓
User sees welcome message with server details
    ↓
User gives specific command (e.g., "Build wellbore WELL-001")
    ↓
Agent executes tools and builds in Minecraft
    ↓
Agent responds with text confirmation
    ↓
User must connect to Minecraft to see visualization
```

### Improved Flow
```
User opens EDIcraft chat
    ↓
Frontend sends initial message OR user types first query
    ↓
Agent responds with professional welcome (if initial) OR executes task
    ↓
User sees clean, professional message
    ↓
User gives specific command
    ↓
Agent executes and provides clear feedback about Minecraft visualization
    ↓
User connects to Minecraft to see results
```

## Components and Interfaces

### 1. System Prompt Modification (agent.py)

**Location**: `edicraft-agent/agent.py`

**Current System Prompt Issues**:
- Exposes server URLs and ports
- Shows technical configuration details
- Lists all tools with implementation details
- Too verbose for initial greeting

**Improved System Prompt Structure**:
```python
system_prompt=f"""You are the EDIcraft Agent - your specialized assistant for visualizing subsurface data in Minecraft.

## Welcome Message (for initial/empty queries)
When a user first connects or sends an empty/greeting message, respond with:

"Hello! 🎮⛏️ I'm your EDIcraft agent, ready to bring subsurface data to life in Minecraft.

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

I'm connected and ready to visualize your subsurface data. What would you like to explore?"

## Your Core Capabilities:

### Wellbore Trajectory Workflow:
1. Search OSDU for wellbore data
2. Parse survey measurements (TVD, Azimuth, Inclination)
3. Calculate 3D coordinates using minimum curvature method
4. Build complete wellbore path in Minecraft (starting at ground level Y=100, going down)

### Horizon Surface Workflow:
1. Search OSDU for horizon surfaces
2. Download and parse coordinate data (handles 200k+ points)
3. Transform coordinates to Minecraft space
4. Build solid underground surfaces

### Minecraft Coordinate System:
- Ground Level: Y=100 (surface)
- Underground: Y<100 (where wellbores and horizons are built)
- Wellbores: Start at Y=100 and extend downward

## Important Behavior:
- When building structures, ALWAYS mention that visualization occurs in Minecraft
- Provide clear feedback about what was built and where
- Remind users they need to connect to Minecraft to see the results
- Use the automated building tools (build_wellbore_in_minecraft, build_horizon_surface)
- Do NOT expose server URLs, ports, or technical configuration in responses

## Available Tools:
[Tool descriptions without implementation details]
"""
```

### 2. Response Formatting Enhancement

**Principle**: All agent responses should:
- Focus on what was accomplished
- Indicate where to see results (Minecraft)
- Avoid technical jargon
- Be concise and actionable

**Example Response Patterns**:

**Before** (Current):
```
"Successfully built wellbore trajectory for WELL-001 at edicraft.nigelgardiner.com:49001 
using RCON commands. Coordinates transformed from UTM zone 14N. 
OSDU platform: https://osdu.vavourak.people.aws.dev"
```

**After** (Improved):
```
"✅ Wellbore trajectory for WELL-001 has been built in Minecraft!

The wellbore path starts at ground level and extends 2,500 meters underground, 
following the survey data from OSDU.

🎮 Connect to the Minecraft server to explore the visualization in 3D."
```

### 3. Frontend Integration (No Changes Required)

The frontend already handles the agent's text responses correctly. No changes needed to:
- `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`
- `amplify/functions/edicraftAgent/handler.ts`
- `amplify/functions/edicraftAgent/mcpClient.ts`

The improvement is entirely in the agent's system prompt and response behavior.

## Data Models

### Agent Response Structure (Unchanged)
```typescript
interface EDIcraftResponse {
  success: boolean;
  message: string;  // This is where the improved text goes
  artifacts?: any[];  // Always empty for EDIcraft (visualization in Minecraft)
  thoughtSteps?: ThoughtStep[];
  connectionStatus?: string;
}
```

### System Prompt Configuration
```python
# Environment variables (keep existing)
MINECRAFT_HOST = os.getenv('MINECRAFT_HOST', '')
MINECRAFT_RCON_PORT = os.getenv('MINECRAFT_RCON_PORT', '')
EDI_PLATFORM_URL = os.getenv('EDI_PLATFORM_URL', '')

# Use in system prompt WITHOUT exposing to users
# Reference generically: "Minecraft server" and "OSDU platform"
```

## Implementation Strategy

### Phase 1: Update System Prompt
1. Modify `edicraft-agent/agent.py`
2. Replace verbose system prompt with professional version
3. Add welcome message template for initial queries
4. Remove server URL/port exposure from prompt

### Phase 2: Test Welcome Message
1. Deploy updated agent
2. Test initial connection (empty message)
3. Verify professional welcome appears
4. Confirm no server details exposed

### Phase 3: Test Workflow Responses
1. Test wellbore building command
2. Verify response mentions Minecraft visualization
3. Test horizon surface command
4. Confirm responses are concise and actionable

### Phase 4: Validate in Minecraft
1. Execute wellbore build command
2. Connect to Minecraft server
3. Verify structure was built correctly
4. Confirm coordinates and positioning

## Error Handling

### Welcome Message Errors
- If agent fails to respond: Frontend shows generic "Agent unavailable" message
- If system prompt is malformed: Agent falls back to basic response
- If environment variables missing: Handler catches and shows configuration error

### Visualization Errors
- If Minecraft connection fails: Agent should report "Unable to connect to Minecraft server"
- If OSDU authentication fails: Agent should report "Unable to access OSDU platform"
- If build fails: Agent should provide specific error and troubleshooting steps

## Testing Strategy

### Unit Tests
- Test system prompt formatting
- Verify no server URLs in responses
- Confirm welcome message structure

### Integration Tests
1. **Welcome Message Test**
   - Send empty/initial message
   - Verify professional welcome received
   - Confirm no technical details exposed

2. **Wellbore Build Test**
   - Send "Build wellbore WELL-001"
   - Verify agent executes tools
   - Confirm response mentions Minecraft
   - Check structure built in Minecraft

3. **Horizon Surface Test**
   - Send "Visualize horizon surface"
   - Verify agent processes data
   - Confirm response is concise
   - Check surface built in Minecraft

### User Acceptance Tests
1. Product manager reviews welcome message (presentation quality)
2. User tests wellbore workflow end-to-end
3. User tests horizon workflow end-to-end
4. Verify no confusion about where visualization occurs

## Configuration Management

### Environment Variables (Unchanged)
```bash
# Required for agent operation (not exposed to users)
BEDROCK_AGENT_ID=edicraft-xxxxx
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=49000
MINECRAFT_RCON_PASSWORD=xxxxx
EDI_PLATFORM_URL=https://osdu.vavourak.people.aws.dev
EDI_PARTITION=opendes
```

### System Prompt Configuration
- Stored in `agent.py` as Python f-string
- Can be updated without code changes to handler
- Requires agent redeployment to take effect

## Deployment Considerations

### Deployment Steps
1. Update `edicraft-agent/agent.py` with new system prompt
2. Rebuild agent container: `cd edicraft-agent && make build`
3. Deploy to Bedrock AgentCore: `make deploy`
4. No frontend changes required
5. Test welcome message and workflows

### Rollback Plan
- Keep previous `agent.py` version in git
- If issues occur, revert to previous system prompt
- Redeploy agent with original prompt

### Monitoring
- Check CloudWatch logs for agent responses
- Monitor for user confusion about visualization location
- Track success rate of wellbore/horizon builds

## Success Criteria

### Welcome Message Quality
- ✅ Professional, concise greeting
- ✅ No server URLs or ports visible
- ✅ Clear capability descriptions
- ✅ Friendly, approachable tone
- ✅ Under 300 words

### Workflow Clarity
- ✅ Users understand visualization occurs in Minecraft
- ✅ Responses indicate where to see results
- ✅ No confusion about missing visual artifacts in chat
- ✅ Clear feedback about what was built

### Technical Quality
- ✅ Agent continues to function correctly
- ✅ All tools execute as expected
- ✅ Minecraft structures build successfully
- ✅ OSDU integration works properly

## Why You're Getting Welcome Message Instead of Visualization

**Root Cause**: The welcome message appears when:
1. You first open the EDIcraft chat (initial connection)
2. You send an empty or greeting message
3. The agent hasn't received a specific task command yet

**Expected Behavior**:
- Welcome message = Agent is ready, waiting for your command
- To trigger visualization: Send specific command like:
  - "Build wellbore trajectory for WELL-001"
  - "Visualize horizon surface in Minecraft"
  - "Search for wellbores in the area"

**Visualization Location**:
- Visualizations do NOT appear in the chat interface
- Visualizations appear in the Minecraft server
- You must connect to Minecraft to see the 3D structures
- The chat shows text confirmation of what was built

**Improved Workflow**:
1. See welcome message (agent ready)
2. Give specific command
3. Agent builds in Minecraft
4. Agent confirms what was built
5. You connect to Minecraft to see it

This design ensures users understand the workflow and aren't confused about where visualizations appear.
