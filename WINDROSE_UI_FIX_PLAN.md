# WindRose UI and Plotly Integration - Fix Plan

## Issues Identified

### 1. WindRose Plotly Data Format
**Status:** ⚠️ Partially Fixed
- Wind rose analysis (`action: 'wind_rose'`) correctly returns Plotly format
- Component expects `plotlyWindRose.data` and `plotlyWindRose.layout`
- **Problem:** Some artifacts may still have legacy format

### 2. Duplicate Content in Wake Analysis
**Status:** ❌ Not Fixed
- Diagnostic found 6 title fields and 8 heading occurrences
- Multiple nested structures with their own titles
- Content sections repeated

### 3. Component Error Handling
**Status:** ⚠️ Partial
- Components have some error handling
- Missing comprehensive error boundaries
- Loading states could be improved

## Root Causes

### Plotly Format Issue
The simulation handler at `amplify/functions/renewableTools/simulation/handler.py` correctly generates Plotly data:

```python
# Line ~395
if plotly_wind_rose_data:
    response_data['plotlyWindRose'] = {
        'data': plotly_wind_rose_data['data'],
        'layout': plotly_wind_rose_data['layout'],
        'statistics': plotly_wind_rose_data['statistics']
    }
```

The `generate_plotly_wind_rose()` function returns correct format:
```python
return {
    'data': wind_rose_data['plotly_traces'],  # ✅ Correct
    'layout': layout,                          # ✅ Correct
    'statistics': wind_rose_data['statistics'],
    ...
}
```

**However:** The response also includes legacy `windRoseData` array which may confuse components.

### Duplicate Titles Issue
Multiple places add titles:
1. Top-level `title` field
2. Top-level `subtitle` field  
3. Nested visualization objects with their own `title` fields
4. Chart metadata with titles

Example from handler (line ~370):
```python
response_data = {
    'messageContentType': 'wind_rose_analysis',
    'title': f'Wind Rose Analysis - {project_id}',      # Title 1
    'subtitle': f'Wind analysis for location...',        # Title 2
    ...
    'visualizations': {
        'wind_rose': {
            'title': 'Wind Rose Analysis'                # Title 3 (duplicate!)
        }
    }
}
```

## Fixes Required

### Fix 1: Clean Up Response Structure

**File:** `amplify/functions/renewableTools/simulation/handler.py`

**Changes:**
1. Remove duplicate title fields from nested objects
2. Keep only one `title` at artifact level
3. Remove `subtitle` if it's redundant
4. Ensure `plotlyWindRose` is always present when wind data is available

**Code Changes:**

```python
# Around line 367-415
response_data = {
    'messageContentType': 'wind_rose_analysis',
    'title': f'Wind Rose Analysis - {project_id}',  # Keep this
    # Remove subtitle if redundant
    'projectId': project_id,
    'coordinates': {'lat': latitude, 'lng': longitude},
    # Remove windRoseData array - use Plotly format only
    'windStatistics': {
        'averageSpeed': round(avg_speed, 2),
        'maxSpeed': round(max_speed, 2),
        'predominantDirection': prevailing_dir_name,
        'totalFrequency': total_frequency,
        'directionCount': len(wind_rose_data)
    },
    's3Data': {
        'bucket': S3_BUCKET,
        'dataKey': data_key,
        'dataUrl': f'https://{S3_BUCKET}.s3.amazonaws.com/{data_key}'
    },
    'dataSource': 'NREL Wind Toolkit',
    'dataYear': 2023,
    'dataPoints': len(wind_speeds),
    'reliability': 'high',
    'message': f'Wind rose analysis complete using NREL data'
}

# Add Plotly wind rose data (REQUIRED)
if plotly_wind_rose_data:
    response_data['plotlyWindRose'] = {
        'data': plotly_wind_rose_data['data'],
        'layout': plotly_wind_rose_data['layout'],
        'statistics': plotly_wind_rose_data['statistics']
    }
else:
    # If Plotly generation failed, return error
    logger.error("Failed to generate Plotly wind rose data")
    return {
        'success': False,
        'type': 'wind_rose_analysis',
        'error': 'Failed to generate wind rose visualization',
        'errorCategory': 'VISUALIZATION_ERROR'
    }

# Remove visualization URLs with duplicate titles
# Keep only if needed for fallback
if wind_rose_url:
    response_data['fallbackVisualization'] = wind_rose_url
```

### Fix 2: Update Component to Require Plotly Format

**File:** `src/components/renewable/WindRoseArtifact.tsx`

**Changes:**
1. Make `plotlyWindRose` required (not optional)
2. Show error if Plotly data is missing
3. Remove legacy format support

**Code Changes:**

