# Horizon Build Fix - Deployment Instructions

## Problem
The horizon build fix was implemented in the code but is still failing because the Python agent code hasn't been deployed to Bedrock AgentCore.

## Architecture Understanding

The EDIcraft system has this architecture:

```
User Request
    ↓
TypeScript Lambda Handler (amplify/functions/edicraftAgent/handler.ts)
    ↓
Bedrock AgentCore Client (mcpClient.ts)
    ↓
Bedrock AgentCore Service (AWS)
    ↓
Python Agent Code (edicraft-agent/agent.py + tools/)
```

**Key Point:** The Python code in `edicraft-agent/` is deployed to Bedrock AgentCore, NOT to the Lambda function. Changes to Python files require redeploying to Bedrock AgentCore.

## Deployment Steps

### 1. Navigate to edicraft-agent directory
```bash
cd edicraft-agent
```

### 2. Ensure virtual environment is set up
```bash
make install
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Configure the agent

### 3. Deploy the updated Python code to Bedrock AgentCore
```bash
make deploy
```

This will:
- Package the updated Python code (including workflow_tools.py changes)
- Deploy to Bedrock AgentCore
- Update the agent with new environment variables

**Expected output:**
```
Deploying agent to Bedrock AgentCore...
✅ Agent deployed successfully
Agent ID: edicraft-kl1b6iGNug
Agent Alias: TSTALIASID
```

### 4. Verify deployment
```bash
# Test with a simple command
make invoke "list players"
```

### 5. Test the horizon fix
Go back to the UI and try:
```
Build horizon surface
```

## What Changed

The fix modified `edicraft-agent/tools/workflow_tools.py`:

**Before:**
```python
horizon_id = horizon_name or "default-horizon"  # ❌ Invalid
```

**After:**
```python
# Search for real horizons and use first available
horizons_data = json.loads(horizons_result)
available_horizons = horizons_data.get("horizons", [])
horizon_id = available_horizons[0]["id"]  # ✅ Valid OSDU ID
```

## Troubleshooting

### If deployment fails with "agent not found"
```bash
# Reconfigure the agent
cd edicraft-agent
source venv/bin/activate
agentcore configure --non-interactive --entrypoint agent.py --name edicraft --requirements-file requirements.txt --disable-otel
make deploy
```

### If deployment succeeds but still getting old error
1. Check CloudWatch logs to see if the new code is running:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--edicraftAgentlambda7CFEC-wKZ7d8sM6xk4 --follow
```

2. Look for the log message:
```
[WORKFLOW] Using first available horizon: osdu:wks:...
```

If you see this, the new code is deployed. If you still see "default-horizon", the deployment didn't work.

### If you see "No horizons found"
This means the OSDU platform doesn't have any horizon records. You'll need to:
1. Check if horizon data exists in OSDU
2. Verify OSDU credentials are correct
3. Check the data partition is correct

## Verification Checklist

After deployment, verify:

- [ ] `make deploy` completed successfully
- [ ] No errors in deployment output
- [ ] Test command works: `make invoke "list players"`
- [ ] CloudWatch logs show new code running
- [ ] Horizon build command works in UI
- [ ] No more "default-horizon" errors

## Quick Reference

```bash
# Full deployment workflow
cd edicraft-agent
make install          # One-time setup
make deploy           # Deploy Python code changes
cd ..                 # Back to project root

# Test in UI
"Build horizon surface"
```

## Important Notes

1. **Amplify sandbox restart is NOT enough** - It only redeploys the TypeScript Lambda handler, not the Python agent code in Bedrock AgentCore.

2. **Python code changes require `make deploy`** - Any changes to files in `edicraft-agent/` (agent.py, tools/*.py) need to be deployed to Bedrock AgentCore.

3. **TypeScript changes need sandbox restart** - Changes to `amplify/functions/edicraftAgent/*.ts` need `npx ampx sandbox` restart.

4. **Both may be needed** - If you change both TypeScript and Python code, you need both:
   ```bash
   # Deploy Python changes
   cd edicraft-agent && make deploy && cd ..
   
   # Restart sandbox for TypeScript changes
   # (Ctrl+C in sandbox terminal, then)
   npx ampx sandbox
   ```

## Expected Behavior After Fix

**User Input:** "Build horizon surface"

**System Behavior:**
1. Searches OSDU for available horizons
2. Selects first available horizon (not "default-horizon")
3. Downloads horizon data
4. Converts to Minecraft coordinates
5. Builds surface in Minecraft

**Success Response:**
```
✅ Horizon Surface Built Successfully

Details:
- Horizon: SeismicHorizon-abc123
- Data Points: 1,247
- Status: Complete

Visualization:
The horizon surface has been visualized in Minecraft...
```

## Next Steps

1. Run `cd edicraft-agent && make deploy`
2. Wait for deployment to complete
3. Test: "Build horizon surface"
4. Verify no more "default-horizon" errors
