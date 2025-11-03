# CRITICAL FIX: Wind Rose Visualization Not Displaying

## Problem
Wind rose returned message but no visualization displayed in UI.

## Root Cause
The simulation Lambda uses ZIP deployment from `simulation/` directory only. The visualization modules (`matplotlib_generator.py`, `folium_generator.py`, `visualization_config.py`) were in the parent `renewableTools/` directory and not included in the ZIP.

## Solution
Copied visualization modules into `simulation/` directory so they're included in ZIP deployment:

```bash
cp amplify/functions/renewableTools/matplotlib_generator.py amplify/functions/renewableTools/simulation/
cp amplify/functions/renewableTools/visualization_config.py amplify/functions/renewableTools/simulation/
cp amplify/functions/renewableTools/folium_generator.py amplify/functions/renewableTools/simulation/
```

## Files Modified
1. `amplify/functions/renewableTools/simulation/simple_handler.py` - Updated imports
2. Added `matplotlib_generator.py` to simulation directory
3. Added `visualization_config.py` to simulation directory
4. Added `folium_generator.py` to simulation directory

## Next Steps
1. **REDEPLOY:** Run `npx ampx sandbox` again to deploy with visualization modules
2. **TEST:** Run `./tests/test-wind-rose.sh` to verify PNG generation
3. **VERIFY:** Check that `visualizations.wind_rose` URL is present in response
4. **UI TEST:** Query "show me a wind rose for 35.067482, -101.395466" and verify chart displays

## Expected After Fix
```json
{
  "success": true,
  "type": "wind_rose_analysis",
  "data": {
    "visualizations": {
      "wind_rose": "https://bucket.s3.amazonaws.com/renewable/wind_rose/project-id/wind_rose.png"
    },
    "windRoseUrl": "https://bucket.s3.amazonaws.com/renewable/wind_rose/project-id/wind_rose.png"
  }
}
```

## Verification Commands

After redeployment:

```bash
# Test wind rose
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text) \
  --payload '{"action":"wind_rose","parameters":{"latitude":35.067482,"longitude":-101.395466,"project_id":"test"}}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/test-wind-rose.json

# Check for visualization URL
jq '.data.windRoseUrl' /tmp/test-wind-rose.json
# Should output: "https://...wind_rose.png" (not null)

# Check CloudWatch logs
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text) --since 1m | grep matplotlib
# Should output: "✅ Matplotlib generator loaded successfully"
```

## Why This Happened
The `resource.ts` file specifies:
```typescript
code: lambda.Code.fromAsset(join(__dirname))
```

This only includes files in the `simulation/` directory, not the parent directory. For ZIP deployments, all dependencies must be in the same directory.

## Prevention
For future Lambda functions using ZIP deployment:
1. Keep all dependencies in the same directory as the handler
2. OR use Lambda layers for shared code
3. OR use Docker deployment (which can access parent directories)
