# EDIcraft Debug Status

## Current Situation
The Lambda function HAS the correct environment variables (verified via AWS CLI), but the handler is still reporting them as missing.

## Verified Facts
✅ Lambda environment variables ARE set correctly:
```json
{
  "BEDROCK_AGENT_ID": "edicraft-kl1b6iGNug",
  "BEDROCK_AGENT_ALIAS_ID": "TSTALIASID",
  "MINECRAFT_RCON_PASSWORD": "ediagents@OSDU2025demo"
}
```

✅ Backend.ts has correct default values
✅ Resource.ts has correct hardcoded values

## Possible Causes

### 1. Lambda Version Mismatch
The deployed Lambda might be an old version that hasn't been updated yet.

**Check:** CloudWatch logs should show the new debug logging we just added

### 2. AppSync Resolver Issue
The handler might be invoked through AppSync which could be caching or using an old version.

**Check:** Look for `[ENV CHECK]` logs in CloudWatch

### 3. Process.env Not Populated
Something might be preventing `process.env` from being populated correctly in the Lambda runtime.

**Check:** The debug logs will show if `process.env.BEDROCK_AGENT_ID` is actually undefined

## Debug Logging Added
Added logging to `handler.ts` validation function:
```typescript
console.log(`[ENV CHECK] ${varName}: "${value}" (type: ${typeof value}, empty: ${!value || value.trim() === ''})`);
```

## Next Steps

### 1. Wait for Sandbox Redeploy
The sandbox should automatically redeploy with the new debug logging.

### 2. Test Again
Send a message to EDIcraft agent (not a greeting).

### 3. Check CloudWatch Logs
Look for logs like:
```
[ENV CHECK] BEDROCK_AGENT_ID: "edicraft-kl1b6iGNug" (type: string, empty: false)
[ENV CHECK] BEDROCK_AGENT_ALIAS_ID: "TSTALIASID" (type: string, empty: false)
[ENV CHECK] MINECRAFT_RCON_PASSWORD: "ediagents@OSDU2025demo" (type: string, empty: false)
```

### 4. Analyze Results

**If logs show values are present:**
- The validation logic has a bug
- Need to fix the validation condition

**If logs show values are undefined:**
- Lambda runtime issue
- Need to investigate why process.env isn't populated

**If no logs appear:**
- Old Lambda version still running
- Need to force redeploy or restart sandbox

## CloudWatch Log Group
```
/aws/lambda/amplify-digitalassistant--edicraftAgentlambda7CFEC-Htop05oxS9bk
```

## Commands to Check Logs
```bash
# Tail logs
aws logs tail /aws/lambda/amplify-digitalassistant--edicraftAgentlambda7CFEC-Htop05oxS9bk --follow

# Search for ENV CHECK
aws logs filter-log-events \
  --log-group-name /aws/lambda/amplify-digitalassistant--edicraftAgentlambda7CFEC-Htop05oxS9bk \
  --filter-pattern "[ENV CHECK]" \
  --max-items 20
```

## Files Modified
- `amplify/functions/edicraftAgent/handler.ts` - Added debug logging
- `amplify/backend.ts` - Updated default values (already done)
- `amplify/functions/edicraftAgent/resource.ts` - Has hardcoded values (already done)

## Status
🔍 **DEBUGGING** - Waiting for logs to identify root cause
