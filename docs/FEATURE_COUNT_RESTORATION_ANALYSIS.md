# Feature Count Restoration Analysis

## Task 15: Test Feature Count Restoration

### Test Results

**Date:** 2025-01-08  
**Status:** ⚠️ ISSUES DETECTED

### Summary

Testing revealed that terrain analysis is returning exactly **60 features** instead of the expected **>100 features** for the Texas Panhandle test location. This indicates an artificial limit is being applied somewhere in the data pipeline.

### Test Execution

```bash
node scripts/test-feature-count-restoration.js
```

### Findings

#### 1. Feature Count Limit (60 Features)

**Observation:**
- Orchestrator returns exactly 60 terrain features
- Direct terrain Lambda call returns 0 features (fallback data)
- Expected: >100 features for a 5km radius in Texas Panhandle

**Evidence:**
```json
{
  "success": true,
  "message": "Found 60 terrain features",
  "artifacts": [{
    "type": "wind_farm_terrain_analysis",
    "data": {
      "metrics": {
        "totalFeatures": 60,
        "radiusKm": 5
      }
    }
  }]
}
```

**Root Cause Analysis:**

1. **OSM Query** (`osm_client.py`):
   - Query does NOT have explicit limit
   - Uses `out geom;` without limit parameter
   - Comprehensive query covering all feature types

2. **Terrain Handler** (`terrain/handler.py`):
   - Returns ALL features without truncation
   - Line 1398: `'exclusionZones': features` (no slicing)
   - Line 1401: `'totalFeatures': len(features)` (accurate count)

3. **Orchestrator** (`handler.ts`):
   - No feature limiting logic found
   - Mock data only has 12 features (not 60)
   - Passes through terrain Lambda response

**Hypothesis:**

The 60-feature limit is likely coming from:

1. **Overpass API Default Limit**: The Overpass API may have a default result limit when no explicit limit is specified
2. **Network/Timeout Issues**: The query may be timing out before all results are returned
3. **OSM Query Complexity**: The query may be too complex and hitting API restrictions

#### 2. Project ID Issue

**Observation:**
- Project ID is "default-project" instead of unique generated ID
- Expected format: `terrain-{timestamp}-{random}` or `project-{timestamp}`

**Evidence:**
```json
{
  "projectId": "default-project"
}
```

**Root Cause:**
- Orchestrator's `extractTerrainParams()` function generates project ID
- However, the actual response shows "default-project"
- This suggests the terrain Lambda is overriding the project ID

**Location in Code:**
```typescript
// amplify/functions/renewableOrchestrator/handler.ts:280
function extractTerrainParams(query: string): Record<string, any> {
  // ...
  params.project_id = `project-${Date.now()}`;
  return params;
}
```

#### 3. Direct Terrain Lambda Returns 0 Features

**Observation:**
- Direct call to terrain Lambda returns 0 features
- Suggests it's using fallback/synthetic data

**Possible Causes:**
1. OSM API is unavailable or timing out
2. Network connectivity issues from Lambda
3. Python dependencies not properly installed

### Comparison with Previous Working Version

**Previous (Working):**
- Feature count: 151 features
- Project ID: Unique generated ID
- Data source: Real OSM data

**Current (Broken):**
- Feature count: 60 features (limited)
- Project ID: "default-project" (not generated)
- Data source: Real OSM data (but limited)

### Remediation Steps

#### 1. Fix OSM Query Limit

**Option A: Add Explicit Limit to Overpass Query**

Modify `osm_client.py` to add explicit limit:

```python
query = f"""
[out:json][timeout:25][maxsize:536870912];
(
  // ... existing query ...
);
out geom 1000;  // Explicit limit of 1000 features
"""
```

**Option B: Use Multiple Queries**

Split the query into multiple smaller queries to avoid hitting limits:

```python
# Query buildings separately
# Query roads separately
# Query water separately
# Combine results
```

**Option C: Increase Timeout and Add Pagination**

```python
query = f"""
[out:json][timeout:60][maxsize:536870912];
(
  // ... existing query ...
);
out geom;
"""
```

#### 2. Fix Project ID Generation

**Issue:** Terrain Lambda is not using the project ID passed from orchestrator

**Solution:** Ensure terrain Lambda uses the project_id from parameters:

```python
# In terrain/handler.py
project_id = parameters.get('project_id') or f'terrain-{int(time.time())}-{random.randint(1000, 9999)}'
```

#### 3. Investigate Direct Terrain Lambda Failure

**Steps:**
1. Check CloudWatch logs for terrain Lambda
2. Verify OSM API connectivity from Lambda
3. Test OSM client with direct invocation
4. Check Python dependencies installation

### Testing Strategy

#### Test 1: Verify OSM Query Limit

```bash
# Test OSM query directly with explicit limit
python -c "from osm_client import query_osm_terrain_sync; print(query_osm_terrain_sync(35.067482, -101.395466, 5))"
```

#### Test 2: Test with Different Locations

```bash
# Test with location known to have many features
node scripts/test-feature-count-restoration.js
```

#### Test 3: Monitor CloudWatch Logs

```bash
# Check orchestrator logs
aws logs tail /aws/lambda/renewableOrchestrator --follow

# Check terrain Lambda logs
aws logs tail /aws/lambda/renewableToolsTerrain --follow
```

### Expected Outcomes After Fix

1. **Feature Count**: >100 features for 5km radius in populated areas
2. **Project ID**: Unique generated ID (not "default-project")
3. **Consistency**: Orchestrator and direct calls return similar feature counts
4. **No Artificial Limits**: Feature count varies based on actual OSM data

### Success Criteria

- [ ] Feature count >100 for test location
- [ ] No artificial 60-feature limit
- [ ] Unique project ID generated
- [ ] Direct terrain Lambda returns real data
- [ ] Feature counts consistent between orchestrator and direct calls

### Next Steps

1. **Immediate**: Add explicit limit to OSM query (`out geom 1000;`)
2. **Short-term**: Fix project ID generation in terrain Lambda
3. **Medium-term**: Investigate why direct terrain Lambda returns 0 features
4. **Long-term**: Implement query pagination for very large result sets

### Related Files

- `amplify/functions/renewableTools/osm_client.py` - OSM query construction
- `amplify/functions/renewableTools/terrain/handler.py` - Terrain Lambda handler
- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator
- `scripts/test-feature-count-restoration.js` - Test script

### References

- Overpass API Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
- Overpass QL Language Guide: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
- OSM Feature Limits: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#Output_Format
