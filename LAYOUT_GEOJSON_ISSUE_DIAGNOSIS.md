# Layout GeoJSON Issue - Root Cause Analysis

## Problem
The layout map shows:
- ✅ Green perimeter circle (correct)
- ❌ NO turbines (blue markers)
- ❌ NO OSM features (buildings, roads, water)
- ❌ Wake button disabled (missing completedSteps)

## Root Cause Found

### 1. Layout Lambda DOES Return GeoJSON ✅

The `simple_handler.py` returns a complete response with:
```python
return {
    'success': True,
    'type': 'layout_optimization',
    'data': {
        'messageContentType': 'wind_farm_layout',
        'projectId': project_id,
        'turbineCount': len(optimized_turbines),
        'totalCapacity': total_capacity,
        'turbinePositions': turbine_positions,
        'geojson': layout_data['layout'],  # ✅ GeoJSON IS HERE
        'layoutS3Key': f"renewable/layout/{project_id}/layout.json",
        # ... other fields
    }
}
```

### 2. Strands Agent Handler NOT Passing Through Complete Response ❌

The `strandsAgentHandler.ts` receives the response but only passes through:
```typescript
return {
  success: true,
  message: agentResponse.response,
  artifacts: agentResponse.artifacts || [],  // ❌ Problem: artifacts might be empty
  thoughtSteps: [],
  metadata: { ... }
};
```

**The issue**: The Strands Agent Python code needs to format the layout tool response as an artifact with the complete data structure.

### 3. Missing Data Flow

**Expected Flow:**
```
Layout Lambda → Strands Agent Python → Strands Agent Handler TS → Frontend
     (GeoJSON)        (format as artifact)      (pass through)      (render)
```

**Current Flow:**
```
Layout Lambda → Strands Agent Python → Strands Agent Handler TS → Frontend
     (GeoJSON)        (❌ loses data?)         (empty artifacts)      (no map)
```

## Solution

### Fix the Strands Agent Python Handler

The Strands Agent Python code (`amplify/functions/renewableAgents/lambda_handler.py`) needs to:

1. **Receive the layout tool response** with complete GeoJSON
2. **Format it as an artifact** with the correct structure
3. **Return it in the response** so the TypeScript handler can pass it through

### Required Changes

**File**: `amplify/functions/renewableAgents/lambda_handler.py`

```python
# When processing layout tool response
if tool_name == 'layout_optimization':
    # Extract the complete response
    layout_response = tool_result.get('data', {})
    
    # Format as artifact for frontend
    artifact = {
        'messageContentType': 'wind_farm_layout',
        'projectId': layout_response.get('projectId'),
        'turbineCount': layout_response.get('turbineCount'),
        'totalCapacity': layout_response.get('totalCapacity'),
        'turbinePositions': layout_response.get('turbinePositions'),
        'layoutType': layout_response.get('layoutType'),
        'spacing': layout_response.get('spacing'),
        
        # CRITICAL: Include the complete GeoJSON
        'geojson': layout_response.get('geojson'),
        
        # CRITICAL: Track completed steps for wake button
        'completedSteps': ['terrain', 'layout'],
        
        # Include other fields
        'title': layout_response.get('title'),
        'subtitle': layout_response.get('subtitle'),
        'layoutS3Key': layout_response.get('layoutS3Key'),
        'mapUrl': layout_response.get('mapUrl')
    }
    
    return {
        'response': f"Layout optimization complete with {layout_response.get('turbineCount')} turbines.",
        'artifacts': [artifact],
        'agent': 'layout'
    }
```

## Testing Plan

### 1. Add Debug Logging

Add to `strandsAgentHandler.ts`:
```typescript
console.log('🔍 Agent Response Debug:', {
  hasArtifacts: !!(agentResponse.artifacts),
  artifactCount: agentResponse.artifacts?.length || 0,
  firstArtifact: agentResponse.artifacts?.[0] ? {
    type: agentResponse.artifacts[0].messageContentType,
    hasGeoJSON: !!(agentResponse.artifacts[0].geojson),
    featureCount: agentResponse.artifacts[0].geojson?.features?.length || 0
  } : null
});
```

### 2. Test Layout Optimization

1. Run layout optimization in UI
2. Check CloudWatch logs for debug output
3. Verify GeoJSON is in the artifact
4. Check browser console for data

### 3. Verify Frontend Rendering

After fix:
- ✅ Turbines appear as blue markers
- ✅ OSM features appear (buildings, roads, water)
- ✅ Wake button is enabled
- ✅ Only one optimize button
- ✅ Green perimeter circle

## Files to Modify

1. **`amplify/functions/renewableAgents/lambda_handler.py`**
   - Add special handling for layout tool responses
   - Format complete artifact with GeoJSON
   - Track completedSteps

2. **`amplify/functions/renewableOrchestrator/strandsAgentHandler.ts`**
   - Add debug logging (temporary)
   - Verify artifacts are passed through correctly

## Next Steps

1. ✅ Identified root cause
2. ⏳ Fix Strands Agent Python handler
3. ⏳ Add debug logging
4. ⏳ Test and verify
5. ⏳ Remove debug logging after confirmation

## Key Insight

The layout Lambda is working correctly and returning all the data. The problem is in the **Strands Agent layer** not properly formatting and passing through the complete response as an artifact.
