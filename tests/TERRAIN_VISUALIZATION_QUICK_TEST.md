# Terrain Visualization Quick Test Guide

## Quick Verification

```bash
# Run automated verification
node tests/verify-terrain-feature-visualization.js
```

Expected: ✅ 8/8 checks passed

## Manual Test (2 minutes)

### Test 1: Full Workflow
```
1. Open chat interface
2. Type: "analyze terrain at 35.0675, -101.3954 with 5km radius"
3. Wait for terrain analysis to complete
4. Type: "optimize turbine layout with 10 turbines"
5. Wait for layout map to render
```

**What to look for:**
- ✅ Map shows satellite/street view toggle
- ✅ Dashed perimeter boundary visible
- ✅ Red building polygons visible
- ✅ Gray road lines visible
- ✅ Blue water polygons visible (if present)
- ✅ Blue turbine markers on top
- ✅ Legend in bottom-right corner
- ✅ Feature counts above map

### Test 2: Interactive Features
```
1. Click on a building polygon
   → Should show popup with "Building" title
   
2. Click on a road line
   → Should show popup with "Road" title
   
3. Click on a turbine marker
   → Should show popup with turbine details (capacity, height, etc.)
   
4. Zoom in/out
   → All features should scale correctly
   
5. Pan the map
   → All features should move together
```

### Test 3: Legend Verification
```
1. Check legend in bottom-right corner
2. Verify legend shows:
   - Buildings (red square)
   - Roads (gray line)
   - Water (blue square) - if present
   - Perimeter (dashed square)
   - Turbines (📍 icon)
```

## Expected Results

### Visual Appearance

```
┌─────────────────────────────────────────────┐
│ [Satellite] [Street Map]            [+] [-] │
├─────────────────────────────────────────────┤
│                                             │
│    ⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯    │
│    ⋯                                   ⋯    │
│    ⋯  ▢ ▢    ─────    📍 📍 📍        ⋯    │
│    ⋯  ▢      ─────    📍 📍 📍        ⋯    │
│    ⋯         ─────    📍 📍 📍        ⋯    │
│    ⋯  ▢▢▢                             ⋯    │
│    ⋯                                   ⋯    │
│    ⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯    │
│                                             │
│                          ┌──────────────┐  │
│                          │ Map Legend   │  │
│                          │ ▢ Buildings  │  │
│                          │ ─ Roads      │  │
│                          │ ▢ Water      │  │
│                          │ ⋯ Perimeter  │  │
│                          │ 📍 Turbines  │  │
│                          └──────────────┘  │
└─────────────────────────────────────────────┘
```

### Feature Statistics

```
Terrain Features on Map
┌──────────┬──────────┬──────────┬──────────┐
│Buildings │  Roads   │  Water   │  Other   │
│    12    │    8     │    3     │    2     │
└──────────┴──────────┴──────────┴──────────┘
```

## Troubleshooting

### Issue: No terrain features visible
**Solution**: Ensure terrain analysis was run first
```
User: "analyze terrain at [lat], [lon] with [radius]km radius"
```

### Issue: Turbines not visible
**Solution**: Check that turbines are layered on top
- Turbines should always be visible above terrain
- Try clicking where turbines should be

### Issue: Legend not showing
**Solution**: Legend only shows when terrain features exist
- If no terrain features, no legend is displayed
- This is expected behavior

### Issue: Map not loading
**Solution**: Check browser console for errors
- Ensure Leaflet library loaded
- Check network tab for tile loading
- Verify GeoJSON data structure

## Success Criteria

✅ All terrain features render correctly
✅ Turbines visible on top of terrain
✅ Legend displays correctly
✅ Feature statistics accurate
✅ Interactive popups work
✅ Map controls functional

## Time Required

- Automated test: 5 seconds
- Manual test: 2 minutes
- Full workflow test: 5 minutes

## Next Steps

After verifying terrain visualization:
1. Proceed to Task 5: Call-to-Action buttons
2. Test complete workflow with CTA buttons
3. Verify end-to-end user experience
