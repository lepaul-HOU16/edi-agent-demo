# Interactive Wind Rose with Plotly - Implementation Plan

## Context

- ✅ Petro agent already uses Plotly (`react-plotly.js`)
- ✅ Infrastructure in place for interactive charts
- ✅ Dynamic imports pattern established
- ✅ Duplication issue fixed
- 🎯 Goal: Add interactive wind rose matching petro agent patterns

## Approach: Client-Side Plotly Rendering

### Why Client-Side (Not Backend)

**Advantages:**
1. ✅ **No Docker Lambda needed** - Works immediately
2. ✅ **Fully interactive** - Hover, zoom, pan, export
3. ✅ **Consistent with petro agent** - Same patterns
4. ✅ **No S3 storage** - Renders directly in browser
5. ✅ **Faster** - No image generation/upload
6. ✅ **Responsive** - Scales to any size

**vs Backend Plotly:**
- Backend: Generate HTML → Upload to S3 → Embed iframe
- Client: Receive data → Render directly → Interactive immediately

## Implementation Plan

### Step 1: Create Interactive Wind Rose Component

**File**: `src/components/renewable/InteractiveWindRose.tsx`

```typescript
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly (matches petro agent pattern)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading wind rose...</div>
});

interface WindRoseData {
  direction: string;
  angle: number;
  frequency: number;
  avg_speed: number;
  max_speed: number;
}

interface InteractiveWindRoseProps {
  windRoseData: WindRoseData[];
  projectId: string;
  avgSpeed: number;
  maxSpeed: number;
  prevailingDirection: string;
}

const InteractiveWindRose: React.FC<InteractiveWindRoseProps> = ({
  windRoseData,
  projectId,
  avgSpeed,
  maxSpeed,
  prevailingDirection
}) => {
  // Prepare data for Plotly polar bar chart
  const plotlyData = [{
    type: 'barpolar',
    r: windRoseData.map(d => d.frequency),
    theta: windRoseData.map(d => d.angle),
    marker: {
      color: windRoseData.map(d => d.avg_speed),
      colorscale: 'Viridis',
      showscale: true,
      colorbar: {
        title: 'Wind Speed<br>(m/s)',
        thickness: 15,
        len: 0.7
      }
    },
    hovertemplate: 
      '<b>%{theta}°</b><br>' +
      'Frequency: %{r:.1f}%<br>' +
      'Avg Speed: %{marker.color:.1f} m/s<br>' +
      '<extra></extra>',
    width: windRoseData.map(() => 360 / windRoseData.length)
  }];

  const layout = {
    title: {
      text: `Wind Rose - ${projectId}`,
      font: { size: 16, weight: 'bold' }
    },
    polar: {
      radialaxis: {
        title: 'Frequency (%)',
        angle: 90,
        ticksuffix: '%'
      },
      angularaxis: {
        direction: 'clockwise',
        rotation: 90  // North at top
      }
    },
    showlegend: false,
    height: 500,
    margin: { t: 80, b: 40, l: 40, r: 40 }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `wind_rose_${projectId}`,
      height: 1200,
      width: 1200,
      scale: 2
    }
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={plotlyData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default InteractiveWindRose;
```

### Step 2: Update WindRoseArtifact Component

**File**: `src/components/renewable/WindRoseArtifact.tsx`

```typescript
import InteractiveWindRose from './InteractiveWindRose';

// In the render section, replace SVG with:
<Box>
  <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
    Wind Rose Diagram (Interactive)
  </Box>
  {windRoseData.length > 0 ? (
    <InteractiveWindRose
      windRoseData={windRoseData}
      projectId={data.projectId}
      avgSpeed={getAvgSpeed()}
      maxSpeed={getMaxSpeed()}
      prevailingDirection={stats.prevailingDirection}
    />
  ) : (
    <div>No wind data available</div>
  )}
</Box>
```

### Step 3: Verify Backend Data Structure

**Current backend response** (already working):
```json
{
  "windRoseData": [
    {
      "direction": "N",
      "angle": 0,
      "frequency": 5.3,
      "avg_speed": 9.7,
      "max_speed": 12.9
    },
    // ... 15 more directions
  ],
  "windStatistics": {
    "averageSpeed": 9.3,
    "maxSpeed": 14.9,
    "prevailingDirection": "W",
    "directionCount": 16
  }
}
```

✅ **No backend changes needed!** Data structure is perfect for Plotly.

## Features

### Interactive Features
- ✅ **Hover tooltips**: Show direction, frequency, wind speed
- ✅ **Zoom**: Click and drag to zoom
- ✅ **Pan**: Shift + drag to pan
- ✅ **Export**: Download as PNG (high-res)
- ✅ **Reset**: Double-click to reset view
- ✅ **Responsive**: Scales to container