```typescript
interface WindRoseArtifactProps {
  data: {
    messageContentType: 'wind_rose_analysis';
    title: string;
    projectId: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    windStatistics: {
      averageSpeed: number;
      maxSpeed: number;
      predominantDirection: string;
      directionCount: number;
    };
    // Plotly wind rose data (REQUIRED)
    plotlyWindRose: {  // Remove the '?' to make it required
      data: any[];
      layout: any;
      statistics: {
        average_speed: number;
        max_speed: number;
        prevailing_direction: string;
        prevailing_frequency: number;
      };
      dataSource?: string;
      dataYear?: number;
      dataQuality?: 'high' | 'medium' | 'low';
    };
    // Remove legacy format support
    // windRoseData?: WindRoseData[];  // DELETE THIS
    // metrics?: {...};                 // DELETE THIS
    error?: {
      code: string;
      message: string;
      instructions?: string;
    };
  };
  actions?: ActionButton[];
  onFollowUpAction?: (action: string) => void;
}

// In component body, add validation
const WindRoseArtifact: React.FC<WindRoseArtifactProps> = ({ data, actions, onFollowUpAction }) => {
  // Validate Plotly data exists
  if (!data.plotlyWindRose || !data.plotlyWindRose.data || !data.plotlyWindRose.layout) {
    return (
      <Container
        header={<Header variant="h2">Wind Rose Analysis Error</Header>}
      >
        <Alert type="error" header="Visualization Data Missing">
          The wind rose visualization data is not available. Please try regenerating the analysis.
        </Alert>
      </Container>
    );
  }
  
  // Rest of component...
}
```

### Fix 3: Remove Duplicate Titles from Wake Simulation

**File:** `amplify/functions/renewableTools/simulation/handler.py`

**Changes:**
1. Remove duplicate title fields from visualization objects
2. Simplify nested structures

**Code Changes:**

```python
# Around line 739-743
viz_data = {
    'wind_rose': {
        'type': 'matplotlib_chart', 
        'image_bytes': wind_rose_bytes
        # Remove 'title': 'Wind Rose Analysis' - duplicate!
    },
    'wake_heat_map': {
        'type': 'folium_map', 
        'html_content': wake_analysis_map_html
        # Remove 'title': 'Wake Analysis Heat Map' - duplicate!
    },
    'seasonal_analysis': {
        'type': 'matplotlib_chart', 
        'image_bytes': seasonal_chart
        # Remove 'title': 'Seasonal Wind Analysis' - duplicate!
    },
    'variability_analysis': {
        'type': 'matplotlib_chart', 
        'image_bytes': variability_chart
        # Remove 'title': 'Wind Resource Variability' - duplicate!
    }
}
```

### Fix 4: Add Error Boundaries to Components

**File:** `src/components/renewable/WindRoseArtifact.tsx`

**Changes:**
1. Wrap Plotly component in error boundary
2. Add try-catch for data processing

**Code Changes:**

```typescript
// Add error boundary wrapper
class WindRoseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert type="error" header="Visualization Error">
          Failed to render wind rose chart: {this.state.error?.message}
        </Alert>
      );
    }
    return this.props.children;
  }
}

// Wrap PlotlyWindRose in error boundary
<WindRoseErrorBoundary>
  <PlotlyWindRose
    data={data.plotlyWindRose.data}
    layout={data.plotlyWindRose.layout}
    statistics={data.plotlyWindRose.statistics}
  />
</WindRoseErrorBoundary>
```

## Testing Plan

### 1. Unit Tests
- Test Plotly data format validation
- Test error boundary behavior
- Test component with missing data

### 2. Integration Tests
- Test wind rose analysis end-to-end
- Test wake simulation with wind rose
- Test error scenarios

### 3. Manual Testing
1. Run wind rose analysis
2. Verify Plotly chart renders
3. Check for duplicate titles
4. Test error handling
5. Verify no console errors

## Deployment Steps

1. **Update Backend:**
   ```bash
   # Make changes to simulation/handler.py
   # Restart sandbox
   npx ampx sandbox
   ```

2. **Update Frontend:**
   ```bash
   # Make changes to WindRoseArtifact.tsx
   # Next.js will hot-reload
   ```

3. **Test:**
   ```bash
   node tests/test-windrose-data-format.js
   ```

4. **Validate:**
   - Open chat interface
   - Run: "analyze wind rose at 30.2672, -97.7431"
   - Verify chart displays correctly
   - Check browser console for errors

## Success Criteria

- ✅ Wind rose charts display using Plotly format
- ✅ No duplicate titles in any artifacts
- ✅ Proper error messages for failures
- ✅ No console errors
- ✅ Smooth user experience
- ✅ All tests pass

## Rollback Plan

If issues occur:
1. Revert backend changes: `git checkout HEAD~1 amplify/functions/renewableTools/simulation/handler.py`
2. Revert frontend changes: `git checkout HEAD~1 src/components/renewable/WindRoseArtifact.tsx`
3. Restart sandbox: `npx ampx sandbox`

## Next Steps

1. Implement Fix 1 (backend response cleanup)
2. Test backend changes
3. Implement Fix 2 (component updates)
4. Test frontend changes
5. Implement Fix 3 (remove duplicate titles)
6. Implement Fix 4 (error boundaries)
7. Full integration testing
8. User acceptance testing
