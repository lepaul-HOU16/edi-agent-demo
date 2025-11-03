# Intent Detection Fix - Layout vs Terrain Analysis

## Problem

When users asked for wind farm layout creation (e.g., "Create a 30MW wind farm layout at 35.067482, -101.395466"), the system was incorrectly routing the request to terrain analysis instead of layout optimization.

## Root Cause

The intent detection logic in `amplify/functions/renewableOrchestrator/handler.ts` had two issues:

### 1. **Incorrect Pattern Matching Order**
The terrain analysis check was happening BEFORE the layout optimization check, and it included a very broad pattern:
```typescript
// WRONG: This caught ALL queries with "wind farm"
if (lowerQuery.includes('wind farm') || ...) {
  return { type: 'terrain_analysis' };
}
```

### 2. **Wrong Function Call**
There was a copy-paste error where terrain analysis was calling `extractLayoutParams` instead of `extractTerrainParams`.

## Solution Applied

### 1. **Reordered Pattern Matching**
- **Layout optimization patterns checked FIRST** (more specific)
- **Terrain analysis patterns made more specific**

```typescript
// NEW: Check layout keywords FIRST with specific patterns
if (lowerQuery.includes('layout') || 
    lowerQuery.includes('turbine placement') ||
    (lowerQuery.includes('create') && lowerQuery.includes('wind farm')) ||
    (lowerQuery.includes('design') && lowerQuery.includes('wind farm')) ||
    lowerQuery.includes('mw wind farm') ||
    lowerQuery.includes('wind farm layout')) {
  return { type: 'layout_optimization', confidence: 95 };
}

// NEW: More specific terrain analysis patterns
if (lowerQuery.includes('terrain') || 
    (lowerQuery.includes('analyze') && lowerQuery.includes('terrain')) ||
    (lowerQuery.includes('analysis') && !lowerQuery.includes('layout')) ||
    lowerQuery.includes('site assessment')) {
  return { type: 'terrain_analysis', confidence: 85 };
}
```

### 2. **Fixed Function Call**
```typescript
// FIXED: Use correct parameter extraction function
return {
  type: 'terrain_analysis',
  params: extractTerrainParams(query), // Was: extractLayoutParams(query)
  confidence: 85
};
```

## Test Results

| Query | Before Fix | After Fix | ✅ |
|-------|------------|-----------|-----|
| "Create a 30MW wind farm layout at 35.067482, -101.395466" | terrain_analysis | **layout_optimization** | ✅ |
| "Analyze terrain for wind farm at 35.067482, -101.395466" | terrain_analysis | terrain_analysis | ✅ |
| "Design wind farm layout with 12 turbines" | terrain_analysis | **layout_optimization** | ✅ |
| "Wind farm analysis for site assessment" | terrain_analysis | terrain_analysis | ✅ |
| "Generate wind farm layout" | terrain_analysis | **layout_optimization** | ✅ |

## Pattern Matching Logic

### Layout Optimization Triggers ✅
- `layout`
- `turbine placement`
- `wind turbine layout`
- `create` + `wind farm`
- `design` + `wind farm`
- `mw wind farm`
- `wind farm design`
- `wind farm layout`

### Terrain Analysis Triggers ✅
- `terrain`
- `environmental`
- `analyze` + `terrain`
- `analysis` (but NOT with `layout`)
- `wind resource`
- `impact assessment`
- `site assessment`

### Simulation Triggers ✅
- `simulation`
- `wake`
- `performance`
- `aep`
- `annual energy`
- `capacity factor`

### Report Generation Triggers ✅
- `report`
- `summary`
- `executive`
- `generate` + (`report` or `summary`)

## Impact

### Before Fix ❌
- Layout requests → Terrain analysis tool
- Users got terrain maps instead of wind farm layouts
- Poor user experience

### After Fix ✅
- Layout requests → Layout optimization tool
- Users get proper wind farm layouts with turbine placement
- Correct tool routing for all renewable energy intents

## Files Modified

- `amplify/functions/renewableOrchestrator/handler.ts`
  - Reordered intent detection patterns
  - Fixed parameter extraction function call
  - Improved pattern specificity

## Validation

The fix has been tested with multiple query patterns and correctly routes:
- ✅ Layout creation requests to layout optimization
- ✅ Terrain analysis requests to terrain analysis  
- ✅ Other renewable energy intents to appropriate tools

**Status: COMPLETE** ✅

Users can now successfully request wind farm layouts and get the correct tool response.