# Clear Operation Troubleshooting - Next Steps

## Current Status

✅ **Reset works!** - Completes in ~10 seconds with time lock and teleport
❌ **Clear fails** - Background clear operation is failing

## What We Know

1. **Reset no longer times out** - Returns in ~10 seconds ✅
2. **Time lock works** - World locked to daytime ✅
3. **Teleport works** - Players moved to spawn ✅
4. **Clear fails in background** - Need to investigate why ❌

## Next Steps to Debug Clear

### 1. Check CloudWatch Logs

Look for these log messages in the Lambda function logs:

```
[DEMO_RESET] [BACKGROUND] Clear operation starting...
[DEMO_RESET] [BACKGROUND] Calling clear_minecraft_environment(area='all', preserve_terrain=True)
[DEMO_RESET] [BACKGROUND] Clear operation completed
[DEMO_RESET] [BACKGROUND] Result preview: ...
[DEMO_RESET] [BACKGROUND] ✅ Clear operation SUCCEEDED
```

Or error messages:

```
[DEMO_RESET] [BACKGROUND] ❌ Clear operation FAILED
[DEMO_RESET] [BACKGROUND] Full error: ...
[DEMO_RESET] [BACKGROUND] ❌ Clear operation exception: ...
[DEMO_RESET] [BACKGROUND] Traceback: ...
```

### 2. Common Clear Failure Causes

#### A. RCON Connection Issues
**Symptoms:**
- "Connection refused"
- "Connection timeout"
- "Authentication failed"

**Solutions:**
1. Verify Minecraft server is running
2. Check RCON is enabled in `server.properties`:
   ```
   enable-rcon=true
   rcon.port=49001
   rcon.password=ediagents@OSDU2025demo
   ```
3. Test RCON connection manually:
   ```bash
   telnet edicraft.nigelgardiner.com 49001
   ```

#### B. RCON Command Timeout
**Symptoms:**
- "Command timeout"
- "Operation timed out"
- Clear starts but never completes

**Solutions:**
1. Reduce clear region size in `config.py`:
   ```python
   self.clear_region = {
       'x1': -100,  # Smaller region
       'x2': 100,
       'z1': -100,
       'z2': 100,
       'y1': 60,
       'y2': 255
   }
   ```

2. Increase RCON timeout in `clear_environment_tool.py`:
   ```python
   executor = RCONExecutor(
       host=self.host,
       port=self.port,
       password=self.password,
       timeout=30,  # Increase from 10 to 30
       max_retries=3
   )
   ```

#### C. Server Performance Issues
**Symptoms:**
- Clear works sometimes, fails other times
- Server lag during clear
- "Server overloaded" errors

**Solutions:**
1. Reduce chunk size in RCONExecutor:
   ```python
   executor = RCONExecutor(
       ...
       chunk_size=16  # Reduce from 32 to 16
   )
   ```

2. Add delays between commands:
   ```python
   import time
   for block_type in self.wellbore_blocks:
       count, error = self._clear_block_type(executor, block_type)
       time.sleep(0.5)  # Wait 500ms between block types
   ```

#### D. Permission Issues
**Symptoms:**
- "Permission denied"
- "Insufficient privileges"
- Commands execute but don't work

**Solutions:**
1. Verify RCON user has operator permissions
2. Check server logs for permission errors
3. Ensure RCON password is correct

### 3. Test Clear Operation Separately

Try running clear as a standalone operation (not in reset):

```
Clear the Minecraft environment
```

This will help determine if:
- Clear works when not in background thread
- Issue is specific to threading
- Issue is with clear operation itself

### 4. Enhanced Logging

The code now includes detailed logging. After running reset, check logs for:

1. **Background thread started:**
   ```
   [DEMO_RESET] [THOUGHT] Clear operation initiated in background
   ```

2. **Clear operation progress:**
   ```
   [DEMO_RESET] [BACKGROUND] Clear operation starting...
   [DEMO_RESET] [BACKGROUND] Calling clear_minecraft_environment...
   ```

3. **Clear operation result:**
   ```
   [DEMO_RESET] [BACKGROUND] ✅ Clear operation SUCCEEDED
   ```
   or
   ```
   [DEMO_RESET] [BACKGROUND] ❌ Clear operation FAILED
   [DEMO_RESET] [BACKGROUND] Full error: [error details]
   ```

### 5. Temporary Workaround

If clear continues to fail, you can:

1. **Use reset for time lock + teleport** (works now!)
2. **Run clear separately** when needed:
   ```
   Clear the Minecraft environment
   ```

3. **Manual clear** in Minecraft console:
   ```
   /fill -250 60 -250 250 255 250 air replace
   ```

## What to Check Next

1. **CloudWatch Logs** - Look for background clear error messages
2. **RCON Connection** - Verify Minecraft server RCON is accessible
3. **Server Performance** - Check if server is under load
4. **Standalone Clear** - Test clear operation by itself

## Current Achievement

Even with clear failing, we've achieved:

✅ **Fast reset** - 10 seconds instead of timeout
✅ **Demo-ready** - Time locked, players at spawn
✅ **No blocking** - Clear doesn't block response
✅ **Detailed feedback** - User knows what worked

**This is significant progress!** The reset is now usable for demos even if clear needs manual intervention.

## Files to Check

1. `edicraft-agent/tools/workflow_tools.py` - Background clear implementation
2. `edicraft-agent/tools/clear_environment_tool.py` - Clear operation logic
3. `edicraft-agent/tools/rcon_executor.py` - RCON command execution
4. `edicraft-agent/config.py` - Configuration settings

## Next Action

**Check CloudWatch logs** for the background clear error messages to determine the specific failure cause.
