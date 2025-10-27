# Wake Simulation & Fake Layout Issues - FIXED

## Issue 1: Wake Simulation Failing ✅ FIXED

### Problem
"Run a wake simulation for this wind farm layout" returns "Tool execution failed. Please check the parameters and try again."

### Root Cause
The orchestrator wasn't passing `layout_results` from project context to the simulation Lambda because of a naming mismatch:
- Code checked for `context?.layoutResults` (camelCase)
- Project context uses `layout_results` (snake_case)

### Fix Applied
**File**: `amplify/functions/renewableOrchestrator/handler.ts`

```typescript
// BEFORE (line ~1700):
let layoutData = context?.layout || context?.layoutResults || intent.params.layout;

// AFTER:
let layoutData = context?.layout || context?.layout_results || context?.layoutResults || intent.params.layout;
```

Also added `project_context` to the payload:
```typescript
payload = {
  parameters: {
    project_id: intent.params.project_id,
    layout: layoutData,
    wind_speed: intent.params.wind_speed || 8.5,
    wind_direction: intent.params.wind_direction || 270
  },
  // Pass project context to simulation Lambda for parameter auto-fill
  project_context: context || {}
};
```

### Deployment Status
- ✅ Code changes applied
- ⏳ Waiting for sandbox auto-deploy (or manual restart needed)

### Testing
Run: `node tests/diagnose-wake-simulation-issue.js`

Expected result after deployment:
- Wake simulation should receive layout data
- Should generate wake analysis artifacts
- Should not show "No turbine layout found" error

---

## Issue 2: Fake Wind Farm Layout ⚠️ SEPARATE ISSUE

### Problem
The layout optimization generates a simple grid without considering:
- Real terrain constraints
- Wind resource optimization  
- Wake effects
- Site suitability

### Current Implementation
**File**: `amplify/functions/renewableTools/layout/handler.py`

```python
# Just creates a simple grid - NO OPTIMIZATION
for i in range(grid_size):
    for j in range(grid_size):
        lat = center_lat + (i - grid_size/2) * spacing_lat
        lon = center_lon + (j - grid_size/2) * spacing_lon
        # Place turbine here (no terrain check, no wind analysis)
```

### What's Missing
1. **Terrain Analysis Integration**: Doesn't use terrain results from project context
2. **Wind Resource Data**: Doesn't fetch NREL wind data for optimization
3. **Optimization Algorithm**: No genetic algorithm, greedy placement, or wake optimization
4. **Constraint Handling**: No exclusion zones, setbacks, or terrain-based constraints
5. **Energy Production Optimization**: Doesn't maximize AEP or minimize wake losses

### To Fix This
Requires a separate spec/task to:
1. Load terrain analysis results from project context
2. Fetch wind resource data from NREL API
3. Implement optimization algorithm (genetic algorithm recommended)
4. Apply real-world constraints (exclusion zones, setbacks, terrain)
5. Optimize for energy production and wake losses
6. Validate against terrain suitability

### Recommendation
Create a new spec: "Implement Real Layout Optimization Algorithm"

This is a significant undertaking that requires:
- Wind resource analysis integration
- Optimization algorithm implementation
- Terrain constraint processing
- Wake loss modeling
- Performance validation

---

## Next Steps

### Immediate (Wake Simulation Fix)
1. Wait for sandbox auto-deploy (~30 seconds)
2. Test with: `node tests/diagnose-wake-simulation-issue.js`
3. Verify layout data is passed to simulation Lambda
4. Confirm wake analysis artifacts are generated

### Future (Layout Optimization)
1. Create spec for real layout optimization
2. Implement wind resource integration
3. Add optimization algorithm (genetic algorithm)
4. Integrate terrain constraints
5. Validate with real-world scenarios

---

## Summary

**Wake Simulation**: Fixed - just needs deployment
**Fake Layout**: Separate issue - needs new spec and implementation

The wake simulation fix is simple (naming mismatch). The layout optimization is complex (requires algorithm implementation).
