# EDIcraft Agent Integration Status

## Current Status: Partial Integration (Routing Fixed, Backend Pending)

### ✅ Completed
1. **Agent Router** - EDIcraft queries now properly route to the EDIcraft agent
   - Added comprehensive pattern matching for Minecraft/OSDU queries
   - Patterns include: minecraft, wellbore, horizon, well log + minecraft, etc.
   - Query "get a well log from well001 and show it in minecraft" now routes correctly

2. **Agent Switcher** - EDIcraft option available in UI
   - Users can explicitly select EDIcraft agent
   - Agent selection persists in session storage

3. **Handler Structure** - Lambda handler and MCP client scaffolding in place
   - `amplify/functions/edicraftAgent/handler.ts`
   - `amplify/functions/edicraftAgent/mcpClient.ts`
   - `amplify/functions/agents/edicraftAgent.ts`

### ⚠️ Pending - Requires Deployment
The current implementation returns **preview messages** instead of executing actual Minecraft/OSDU operations. To enable full functionality:

#### Required: Deploy Bedrock AgentCore Agent

The EDIcraft functionality exists as a Python Bedrock AgentCore application in `/EDIcraft-main/`:

**Key Files:**
- `agent.py` - Main agent with tools for wellbore trajectories, horizons, OSDU search, Minecraft commands
- `tools/` - Python modules for OSDU client, coordinate transformation, trajectory calculation, horizon processing
- `.bedrock_agentcore.yaml` - Deployment configuration

**Tools Available:**
- `search_wellbores()` - Search OSDU for wellbore trajectories
- `get_trajectory_coordinates()` - Get trajectory data for specific wellbore
- `minecraft_command()` - Execute RCON commands on Minecraft server
- `build_wellbore()` - Build wellbore visualization in Minecraft
- `transform_coordinates()` - Convert UTM to Minecraft coordinates
- `calculate_trajectory_coordinates()` - Calculate 3D trajectory from survey data
- `search_horizons_live()` - Search OSDU for horizon surfaces
- `build_horizon_surface()` - Build geological surfaces in Minecraft

#### Deployment Steps

1. **Deploy Bedrock AgentCore Agent**
   ```bash
   cd EDIcraft-main
   # Configure config.ini with credentials
   make deploy
   ```

2. **Update Lambda Environment Variables**
   Add to `amplify/functions/edicraftAgent/handler.ts`:
   - `BEDROCK_AGENT_ID` - Agent ID from deployment
   - `BEDROCK_AGENT_ALIAS_ID` - Agent alias ID
   - `MINECRAFT_HOST` - Minecraft server host (edicraft.nigelgardiner.com)
   - `MINECRAFT_PORT` - Minecraft server port (49000)
   - `MINECRAFT_RCON_PASSWORD` - RCON password
   - `EDI_USERNAME` - OSDU username
   - `EDI_PASSWORD` - OSDU password
   - `EDI_CLIENT_ID` - OSDU client ID
   - `EDI_CLIENT_SECRET` - OSDU client secret
   - `EDI_PARTITION` - OSDU partition
   - `EDI_PLATFORM_URL` - OSDU platform URL

3. **Update MCP Client to Invoke Real Agent**
   Modify `mcpClient.ts` to use `BedrockAgentRuntimeClient.invokeAgent()` instead of returning preview messages

4. **Test End-to-End**
   - Query: "get a well log from well001 and show it in minecraft"
   - Expected: Agent searches OSDU, retrieves wellbore data, builds visualization in Minecraft
   - User sees: Confirmation message with Minecraft coordinates

### Current Behavior (Preview Mode)

When users query EDIcraft, they receive informative preview messages explaining what the agent **would** do:

**Example Query:** "Build wellbore trajectory in Minecraft"

**Current Response:**
```
EDIcraft Agent would process wellbore visualization request:

1. Search OSDU Platform - Find wellbore trajectories
2. Parse Survey Data - Extract TVD, Azimuth, Inclination
3. Calculate 3D Coordinates - Use minimum curvature method
4. Build in Minecraft - Visualize at edicraft.nigelgardiner.com:49000

The wellbore would be rendered starting at ground level (Y=100) and extending 
downward into the subsurface.

Note: This is a preview response. Full MCP server integration is pending deployment.
```

### Architecture

```
User Query
    ↓
Agent Router (detects "minecraft" keyword)
    ↓
EDIcraft Handler (Lambda)
    ↓
MCP Client (currently returns preview)
    ↓
[PENDING] Bedrock AgentCore Agent (Python)
    ↓
[PENDING] OSDU Platform + Minecraft Server
    ↓
[PENDING] Visualization in Minecraft
```

### Next Steps

1. Deploy the Bedrock AgentCore agent from EDIcraft-main
2. Configure environment variables with agent ID and credentials
3. Update mcpClient.ts to invoke the real agent
4. Test with actual Minecraft server and OSDU platform
5. Update response handling to parse agent output

### Testing Without Full Deployment

To test routing without deploying the full backend:
1. Select "EDIcraft" in Agent Switcher
2. Send query: "show me a wellbore in minecraft"
3. Verify it routes to EDIcraft (not renewable/petrophysics)
4. Verify preview message is returned

### References

- EDIcraft Repository: `/EDIcraft-main/`
- Bedrock AgentCore Docs: https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html
- Minecraft Server: edicraft.nigelgardiner.com:49000
- OSDU Platform: Configured in EDI environment variables
