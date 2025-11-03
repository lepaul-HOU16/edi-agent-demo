# Wind Rose Deployment Issue - Root Cause Analysis

## Problem Statement

Wind rose analysis returns only a text message with no artifacts:
```
"Wind rose analysis complete for (35.067482, -101.395466)"
```

This is a **REGRESSION** - terrain analysis previously worked, now renewable features are broken.

## Root Cause

The windrose Lambda function EXISTS but the orchestrator's environment variable `RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME` is **NOT SET**.

### Current State

```bash
✅ Windrose Lambda: amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH
✅ Orchestrator Lambda: amplify-digitalassistant--renewableOrchestratorlam-RFITIc9ID5Si
❌ Environment Variable: RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME = NOT SET
```

### Expected State

```bash
✅ Windrose Lambda: amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH
✅ Orchestrator Lambda: amplify-digitalassistant--renewableOrchestratorlam-RFITIc9ID5Si
✅ Environment Variable: RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME = amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH
```

## Why This Happened

The `amplify/backend.ts` file has the correct configuration:

```typescript
backend.renewableOrchestrator.addEnvironment(
  'RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME',
  backend.renewableWindroseTool.resources.lambda.functionName
);
```

However, the **deployment has not picked up this change**. This happens when:

1. Code changes are made to `backend.ts`
2. Sandbox is not restarted to apply the changes
3. The orchestrator Lambda continues running with old environment variables

## Impact

**ALL renewable energy features are now broken** because:

1. Wind rose: Environment variable not set → orchestrator can't call windrose Lambda
2. Terrain: May have similar environment variable issues
3. Layout: May have similar environment variable issues
4. Simulation: May have similar environment variable issues
5. Report: May have similar environment variable issues

This is a **cascading failure** where one missing environment variable breaks the entire renewable energy system.

## Solution

### Immediate Fix (Manual)

Set the environment variable manually:

```bash
# Get the windrose Lambda name
WINDROSE_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Windrose')].FunctionName" --output text)

# Get the orchestrator Lambda name
ORCHESTRATOR_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

# Update the orchestrator environment variable
aws lambda update-function-configuration \
  --function-name "$ORCHESTRATOR_LAMBDA" \
  --environment "Variables={
    RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME=$WINDROSE_LAMBDA,
    RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=$(aws lambda list-functions --query \"Functions[?contains(FunctionName, 'Terrain')].FunctionName\" --output text),
    RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME=$(aws lambda list-functions --query \"Functions[?contains(FunctionName, 'Layout')].FunctionName\" --output text),
    RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME=$(aws lambda list-functions --query \"Functions[?contains(FunctionName, 'Simulation')].FunctionName\" --output text),
    RENEWABLE_REPORT_TOOL_FUNCTION_NAME=$(aws lambda list-functions --query \"Functions[?contains(FunctionName, 'Report')].FunctionName\" --output text),
    RENEWABLE_S3_BUCKET=$(aws s3 ls | grep renewable | awk '{print $3}')
  }"
```

### Proper Fix (Redeploy)

Restart the Amplify sandbox to apply all backend.ts changes:

```bash
# Stop current sandbox (Ctrl+C)
# Then restart:
npx ampx sandbox
```

This will:
1. Read the updated `backend.ts` configuration
2. Deploy all environment variable changes
3. Update the orchestrator Lambda with correct environment variables
4. Restore renewable energy functionality

## Verification

After applying the fix, verify with:

```bash
node tests/verify-windrose-deployment.js
```

Expected output:
```
✅ Orchestrator Deployed
✅ Wind Rose Lambda Deployed
✅ Orchestrator Has Windrose Env Var
```

Then test the complete flow:

```bash
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)
node tests/test-windrose-complete-flow.js
```

## Prevention

To prevent this regression in the future:

1. **Always restart sandbox after backend.ts changes**
2. **Verify environment variables after deployment**
3. **Run deployment verification tests**
4. **Document environment variable dependencies**

## Related Files

- `amplify/backend.ts` - Backend configuration (CORRECT)
- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator code (CORRECT)
- `amplify/functions/renewableTools/windrose/resource.ts` - Windrose Lambda definition (CORRECT)
- `amplify/functions/renewableTools/windrose/handler.py` - Windrose implementation (CORRECT)

**The code is correct. The deployment is stale.**

## Task Status

This is Task 5 of the wind rose implementation:
- ✅ Task 1: Create windrose Lambda function
- ✅ Task 2: Wire windrose Lambda to orchestrator
- ✅ Task 3: Create WindRoseArtifact component
- ✅ Task 4: Add wind_rose artifact rendering to ChatMessage
- ⚠️  Task 5: Test complete wind rose flow - **BLOCKED BY DEPLOYMENT**

**Action Required**: Redeploy sandbox to apply environment variable changes.
