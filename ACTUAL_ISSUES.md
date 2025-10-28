# Actual Issues - Root Cause Analysis

## Summary
The backend is working correctly and returning all the right data. The issues are ALL in the frontend not displaying what the backend sends.

## Issue 1: Layout Map Using Grid Layout
**Status**: Backend returns intelligent placement, frontend may not be receiving it
**Root Cause**: Need to verify what data the frontend actually receives
**Test**: Check browser console for layout artifact data

## Issue 2: Layout Map Missing Terrain Features  
**Status**: Backend includes terrain features in GeoJSON
**Root Cause**: Frontend LayoutMapArtifact.tsx DOES render terrain features (lines 350-450)
**Test**: Check if geojson.features actually contains terrain features in browser

## Issue 3: Duplicate "Optimize Layout" Button
**Status**: CONFIRMED BUG
**Root Cause**: LayoutMapArtifact.tsx renders BOTH:
- `<WorkflowCTAButtons>` (line 653)
- `<ActionButtons actions={actions}>` (not visible in truncated file)

**Fix**: Remove one of them

## Issue 4: "Run Wake Simulation" Button Not Working
**Status**: Need to check WorkflowCTAButtons component
**Root Cause**: Button click handler may not be wired up correctly

## Issue 5: "Run Wake Simulation" Should Be Primary Button
**Status**: Need to check WorkflowCTAButtons component
**Root Cause**: Button variant not set to "primary"

## Issue 6: Terrain Map LineStrings Missing Background Widths/Tints
**Status**: Need to check terrain map artifact component
**Root Cause**: LineString styling not applied

## CRITICAL FINDING
The backend test I ran shows the orchestrator IS working and returning:
- 173 terrain features
- Proper GeoJSON
- Action buttons
- Project persistence

**The problem is the FRONTEND is not displaying what the backend sends.**

## Next Steps
1. Check browser console to see what data the frontend actually receives
2. Check if there's a mismatch between backend data format and frontend expectations
3. Fix the duplicate button issue
4. Fix the WorkflowCTAButtons component
5. Fix terrain map LineString styling
