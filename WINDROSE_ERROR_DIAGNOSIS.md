# Wind Rose Error Diagnosis

## Error Message
```
'Tool execution failed. Please check the parameters and try again.'
```

## Root Cause Analysis

### Problem
Wind rose query is failing at the **backend Lambda level**, not the orchestrator.

### Evidence
1. ✅ Orchestrator code is correct (passes through plotlyWindRose)
2. ✅ Frontend code is correct (checks for plotlyWindRose first)
3. ❌ Backend Lambda is failing before returning data

### Why It's Failing

**Wind rose is NOT defined in parameter validation:**
- `REQUIRED_PARAMETERS` only has: terrain_analysis, layout_optimization, wake_simulation, report_generation
- **Missing:** wind_rose_analysis

**The simulation Lambda handles wind rose but:**
1. Orchestrator doesn't know how to validate wind_rose_analysis parameters
2. May be missing latitude/longitude
3. May be timing out
4. May have Python import errors

## Immediate Fixes Needed

### Fix 1: Add Wind Rose to Parameter Validation

**File:** `amplify/functions/renewableOrchestrator/parameterValidator.ts`

Add to `REQUIRED_PARAMETERS` (around line 40):
```typescript
const REQUIRED_PARAMETERS: Record<string, string[]> = {
  terrain_analysis: ['latitude', 'longitude'],
  layout_optimization: ['latitude', 'longitude'],
  wake_simulation: ['project_id'],
  wind_rose_analysis: ['latitude', 'longitude'],  // ← ADD THIS
  report_generation: ['project_id']
};
```

Add to `OPTIONAL_PARAMETERS` (around line 50):
```typescript
const OPTIONAL_PARAMETERS: Record<string, Record<string, any>> = {
  terrain_analysis: {
    radius_km: 5,
    setback_m: 200,
    project_id: null
  },
  layout_optimization: {
    capacity: 30,
    num_turbines: null,
    layout_type: 'grid',
    project_id: null
  },
  wake_simulation: {
    wind_speed: 8.5
  },
  wind_rose_analysis: {  // ← ADD THIS
    project_id: null
  },
  report_generation: {}
};
```

### Fix 2: Check Backend Lambda Logs

```bash
# Find simulation Lambda
aws lambda list-functions | grep -i simulation

# Check logs
aws logs tail /aws/lambda/[simulation-function-name] --since 10m

# Look for:
# - "Creating Plotly wind rose data"
# - Python import errors
# - Timeout errors
# - Missing environment variables
```

### Fix 3: Verify Environment Variables

The simulation Lambda needs:
- `RENEWABLE_S3_BUCKET` - For storing visualizations
- Python dependencies installed (numpy, plotly, etc.)

## Testing Steps

### Step 1: Add Parameter Validation
1. Edit `parameterValidator.ts`
2. Add wind_rose_analysis to REQUIRED_PARAMETERS
3. Add wind_rose_analysis to OPTIONAL_PARAMETERS
4. Deploy changes

### Step 2: Test Query
```
show me a wind rose for 35.067482, -101.395466
```

### Step 3: Check Logs
- Orchestrator logs: Should show parameter validation passing
- Simulation logs: Should show wind rose generation

### Step 4: Check Browser
- Should see Plotly interactive wind rose
- Or at least PNG fallback
- Not "Tool execution failed"

## Expected Flow

```
User Query: "show me a wind rose for 35.067482, -101.395466"
    ↓
Orchestrator: Detect intent = wind_rose_analysis
    ↓
Parameter Validation: Check latitude, longitude ← CURRENTLY FAILING
    ↓
Simulation Lambda: Generate wind rose
    ↓
Return plotlyWindRose data
    ↓
Frontend: Render PlotlyWindRose component
```

## Current Flow (Broken)

```
User Query: "show me a wind rose for 35.067482, -101.395466"
    ↓
Orchestrator: Detect intent = wind_rose_analysis
    ↓
Parameter Validation: No rules for wind_rose_analysis ← PROBLEM
    ↓
Simulation Lambda: Called with invalid/missing params
    ↓
Lambda fails: "Tool execution failed"
    ↓
User sees error message
```

## Quick Fix Commands

```bash
# 1. Edit parameter validator
# Add wind_rose_analysis to REQUIRED_PARAMETERS and OPTIONAL_PARAMETERS

# 2. Check if sandbox needs restart
# (Parameter validation changes may need restart)

# 3. Test query
# "show me a wind rose for 35.067482, -101.395466"

# 4. Check logs
aws logs tail /aws/lambda/[orchestrator] --follow
aws logs tail /aws/lambda/[simulation] --follow
```

## Success Criteria

✅ Query doesn't show "Tool execution failed"
✅ Orchestrator logs show parameter validation passing
✅ Simulation logs show wind rose generation
✅ Frontend receives plotlyWindRose data
✅ Interactive Plotly chart displays

## If Still Failing After Fix

Check simulation Lambda logs for:
1. **Python import errors** - plotly_wind_rose_generator not found
2. **Timeout** - Lambda timing out (increase timeout)
3. **Memory** - Out of memory (increase memory)
4. **S3 permissions** - Can't write to bucket
5. **Missing dependencies** - numpy, plotly not installed

## Related Files

- `amplify/functions/renewableOrchestrator/parameterValidator.ts` - Add validation
- `amplify/functions/renewableTools/simulation/handler.py` - Backend logic
- `amplify/functions/renewableTools/plotly_wind_rose_generator.py` - Plotly generation
- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator
- `src/components/renewable/WindRoseArtifact.tsx` - Frontend display
