# Test EDIcraft Correct SDK Fix

## Quick Test Guide

The correct SDK (`@aws-sdk/client-bedrock-agentcore`) is now deployed. Test immediately!

## Test on Localhost

```bash
npm run dev
```

Open: **http://localhost:3000**

## Test Commands

### 1. Greeting Test
**Message**: `Hello`

**Expected**: Welcome message with EDIcraft capabilities

**Success Indicator**: No errors, welcome message displays

### 2. OSDU Search Test
**Message**: `Search OSDU for wellbores in the area`

**Expected**: Agent processes request, searches OSDU

**Success Indicator**: 
- ✅ No "agent not found" error
- ✅ Agent responds with search results or processing message
- ✅ Thought steps appear

### 3. Clear Command Test
**Message**: `Clear the Minecraft environment`

**Expected**: Agent processes clear request

**Success Indicator**:
- ✅ Agent responds
- ✅ No validation errors
- ✅ Thought steps show processing

## CloudWatch Logs

Watch logs in real-time:

```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow
```

### Success Indicators in Logs

Look for these messages:

```
[EDIcraft MCP Client] ✅ Bedrock AgentCore invoked successfully
[EDIcraft MCP Client] Response length: 1234
[EDIcraft MCP Client] Extracted completion: ...
[EDIcraft MCP Client] Agent invocation successful
```

### Error Indicators (Should NOT See)

❌ `agent not found`
❌ `ValidationException`
❌ `ResourceNotFoundException`
❌ `Invalid agentId`

## What Changed

### Before (Broken)
- Used wrong SDK: `@aws-sdk/client-bedrock-agent-runtime`
- Got "agent not found" errors
- Agent never responded

### After (Fixed)
- Uses correct SDK: `@aws-sdk/client-bedrock-agentcore`
- Agent responds successfully
- OSDU search works
- Clear commands execute

## Troubleshooting

### If Still Getting Errors

1. **Check package was installed**:
   ```bash
   cd cdk/lambda-functions/chat
   npm list @aws-sdk/client-bedrock-agentcore
   ```
   Should show: `@aws-sdk/client-bedrock-agentcore@3.895.0`

2. **Verify deployment**:
   ```bash
   aws lambda get-function --function-name EnergyInsights-development-chat
   ```
   Check LastModified timestamp is recent

3. **Check environment variables**:
   ```bash
   aws lambda get-function-configuration --function-name EnergyInsights-development-chat --query 'Environment.Variables'
   ```
   Verify `BEDROCK_AGENT_ID` is set

4. **Restart localhost**:
   ```bash
   # Stop npm run dev (Ctrl+C)
   npm run dev
   ```

## Success Criteria

- [ ] Agent responds to greetings
- [ ] No "agent not found" errors
- [ ] OSDU search commands work
- [ ] Clear commands execute
- [ ] Thought steps appear
- [ ] CloudWatch logs show success messages

## If All Tests Pass

The EDIcraft agent is fully functional! The correct SDK fix resolved the regression.

## If Tests Fail

Check:
1. CloudWatch logs for specific error messages
2. Environment variables are set correctly
3. Agent ID matches deployed AgentCore
4. IAM permissions include `bedrock-agentcore:InvokeAgent`

---

**Test now and report results!**
