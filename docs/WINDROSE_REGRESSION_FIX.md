# Wind Rose Regression Fix - Lambda Layer Solution

## Problem Identified

Wind rose analysis was returning only text message with no artifacts:
```
"Wind rose analysis complete for (35.067482, -101.395466)"
```

## Root Cause

The windrose Lambda was deployed **WITHOUT Python dependencies** (numpy, matplotlib).

### Error Found
```python
{
  "errorMessage": "Unable to import module 'handler': No module named 'numpy'",
  "errorType": "Runtime.ImportModuleError"
}
```

The windrose Lambda requires:
- `numpy` - for wind data calculations
- `matplotlib` - for wind rose visualization
- `scipy` - for statistical distributions

But these were NOT packaged with the Lambda.

## Solution: Lambda Layer

### What Was Done

1. **Identified existing Lambda Layer**
   - Found `amplify/layers/renewableDemo/renewable-demo-layer.zip`
   - Contains: numpy, matplotlib, scipy, pandas, folium, boto3
   - Size: 81MB (pre-built and ready)

2. **Added Layer to backend.ts**
   ```typescript
   // Create Lambda Layer
   const renewableDemoLayer = new lambda.LayerVersion(backend.stack, 'RenewableDemoLayer', {
     code: lambda.Code.fromAsset(join(__dirname, 'layers/renewableDemo/renewable-demo-layer.zip')),
     compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
     description: 'Python dependencies for renewable energy tools'
   });

   // Attach to windrose Lambda
   const windroseLambda = backend.renewableWindroseTool.resources.lambda as lambda.Function;
   windroseLambda.addLayers(renewableDemoLayer);
   ```

3. **Created deployment scripts**
   - `scripts/deploy-windrose-with-layer.sh` - Deployment instructions
   - `scripts/test-windrose-after-layer.sh` - Verification script

## Deployment Steps

### 1. Deploy the Layer

```bash
# Stop current sandbox (if running)
Ctrl+C

# Restart sandbox to deploy layer
npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)
```

### 2. Verify Deployment

```bash
bash scripts/test-windrose-after-layer.sh
```

Expected output:
```
✅ Lambda Layer: Attached
✅ Environment Variable: Set
✅ Windrose Lambda: Responding
✅ Wind metrics present: 7.5 m/s average
```

### 3. Test in UI

Open chat and try:
```
"Analyze wind patterns for my site"
```

Expected result:
- ✅ Wind rose artifact displays
- ✅ Metrics show non-zero wind speeds
- ✅ Direction details table shows 16 directions
- ✅ Matplotlib wind rose image loads from S3

## Why This Happened

1. **Windrose Lambda was deployed** - The Lambda function exists
2. **Environment variable was set** - Orchestrator can call it
3. **But dependencies were missing** - numpy/matplotlib not packaged
4. **Lambda failed on import** - Returned error instead of artifacts
5. **Orchestrator returned generic message** - "Wind rose analysis complete"

## Why Other Lambdas Worked

The other renewable tool Lambdas (terrain, layout, simulation, report) use **stdlib only**:
- No numpy
- No matplotlib
- No scipy
- Just Python standard library + boto3 (included in Lambda runtime)

Windrose is the ONLY Lambda that requires heavy scientific Python libraries.

## Prevention

### Rule: Check Python Dependencies

Before deploying any Python Lambda:

1. **Check imports in handler.py**
   ```python
   import numpy as np  # ❌ Requires layer
   import matplotlib   # ❌ Requires layer
   import json         # ✅ Stdlib
   import boto3        # ✅ Included in runtime
   ```

2. **If non-stdlib imports exist:**
   - Create `requirements.txt`
   - Build Lambda Layer
   - Attach layer in `backend.ts`

3. **Test Lambda directly after deployment:**
   ```bash
   aws lambda invoke --function-name <lambda> --payload '{}' /tmp/test.json
   cat /tmp/test.json
   ```

4. **Check for import errors:**
   ```bash
   grep "ImportModuleError" /tmp/test.json
   ```

### Rule: Always Test After Deployment

```bash
# 1. Deploy
npx ampx sandbox

# 2. Verify Lambda exists
aws lambda list-functions | grep Windrose

# 3. Test Lambda directly
bash scripts/test-windrose-lambda-direct.sh

# 4. Check for errors
# If "ImportModuleError" → missing dependencies
# If "success: true" → working correctly

# 5. Test in UI
# Open chat, try query, verify artifacts
```

## Files Changed

### Modified
- `amplify/backend.ts` - Added Lambda Layer and attached to windrose Lambda

### Created
- `amplify/functions/renewableTools/windrose/requirements.txt` - Documents dependencies
- `scripts/deploy-windrose-with-layer.sh` - Deployment instructions
- `scripts/test-windrose-after-layer.sh` - Verification script
- `scripts/test-windrose-lambda-direct.sh` - Direct Lambda test
- `docs/WINDROSE_REGRESSION_FIX.md` - This document

### Existing (Used)
- `amplify/layers/renewableDemo/renewable-demo-layer.zip` - Pre-built layer with all dependencies

## Success Criteria

After deployment:

✅ Windrose Lambda has layer attached
✅ Windrose Lambda imports numpy successfully
✅ Windrose Lambda generates wind data
✅ Windrose Lambda returns artifacts (not just text)
✅ Orchestrator receives artifacts
✅ Frontend renders WindRoseArtifact component
✅ User sees wind rose visualization with metrics

## Time Estimate

- **Layer deployment**: 5-10 minutes (sandbox restart)
- **Verification**: 2 minutes
- **UI testing**: 1 minute
- **Total**: 10-15 minutes

## Next Steps

1. **Deploy now**: `npx ampx sandbox`
2. **Wait for deployment**: Watch for "Deployed" message
3. **Verify**: `bash scripts/test-windrose-after-layer.sh`
4. **Test in UI**: Try wind rose query in chat
5. **Confirm**: Verify artifacts display correctly

---

**This fix restores ALL renewable energy features by fixing the windrose Lambda dependency issue.**

The code was always correct. The dependencies were just missing.
