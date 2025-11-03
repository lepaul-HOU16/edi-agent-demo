# How to Check CloudWatch Logs for EDIcraft Agent

## Quick Access Methods

### Method 1: AWS Console (Web Browser)

1. **Open AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Sign in to your AWS account

2. **Navigate to CloudWatch**
   - Search for "CloudWatch" in the top search bar
   - Click on "CloudWatch" service

3. **Find Lambda Logs**
   - In left sidebar, click "Logs" → "Log groups"
   - Search for: `edicraftAgent` or `/aws/lambda/edicraftAgent`
   - Click on the log group

4. **View Recent Logs**
   - Click on the most recent log stream (top of list)
   - Scroll through logs to find messages starting with `[DEMO_RESET]`

5. **Search for Specific Messages**
   - Click "Search log group" button
   - Search for: `[DEMO_RESET] [BACKGROUND]`
   - Look for error messages

### Method 2: AWS CLI (Command Line)

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/edicraftAgent"

# Get recent logs (last 10 minutes)
aws logs tail /aws/lambda/edicraftAgent-<your-function-suffix> --follow --since 10m

# Search for specific messages
aws logs filter-log-events \
  --log-group-name "/aws/lambda/edicraftAgent-<your-function-suffix>" \
  --filter-pattern "[DEMO_RESET] [BACKGROUND]" \
  --start-time $(date -u -d '10 minutes ago' +%s)000
```

### Method 3: Amplify Sandbox Logs (If Running Locally)

If you're running `npx ampx sandbox`, the logs should appear in your terminal:

```bash
# In your terminal where sandbox is running, look for:
[DEMO_RESET] [BACKGROUND] Clear operation starting...
[DEMO_RESET] [BACKGROUND] ❌ Clear operation FAILED
[DEMO_RESET] [BACKGROUND] Full error: ...
```

## What to Look For

### Success Messages
```
[DEMO_RESET] [BACKGROUND] Clear operation starting...
[DEMO_RESET] [BACKGROUND] Calling clear_minecraft_environment(area='all', preserve_terrain=True)
[DEMO_RESET] [BACKGROUND] Clear operation completed
[DEMO_RESET] [BACKGROUND] ✅ Clear operation SUCCEEDED
```

### Error Messages
```
[DEMO_RESET] [BACKGROUND] ❌ Clear operation FAILED
[DEMO_RESET] [BACKGROUND] Full error: [THIS IS THE ERROR WE NEED]
```

Or:

```
[DEMO_RESET] [BACKGROUND] ❌ Clear operation exception: [THIS IS THE ERROR WE NEED]
[DEMO_RESET] [BACKGROUND] Traceback: [THIS SHOWS WHERE IT FAILED]
```

## Common Error Patterns

### RCON Connection Error
```
Full error: ❌ Connection Error
Failed to connect to Minecraft server: [Errno 111] Connection refused
```
**Solution**: Check Minecraft server is running and RCON is enabled

### RCON Timeout
```
Full error: ❌ RCON Command Timeout
Command timed out after 10 seconds
```
**Solution**: Increase timeout or reduce clear region size

### Authentication Error
```
Full error: ❌ Authentication Failed
RCON authentication failed: Invalid password
```
**Solution**: Check RCON password in environment variables

### Permission Error
```
Full error: ❌ Permission Denied
Insufficient privileges to execute command
```
**Solution**: Ensure RCON user has operator permissions

## Quick Debugging Steps

### 1. Check if Sandbox is Running
```bash
# Look for this process
ps aux | grep "ampx sandbox"
```

### 2. Check Lambda Function Exists
```bash
aws lambda list-functions | grep edicraftAgent
```

### 3. Get Latest Log Stream
```bash
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/edicraftAgent-<suffix>" \
  --order-by LastEventTime \
  --descending \
  --max-items 1
```

### 4. Tail Logs in Real-Time
```bash
# Replace <suffix> with your actual function suffix
aws logs tail /aws/lambda/edicraftAgent-<suffix> --follow
```

Then trigger the reset and watch logs appear in real-time.

## Finding Your Lambda Function Name

### Option 1: AWS Console
1. Go to Lambda service
2. Search for "edicraft"
3. Note the full function name (e.g., `edicraftAgent-abc123def456`)

### Option 2: AWS CLI
```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName"
```

### Option 3: Amplify Outputs
```bash
cat amplify_outputs.json | grep -A 5 "edicraftAgent"
```

## What to Share

Once you find the logs, share:

1. **The error message:**
   ```
   [DEMO_RESET] [BACKGROUND] Full error: [COPY THIS]
   ```

2. **The traceback (if present):**
   ```
   [DEMO_RESET] [BACKGROUND] Traceback: [COPY THIS]
   ```

3. **Any RCON-related errors:**
   ```
   [CLEAR] Error in clear operation: [COPY THIS]
   ```

## Alternative: Test Clear Directly

Instead of checking logs, you can test the clear operation directly:

1. **In EDIcraft chat, type:**
   ```
   Clear the Minecraft environment
   ```

2. **This will:**
   - Run clear in foreground (not background)
   - Show the error message directly in the response
   - Help us see what's failing

This is often faster than checking CloudWatch logs!

## Summary

**Easiest method:**
1. Type "Clear the Minecraft environment" in EDIcraft chat
2. See the error message directly in the response
3. Share that error message

**Or check logs:**
1. AWS Console → CloudWatch → Log groups → edicraftAgent
2. Look for `[DEMO_RESET] [BACKGROUND]` messages
3. Find the error message
4. Share it

Let me know what error you see and we can fix it!
