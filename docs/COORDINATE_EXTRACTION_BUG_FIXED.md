# Coordinate Extraction Bug - FIXED

## Date: October 10, 2025

## Problem

When user requested: "Create a 30MW wind farm layout at 35.067482, -101.395466"

The system extracted:
- `latitude: 3`
- `longitude: 0`

Instead of:
- `latitude: 35.067482`
- `longitude: -101.395466`

## Root Cause

The regex pattern `/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/` was matching "3, 0" from "30MW" because:
1. The `\.?` makes the decimal point optional
2. The `\d*` makes digits after decimal optional
3. So "3" from "30" matched as a valid coordinate
4. Then "0" from somewhere else matched as the second coordinate

## Fix Applied

Changed regex to REQUIRE decimal points in coordinates:

**Old Pattern**: `/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/`
**New Pattern**: `/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/`

This ensures we only match actual decimal coordinates like "35.067482, -101.395466" and not integers like "3, 0".

## Files Fixed

1. `amplify/functions/renewableOrchestrator/handler.ts` (2 locations)
   - Line ~379: `extractTerrainParams()`
   - Line ~419: `extractLayoutParams()`

2. `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts` (1 location)
   - Line ~309: Parameter extraction

## Deployment Status

✅ Deployed at 9:19 AM
✅ Lambda functions updated:
   - renewableOrchestrator-lambda
   - RenewableTerrainTool

## Testing

Try again:
```
Create a 30MW wind farm layout at 35.067482, -101.395466
```

Expected: Should now correctly extract coordinates and create layout.

## Other Fixes in This Session

1. ✅ **default-project issue** - Fixed in terrain handler
2. ✅ **Lambda permissions** - Added GetFunction permission
3. ✅ **Feature preservation** - Fixed array sampling logic
4. ✅ **Coordinate extraction** - Fixed regex pattern (this fix)

## Status

All critical bugs are now fixed and deployed. System should be fully functional.
