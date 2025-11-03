# IMMEDIATE FIX FOR WIND ROSE

## Problem
The Docker-based simulation Lambda is broken (`Runtime.InvalidEntrypoint`).
But there's a working Lambda: `renewable-simulation-simple`

## Quick Fix

Update the orchestrator to use the working Lambda:

```bash
# Update environment variable to point to working Lambda
aws lambda update-function-configuration \
  --function-name amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE \
  --environment "Variables={
    S3_BUCKET=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,
    RENEWABLE_AWS_REGION=us-east-1,
    RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=amplify-digitalassistant--RenewableTerrainToolFBBF-T9MqkWlRCCpJ,
    AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME=ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE,
    SESSION_CONTEXT_TABLE=RenewableSessionContext,
    RENEWABLE_REPORT_TOOL_FUNCTION_NAME=amplify-digitalassistant--RenewableReportToolB3B5E-JRhfq69yq1WC,
    AMPLIFY_SSM_ENV_CONFIG={},
    RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME=renewable-simulation-simple,
    RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME=amplify-digitalassistant--RenewableLayoutTool14B26-KSWfrukjyOvG,
    RENEWABLE_S3_BUCKET=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,
    AWS_LOCATION_PLACE_INDEX=RenewableProjectPlaceIndex
  }"
```

## Test After Fix

```bash
# Test wind rose query
# In browser: "show me a wind rose for 35.067482, -101.395466"
```

## Why This Works

- `renewable-simulation-simple` has `Runtime: python3.12` (working)
- `amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0` has `Runtime: None` (broken)

## Proper Fix (Later)

The Docker Lambda needs to be fixed:

1. Check Dockerfile COPY paths
2. Ensure handler.py is in correct location
3. Rebuild Docker image
4. Redeploy via sandbox

But for now, use the working Lambda.
