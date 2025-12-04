# EDIcraft Clear Functionality Investigation

## Status: Ready for Testing

### Issue Summary
Wellbore clearing shows success messages but blocks never actually disappear in Minecraft. This indicates an RCON command execution problem.

### What We Fixed Previously
✅ Bedrock Agent Core ID configured correctly
✅ Lambda environment variables updated
✅ Backend deployed with correct configuration

### Current Investigation Focus
The clear operation uses RCON commands to remove blocks from Minecraft. The code shows:

1. **Clear Process**:
   - Divides region into 32x32 horizontal chunks
   - Clears each chunk in 32-block vertical slices (32x32x32 = 32,768 blocks per command)
   - Uses simple `fill` commands: `fill x1 y1 z1 x2 y2 z2 air`
   - Optionally restores ground level with dirt

2. **RCON Execution**:
   - Commands sent via RCON protocol to Minecraft server
   - Includes retry logic (3 attempts with exponential backoff)
   - Timeout handling (30 seconds per chunk)
   - Response parsing to verify success

3. **Success Detection**:
   - Parses response for "filled X blocks" or "successfully"
   - **CRITICAL**: Empty response = success for setblock commands
   - Tracks blocks affected for reporting

### Potential Issues

#### 1. RCON Connection
- **Symptom**: Success messages but no actual clearing
- **Possible Cause**: RCON commands not reaching Minecraft server
- **Check**: Verify RCON is enabled in server.properties
- **Check**: Verify RCON credentials are correct in Secrets Manager

#### 2. Command Execution
- **Symptom**: Commands sent but not executed
- **Possible Cause**: Minecraft server not processing commands
- **Check**: Server logs for RCON activity
- **Check**: Server TPS (ticks per second) - low TPS = lag

#### 3. Response Parsing
- **Symptom**: False positive success detection
- **Possible Cause**: Empty responses interpreted as success
- **Check**: Actual RCON responses in logs
- **Check**: `_is_success_response()` logic

#### 4. Credentials/Permissions
- **Symptom**: Commands rejected silently
- **Possible Cause**: RCON password incorrect or permissions insufficient
- **Check**: Secrets Manager has correct RCON password
- **Check**: RCON user has operator permissions

### Testing Plan

#### Test 1: Verify RCON Connection
```bash
# Check if RCON is enabled on Minecraft server
# Look for: enable-rcon=true, rcon.port=25575, rcon.password=<password>
```

#### Test 2: Test Direct RCON Command
```bash
# Use test-edicraft-rcon-connection.js to verify RCON works
node test-edicraft-rcon-connection.js
```

#### Test 3: Check Lambda Logs
```bash
# Look for RCON command execution and responses
aws logs tail /aws/lambda/EnergyInsights-ChatLambda-development --follow
```

#### Test 4: Test Clear on Localhost
```bash
# Start dev server with network access
npm run dev

# Access from iPad at: http://<your-computer-ip>:3000
# Navigate to EDIcraft agent
# Try clearing wellbore
# Check Minecraft server for actual block removal
```

### Network Access Configuration

✅ **Vite config updated** to allow iPad testing:
- Added `host: '0.0.0.0'` to server config
- Dev server now accessible from network devices
- Access from iPad: `http://<your-computer-ip>:3000`

### Next Steps

1. **Start dev server**: `npm run dev`
2. **Find your computer's IP**: 
   - Mac: System Preferences → Network
   - Or run: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. **Access from iPad**: `http://<your-ip>:3000`
4. **Test clear functionality**:
   - Navigate to EDIcraft agent
   - Try clearing a wellbore
   - Check if blocks actually disappear in Minecraft
5. **Check logs** for RCON activity and responses

### Debug Logging

The code includes extensive logging:
- RCON connection attempts
- Command execution with responses
- Chunk processing progress
- Performance metrics
- Error categorization

Check CloudWatch logs for detailed execution traces.

### Files Involved

- `edicraft-agent/tools/clear_environment_tool.py` - Main clear logic
- `edicraft-agent/tools/rcon_executor.py` - RCON command execution
- `cdk/lambda-functions/chat/agents/edicraftAgent.ts` - Agent handler
- `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` - MCP client
- `vite.config.ts` - Dev server configuration (updated for network access)

### Hypothesis

Most likely issue: **RCON credentials or connection problem**
- Commands are being sent
- Responses indicate "success"
- But actual execution not happening
- Suggests authentication or connection issue

**Test this first**: Verify RCON password in Secrets Manager matches Minecraft server.properties