### Visual Features
- ✅ **Color-coded**: Wind speed gradient (Viridis colorscale)
- ✅ **Polar projection**: True wind rose format
- ✅ **North orientation**: North at top, clockwise
- ✅ **Frequency bars**: Bar height = directional frequency
- ✅ **Colorbar legend**: Shows wind speed scale
- ✅ **Professional styling**: Clean, modern appearance

## Comparison with Options

| Feature | SVG (Current) | Plotly (Proposed) | Matplotlib PNG |
|---------|---------------|-------------------|----------------|
| **Interactive** | ❌ No | ✅ Yes | ❌ No |
| **Hover tooltips** | ❌ No | ✅ Yes | ❌ No |
| **Zoom/Pan** | ❌ No | ✅ Yes | ❌ No |
| **Export** | ❌ No | ✅ Yes (PNG) | ✅ Yes (PNG) |
| **Quality** | ⚠️ Basic | ✅ Professional | ✅ Professional |
| **Load time** | ✅ Instant | ✅ Instant | ⚠️ Depends on S3 |
| **Dependencies** | ✅ None | ✅ Already have | ❌ Need Docker |
| **Complexity** | ✅ Low | ✅ Low | ⚠️ High |
| **Matches petro** | ❌ No | ✅ Yes | ❌ No |

## Implementation Steps

### Phase 1: Create Component (30 min)
1. Create `InteractiveWindRose.tsx`
2. Add Plotly polar bar chart
3. Configure hover templates
4. Add color scale for wind speed

### Phase 2: Integrate (15 min)
1. Update `WindRoseArtifact.tsx`
2. Import and use `InteractiveWindRose`
3. Remove SVG fallback code
4. Test with existing data

### Phase 3: Test (15 min)
1. Send wind rose query
2. Verify interactive features work
3. Test hover tooltips
4. Test zoom/pan
5. Test export to PNG

### Phase 4: Polish (15 min)
1. Adjust colors/styling
2. Fine-tune layout
3. Add loading states
4. Handle edge cases

**Total Time**: ~1.5 hours

## Benefits

### vs Current SVG
- ✅ Professional appearance
- ✅ Interactive (hover, zoom, pan)
- ✅ Export capability
- ✅ Better color coding
- ✅ Matches petro agent quality

### vs Docker + Matplotlib
- ✅ No infrastructure changes needed
- ✅ Works immediately
- ✅ No S3 storage costs
- ✅ Faster (no image generation)
- ✅ More interactive

### Consistency
- ✅ Matches petro agent patterns
- ✅ Uses existing dependencies
- ✅ Same dynamic import pattern
- ✅ Consistent user experience

## Testing Plan

### Test 1: Basic Rendering
```
Query: "show wind rose for 35.0, -101.0"
Expected: Interactive Plotly wind rose appears
```

### Test 2: Hover Tooltips
```
Action: Hover over bars
Expected: Tooltip shows direction, frequency, wind speed
```

### Test 3: Zoom/Pan
```
Action: Click and drag to zoom
Expected: Chart zooms smoothly
```

### Test 4: Export
```
Action: Click camera icon
Expected: Downloads high-res PNG (1200x1200)
```

### Test 5: Responsive
```
Action: Resize browser window
Expected: Chart scales appropriately
```

## Rollback Plan

If Plotly has issues:
1. Keep SVG fallback code
2. Add conditional rendering
3. Use SVG if Plotly fails to load

```typescript
{plotlyAvailable ? (
  <InteractiveWindRose ... />
) : (
  <svg>...</svg>  // Current SVG fallback
)}
```

## Dependencies

### Already Installed
- ✅ `react-plotly.js` (used by petro agent)
- ✅ `plotly.js` (peer dependency)

### No New Dependencies Needed!

## File Changes

### New Files
1. `src/components/renewable/InteractiveWindRose.tsx` (new component)

### Modified Files
1. `src/components/renewable/WindRoseArtifact.tsx` (use new component)

### No Backend Changes
- ✅ Backend data structure already perfect
- ✅ No Lambda changes needed
- ✅ No Docker needed
- ✅ No S3 changes needed

## Success Criteria

- ✅ Wind rose renders as interactive Plotly chart
- ✅ Hover tooltips show detailed information
- ✅ Zoom and pan work smoothly
- ✅ Export to PNG works (high-res)
- ✅ Matches petro agent quality
- ✅ No backend changes required
- ✅ Works with existing data structure

## Next Steps

1. **Review this plan** - Confirm approach
2. **Create InteractiveWindRose component** - Plotly polar chart
3. **Update WindRoseArtifact** - Use new component
4. **Test interactivity** - Verify all features work
5. **Deploy and validate** - End-to-end testing

---

**Status**: PLAN READY  
**Approach**: Client-side Plotly (matches petro agent)  
**Complexity**: Low (reuse existing patterns)  
**Time**: ~1.5 hours  
**Risk**: Low (no backend changes, proven pattern)
