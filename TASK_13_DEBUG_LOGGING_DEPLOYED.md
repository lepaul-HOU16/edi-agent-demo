# Task 13: Enhanced Debug Logging Deployed

## Changes Made

I've added comprehensive debug logging to diagnose why the Minecraft environment isn't clearing:

### 1. Enhanced Logging in processMessage
- Added configuration check logging (host, port, password status)
- Added timing information (operation duration)
- Added detailed error logging with error codes and stack traces
- Returns error response instead of falling back silently

### 2. Enhanced Logging in connectRcon
- Added step-by-step connection logging
- Added detailed error categorization (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, EHOSTUNREACH, auth failures)
- Logs connection config details (host, port, password length, timeout)

### 3. Enhanced Logging in executeClearCommand
- Added command execution progress (1/4, 2/4, etc.)
- Added timing for each command
- Added results summary
- Logs disconnect process

## How to Diagnose

### Option 1: Watch Logs in Real-Time

1. **Start log watcher**:
   ```bash
   ./check-edicraft-logs.sh
   ```

2. **In another terminal, start localhost**:
   ```bash
   npm run dev
   ```

3. **Click the Clear button** in your browser at `http://localhost:3000/chat`

4. **Watch the logs** - you'll see exactly what's happening:
   - ✅ Connection attempt
   - ✅ Password loading
   - ✅ RCON commands
   - ❌ Or specific error with code

### Option 2: Check Logs After the Fact

```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --since 5m --format short | grep -i "edicraft\|rcon\|minecraft"
```

## What to Look For

### Success Pattern
```
[EDIcraft MCP Client] ⚡ Detected clear command, executing via RCON
[EDIcraft MCP Client] 🔌 Starting RCON connection process...
[EDIcraft MCP Client] 📡 Connecting to Minecraft server at edicraft.nigelgardiner.com:49001
[EDIcraft MCP Client] 🔄 Attempting connection...
[EDIcraft MCP Client] ✅ Successfully connected to Minecraft server via RCON
[EDIcraft MCP Client] 📤 [1/4] Executing: /fill -1000 0 -1000 1000 256 1000 air replace
[EDIcraft MCP Client] 📥 [1/4] Response (XXXms): ...
[EDIcraft MCP Client] ✅ All clear commands executed successfully
```

### Failure Patterns

**Connection Refused (Server Offline)**:
```
[EDIcraft MCP Client] ❌ Failed to connect to Minecraft server
Error code: ECONNREFUSED
```

**Timeout (Server Not Responding)**:
```
[EDIcraft MCP Client] ❌ Failed to connect to Minecraft server
Error code: ETIMEDOUT
```

**Authentication Failed (Wrong Password)**:
```
[EDIcraft MCP Client] ❌ Failed to connect to Minecraft server
Error: authentication failed
```

**DNS Resolution Failed (Wrong Hostname)**:
```
[EDIcraft MCP Client] ❌ Failed to connect to Minecraft server
Error code: ENOTFOUND
```

**Network Unreachable (Firewall/Network Issue)**:
```
[EDIcraft MCP Client] ❌ Failed to connect to Minecraft server
Error code: EHOSTUNREACH
```

## Next Steps

1. **Test the clear button again** on localhost
2. **Watch the logs** using the script above
3. **Share the error details** - the logs will now show exactly what's failing:
   - Is it connecting?
   - Is authentication working?
   - Are commands executing?
   - What's the actual error?

## Common Issues and Solutions

### Issue: ECONNREFUSED
**Cause**: Minecraft server is offline or RCON port is wrong
**Solution**: 
- Verify server is running
- Check RCON port is 49001
- Verify RCON is enabled in server.properties

### Issue: Authentication Failed
**Cause**: Wrong RCON password
**Solution**:
- Check password in Secrets Manager: `aws secretsmanager get-secret-value --secret-id minecraft/rcon-password`
- Update if wrong: `aws secretsmanager update-secret --secret-id minecraft/rcon-password --secret-string '{"password":"CORRECT_PASSWORD"}'`
- Redeploy: `cd cdk && npm run deploy`

### Issue: ETIMEDOUT
**Cause**: Server not responding or firewall blocking
**Solution**:
- Check server is accessible from Lambda (may need VPC configuration)
- Verify firewall rules allow Lambda to reach server
- Check security groups if server is in AWS

### Issue: ENOTFOUND
**Cause**: DNS can't resolve hostname
**Solution**:
- Verify hostname is correct: `edicraft.nigelgardiner.com`
- Check DNS is working
- Try using IP address instead

## Files Modified

1. `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` - Added comprehensive logging
2. `check-edicraft-logs.sh` - Created log watching script
3. `TASK_13_DEBUG_LOGGING_DEPLOYED.md` - This document

## Deployment

**Status**: ✅ Deployed successfully
**Time**: 12:30 PM EST
**Duration**: 80.15s

---

**Next**: Test the clear button and watch the logs to see exactly what's happening!
