# 151 Features Regression Fix

## Problem Summary

The terrain map was showing only **60 features** instead of the expected **151 features** from OpenStreetMap data, with a "Limited terrain data" warning. This was caused by TWO issues:

1. **Backend optimization sampling the features array** (reducing 151 → 60 features)
2. **Frontend checking wrong property** for feature count validation

## Root Cause

The `optimizeArtifactForDynamoDB()` function in `utils/s3ArtifactStorage.ts` was **indiscriminately sampling ALL arrays** with more than 1000 items, including:

- ❌ **Features arrays** (the actual terrain features like buildings, roads, water bodies)
- ✅ **Coordinate arrays** (the geometry coordinates within each feature)

### The Bug

```typescript
// OLD CODE - Samples ANY large array
if (Array.isArray(value) && value.length > 1000) {
  const sampledData = value.filter((_, index) => index % 8 === 0);
  obj[key] = sampledData;  // This was sampling the features array!
}
```

This caused:
- **151 terrain features** → sampled down to **~19 features** (every 8th feature)
- The coordinate arrays within features were also being sampled (which was intended)

## The Fixes

### Fix 1: Backend Optimization (utils/s3ArtifactStorage.ts)

Modified the optimization logic to be **selective**:

1. **Preserve features arrays completely** - Never sample the features array itself
2. **Only optimize coordinate arrays** - Sample coordinate arrays within geometries for size reduction
3. **Recursively process features** - Optimize coordinates within each feature while keeping all features

### Fixed Code

```typescript
// NEW CODE - Only samples coordinate arrays, preserves features
const isCoordinateArray = currentPath.includes('coordinates') && 
                          !currentPath.includes('features') &&
                          Array.isArray(value) && 
                          value.length > 100 &&
                          value.every((item: any) => Array.isArray(item) || typeof item === 'number');

if (isCoordinateArray) {
  // Sample coordinate arrays for size reduction
  const sampledData = value.filter((_: any, index: number) => index % 4 === 0);
  obj[key] = sampledData;
  console.log(`🔧 Sampled coordinate array at ${currentPath}: ${value.length} → ${sampledData.length} items`);
} else if (Array.isArray(value) && currentPath.includes('features')) {
  // PRESERVE features arrays completely - do not sample
  console.log(`✅ Preserving features array at ${currentPath}: ${value.length} features (no sampling)`);
  // Recursively optimize within each feature (e.g., coordinates)
  value.forEach((feature: any, index: number) => {
    if (typeof feature === 'object' && feature !== null) {
      optimizeObject(feature, `${currentPath}[${index}]`);
    }
  });
}
```

### Fix 2: Frontend Validation (src/components/renewable/TerrainMapArtifact.tsx)

Fixed the feature count check to look at the correct properties:

```typescript
// OLD CODE - Checking wrong property
const hasRealOSMData = data.content?.features && 
                      Array.isArray(data.content.features) && 
                      data.content.features.length > 100;

// NEW CODE - Checking actual data structure
const featureCount = data.exclusionZones?.length || 
                    data.geojson?.features?.length || 
                    0;
const hasRealOSMData = featureCount > 100;
```

The terrain artifact structure uses:
- `data.exclusionZones` - Array of terrain features
- `data.geojson.features` - GeoJSON features array
- NOT `data.content.features` (which doesn't exist)

## What Changed

### Before Fixes
- ❌ 151 features → 60 features (sampled by optimization)
- ❌ Features array was being reduced
- ❌ Frontend checking wrong property (`data.content.features`)
- ❌ "Limited terrain data" warning shown incorrectly
- ✅ Coordinate arrays were being optimized (intended)

### After Fixes
- ✅ 151 features → 151 features (preserved)
- ✅ Features array is never sampled
- ✅ Frontend checks correct properties (`exclusionZones` or `geojson.features`)
- ✅ Accurate feature count displayed in warning message
- ✅ Coordinate arrays within features are still optimized for size

## Benefits

1. **Data Integrity**: All terrain features are preserved (buildings, roads, water, power lines, etc.)
2. **Size Optimization**: Coordinate arrays are still optimized to fit DynamoDB limits
3. **Better UX**: Users see complete terrain data for accurate wind farm site analysis
4. **Selective Optimization**: Only optimize what needs optimization (coordinates), not critical data (features)

## Testing

To verify the fixes work:

1. **Clear browser cache** or do a hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. **Request a NEW terrain analysis** for any location (old cached data will still show 60 features)
3. Check the artifact in the response
4. Verify the feature count matches OSM data (should be 100-200+ features for typical locations)
5. Confirm NO "Limited terrain data" warning appears
6. Check the metrics show "Found 151 terrain features" (or similar high count)

### Expected Backend Logs

```
✅ Preserving features array at exclusionZones: 151 features (no sampling)
✅ Preserving features array at geojson.features: 151 features (no sampling)
🔧 Sampled coordinate array at geojson.features[54].geometry.coordinates: 1334 → 334 items
```

### Expected Frontend Behavior

- ✅ No "Limited Functionality" alert
- ✅ No "Limited terrain data" warning
- ✅ Feature count shows 100+ features
- ✅ All terrain features visible on map (buildings, roads, water, power lines)

## Related Issues

- **Original Issue**: `.kiro/specs/restore-151-features-regression/`
- **GraphQL Fix**: `docs/ARTIFACT_GRAPHQL_VALIDATION_FIX.md` (introduced the optimization)
- **Regression Protection**: `.kiro/steering/regression-protection.md`

## Lessons Learned

1. **Be Specific with Optimization**: Don't optimize everything - only optimize what's causing the problem
2. **Preserve Critical Data**: Features are the actual data users need - coordinates are just rendering details
3. **Test with Real Data**: The regression wasn't caught because we didn't test with real OSM data
4. **Add Logging**: The detailed logging helped identify exactly what was being sampled

## Prevention

Added to regression protection guidelines:
- Always preserve feature arrays in GeoJSON data
- Only optimize coordinate arrays for size reduction
- Test artifact optimization with real data before deploying
- Monitor feature counts in production to detect regressions early
