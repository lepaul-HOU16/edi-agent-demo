# Deployment Guide: Wind Rose Feature

## Changes Made

### 1. Updated `amplify/functions/renewableTools/simulation/simple_handler.py`
- ✅ Added matplotlib_generator import
- ✅ Enhanced wind_rose action handler to use ORIGINAL matplotlib visualization
- ✅ Generate wind rose PNG using `MatplotlibChartGenerator.create_wind_rose()`
- ✅ Save PNG to S3
- ✅ Return S3 URL in response

### 2. Created Test Script
- ✅ `tests/test-wind-rose.sh` - Comprehensive wind rose testing

## CRITICAL: Visualization Modules Fix

**BEFORE DEPLOYING:** The visualization modules have been copied into the simulation directory to fix the "No module named 'matplotlib_generator'" error.

**Files Added:**
- `amplify/functions/renewableTools/simulation/matplotlib_generator.py`
- `amplify/functions/renewableTools/simulation/visualization_config.py`
- `amplify/functions/renewableTools/simulation/folium_generator.py`

These files are now included in the ZIP deployment.

## Deployment Steps

### Step 1: Deploy to Sandbox

**IMPORTANT:** You must run this command manually in your terminal:

```bash
npx ampx sandbox
```

**Wait for:** "Deployed" message (may take 5-10 minutes)

**Note:** This deployment includes the visualization module fix

### Step 2: Verify Deployment

After sandbox is deployed, run:

```bash
# Check Lambda function exists
aws lambda list-functions | grep RenewableSimulationTool

# Check environment variables
SIMULATION_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)
aws lambda get-function-configuration --function-name "$SIMULATION_FUNCTION" --query "Environment.Variables"
```

### Step 3: Run Wind Rose Tests

```bash
./tests/test-wind-rose.sh
```

**Expected Output:**
- ✓ Wind rose analysis successful
- ✓ Wind rose visualization URL generated
- ✓ Wind rose visualization is accessible
- ✓ Average wind speed is reasonable
- ✓ Direction count is correct (16 directions)
- ✓ Response has project ID
- ✓ Response has coordinates
- ✓ Response has wind statistics

### Step 4: Test in UI

1. Open chat interface
2. Enter query: "show me a wind rose for 35.067482, -101.395466"
3. Verify:
   - Wind rose chart displays
   - Statistics are shown
   - No errors in console

### Step 5: Run Regression Tests

**CRITICAL:** Verify existing features still work:

```bash
# Test terrain (should still show 170 features)
./tests/test-renewable-baseline.sh

# Or test individually
aws lambda invoke \
  --function-name amplify-digitalassistant--RenewableTerrainToolFBBF-WH2Gs9R2lgfP \
  --payload '{"parameters":{"latitude":35.067482,"longitude":-101.395466,"radius_km":5,"project_id":"regression-test"}}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/terrain-regression.json

# Check feature count
jq '.data.metrics.totalFeatures' /tmp/terrain-regression.json
# Should output: 170 (or similar high number, NOT 60)
```

## Troubleshooting

### Issue: Matplotlib not available

**Symptom:** Wind rose returns data but no visualization URL

**Solution:**
1. Check if matplotlib_generator.py exists in parent directory
2. Verify Lambda layer includes matplotlib dependencies
3. Check CloudWatch logs for import errors

### Issue: S3 URL not accessible

**Symptom:** HTTP 403 or 404 when accessing wind rose PNG

**Solution:**
1. Check S3 bucket permissions
2. Verify bucket name in environment variable
3. Wait a few seconds for S3 propagation

### Issue: Wind rose not routing correctly

**Symptom:** Query doesn't trigger wind rose analysis

**Solution:**
1. Check orchestrator intent detection
2. Verify `action: 'wind_rose'` is being set
3. Check CloudWatch logs for routing decisions

## Rollback Procedure

If ANY regression is detected:

```bash
# Stop sandbox
Ctrl+C

# Revert changes
git checkout HEAD -- amplify/functions/renewableTools/simulation/simple_handler.py

# Redeploy
npx ampx sandbox

# Verify terrain and layout still work
./tests/test-renewable-baseline.sh
```

## Success Criteria

- [ ] Sandbox deployed successfully
- [ ] Wind rose tests pass
- [ ] Wind rose visualization displays in UI
- [ ] Terrain analysis still works (170 features)
- [ ] Layout optimization still works
- [ ] No CloudWatch errors
- [ ] No console errors in UI

## Next Steps

After wind rose is validated:
1. Move to wake simulation enhancement (Task 2)
2. Then report generation (Task 3)
3. Then end-to-end workflow testing (Task 4)
