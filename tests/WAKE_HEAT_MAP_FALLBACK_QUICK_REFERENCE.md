# Wake Heat Map Fallback UI - Quick Reference

## Overview
Fallback UI for WakeAnalysisArtifact when wake heat map visualization is unavailable.

## Component Behavior

### When Heat Map Available
```typescript
data.visualizations?.wake_heat_map = "https://s3.../wake_heat_map.html"
```
**Result:** Iframe renders with interactive Plotly heat map

### When Heat Map Missing
```typescript
data.visualizations?.wake_heat_map = undefined
```
**Result:** Alert displays with navigation button (if alternatives exist)

## User Flow

### Scenario A: Heat Map Present
1. User clicks "Wake Heat Map" tab
2. Loading indicator appears
3. Interactive heat map loads
4. User interacts with visualization

### Scenario B: Heat Map Missing + Analysis Charts Available
1. User clicks "Wake Heat Map" tab
2. Alert appears: "Wake Heat Map Not Available"
3. Message explains situation
4. "View Analysis Charts" button visible
5. User clicks button → switches to "charts" tab
6. User sees wake_analysis chart

### Scenario C: Heat Map Missing + No Alternatives
1. User clicks "Wake Heat Map" tab
2. Alert appears: "Wake Heat Map Not Available"
3. Message explains situation
4. No button (no alternatives available)

## Implementation Details

### Conditional Rendering
```typescript
{data.visualizations?.wake_heat_map ? (
  <iframe src={data.visualizations.wake_heat_map} />
) : (
  <Alert type="info" header="Wake Heat Map Not Available">
    {/* Fallback content */}
  </Alert>
)}
```

### Navigation Button
```typescript
action={
  data.visualizations?.wake_analysis ? (
    <Button onClick={() => setActiveTab('charts')}>
      View Analysis Charts
    </Button>
  ) : undefined
}
```

### Error Handling
```typescript
<iframe
  onError={() => {
    console.error('[WakeAnalysisArtifact] Failed to load wake heat map iframe');
    setMapLoaded(false);
  }}
/>
```

## Testing

### Quick Test Commands
```bash
# Verify implementation
node tests/verify-wake-heat-map-fallback.js

# Check TypeScript
npx tsc --noEmit src/components/renewable/WakeAnalysisArtifact.tsx
```

### Manual Testing
1. **Test with heat map:**
   - Run wake simulation
   - Navigate to Wake Heat Map tab
   - Verify iframe loads

2. **Test without heat map:**
   - Mock data without wake_heat_map URL
   - Navigate to Wake Heat Map tab
   - Verify Alert displays
   - Click button (if present)
   - Verify tab switches

3. **Test error handling:**
   - Use invalid URL
   - Check console for error log

## Requirements Mapping

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| 5.3 | Iframe renders when URL present | ✅ |
| 5.4 | Alert displays when URL missing | ✅ |
| 5.5 | Loading indicator until loaded | ✅ |

## Key Features

- ✅ Conditional rendering based on URL presence
- ✅ Informative Alert with clear messaging
- ✅ Navigation button to alternative visualizations
- ✅ Error handling for iframe load failures
- ✅ Loading indicator during load
- ✅ Type-safe implementation
- ✅ Cloudscape Design System compliance

## Common Issues

### Issue: Button not showing
**Cause:** `wake_analysis` URL not present
**Solution:** Button only shows when alternative visualization exists

### Issue: Iframe not loading
**Cause:** Invalid URL or network error
**Solution:** Check console for error log, verify URL is valid

### Issue: Loading indicator stuck
**Cause:** `onLoad` event not firing
**Solution:** Check iframe src, verify URL is accessible

## Files Modified
- `src/components/renewable/WakeAnalysisArtifact.tsx`

## Related Tasks
- Task 11: Turbines render on top of terrain
- Task 13: Always render WorkflowCTAButtons
- Task 15: Add comprehensive error boundaries

---

**Status:** ✅ Complete
**Requirements:** 5.3, 5.4, 5.5
**Component:** WakeAnalysisArtifact
