# Design Document

## Overview

This design addresses two distinct issues:
1. **UI Layout**: Repositioning action buttons to top right with proper text wrapping
2. **Data Flow**: Ensuring Plotly wind rose data flows from backend → orchestrator → frontend

## Architecture

### Component Hierarchy
```
WindRoseArtifact (Container)
├── Header (Cloudscape Container Header)
│   ├── Title (left-aligned, wraps at 20px from actions)
│   ├── Description (below title)
│   └── Actions (top right)
│       ├── Badges (avg speed, prevailing direction)
│       └── Export Button
└── Content
    ├── ActionButtons (contextual follow-ups)
    ├── Statistics Grid (4 columns)
    └── Wind Rose Visualization
        ├── PlotlyWindRose (if plotlyWindRose data present) ← PRIORITY
        ├── Matplotlib PNG (if visualizationUrl present) ← FALLBACK
        └── SVG Fallback (if windRoseData present) ← LAST RESORT
```

### Data Flow

```
User Query: "show me a wind rose for 35.067482, -101.395466"
    ↓
Orchestrator (renewableOrchestrator/handler.ts)
    ↓
Simulation Lambda (renewableTools/simulation/handler.py)
    ├── Generates wind data (16 directions)
    ├── Calls plotly_wind_rose_generator.py
    │   └── Returns { data: [...], layout: {...}, statistics: {...} }
    ├── Saves Plotly JSON to S3
    ├── Generates matplotlib PNG (fallback)
    └── Returns response with plotlyWindRose field
    ↓
Orchestrator receives response
    ├── Maps to wind_rose_analysis artifact
    ├── MUST include plotlyWindRose field ← FIX NEEDED
    └── Returns to frontend
    ↓
ChatMessage component
    ↓
WindRoseArtifact component
    ├── Checks for data.plotlyWindRose ← PRIORITY CHECK
    ├── If present: renders PlotlyWindRose
    └── If not: falls back to PNG or SVG
```

## Components and Interfaces

### 1. Orchestrator Changes

**File**: `amplify/functions/renewableOrchestrator/handler.ts`

**Current Code** (lines 1610-1628):
```typescript
case 'wind_rose':
case 'wind_rose_analysis':
  artifact = {
    type: 'wind_rose_analysis',
    data: {
      messageContentType: 'wind_rose_analysis',
      title: result.data.title || `Wind Rose Analysis - ${result.data.projectId}`,
      subtitle: result.data.subtitle,
      projectId: result.data.projectId,
      coordinates: result.data.coordinates || result.data.location,
      location: result.data.location,
      windRoseData: result.data.windRoseData,
      windStatistics: result.data.windStatistics,
      s3_data: result.data.s3_data,
      message: result.data.message
    },
    actions
  };
  break;
```

**Required Change**:
```typescript
case 'wind_rose':
case 'wind_rose_analysis':
  artifact = {
    type: 'wind_rose_analysis',
    data: {
      messageContentType: 'wind_rose_analysis',
      title: result.data.title || `Wind Rose Analysis - ${result.data.projectId}`,
      subtitle: result.data.subtitle,
      projectId: result.data.projectId,
      coordinates: result.data.coordinates || result.data.location,
      location: result.data.location,
      windRoseData: result.data.windRoseData,
      windStatistics: result.data.windStatistics,
      plotlyWindRose: result.data.plotlyWindRose,  // ← ADD THIS LINE
      visualizationUrl: result.data.visualizations?.wind_rose || result.data.windRoseUrl,  // ← ADD FALLBACK
      s3_data: result.data.s3_data,
      message: result.data.message
    },
    actions
  };
  break;
```

### 2. WindRoseArtifact UI Changes

**File**: `src/components/renewable/WindRoseArtifact.tsx`

**Current Header** (lines 113-135):
```typescript
<Header
  variant="h2"
  description="Professional wind resource analysis with directional frequency distribution"
  actions={
    <SpaceBetween direction="horizontal" size="xs">
      {stats && (
        <>
          <Badge color="blue">
            {getAvgSpeed().toFixed(1)} m/s avg
          </Badge>
          <Badge color="green">
            {stats.prevailingDirection} prevailing
          </Badge>
        </>
      )}
      <Button
        iconName="download"
        variant="normal"
        onClick={handleExportData}
      >
        Export Data
      </Button>
    </SpaceBetween>
  }
>
  {data.title}
</Header>
```

**Analysis**: The Cloudscape `Header` component already positions the `actions` prop in the top right. The issue is that the title might not be wrapping properly. We need to ensure the title has proper max-width.

**Required Change**: Add CSS to ensure title wraps with 20px margin:
```typescript
<Header
  variant="h2"
  description="Professional wind resource analysis with directional frequency distribution"
  actions={
    <SpaceBetween direction="horizontal" size="xs">
      {stats && (
        <>
          <Badge color="blue">
            {getAvgSpeed().toFixed(1)} m/s avg
          </Badge>
          <Badge color="green">
            {stats.prevailingDirection} prevailing
          </Badge>
        </>
      )}
      <Button
        iconName="download"
        variant="normal"
        onClick={handleExportData}
      >
        Export Data
      </Button>
    </SpaceBetween>
  }
>
  <div style={{ maxWidth: 'calc(100% - 320px)', paddingRight: '20px' }}>
    {data.title}
  </div>
</Header>
```

**Visualization Priority** (lines 165-230):

Current logic already checks for `plotlyWindRose` first, which is correct:
```typescript
{data.plotlyWindRose ? (
  // Use Plotly interactive wind rose (preferred)
  <PlotlyWindRose ... />
) : (data.visualizationUrl || data.windRoseUrl || data.mapUrl) ? (
  // Fallback to matplotlib PNG
  <img src={...} />
) : windRoseData.length > 0 ? (
  // SVG fallback
  ...
) : (
  // No data
  ...
)}
```

This logic is correct. The issue is that `data.plotlyWindRose` is undefined because the orchestrator isn't passing it through.

## Data Models

### Backend Response (simulation/handler.py)
```python
{
  'success': True,
  'type': 'wind_rose_analysis',
  'data': {
    'messageContentType': 'wind_rose_analysis',
    'title': str,
    'subtitle': str,
    'projectId': str,
    'coordinates': {'lat': float, 'lng': float},
    'windRoseData': [...],
    'windStatistics': {...},
    'plotlyWindRose': {  # ← THIS IS GENERATED
      'data': [...],     # Plotly traces
      'layout': {...},   # Plotly layout
      'statistics': {...}
    },
    'visualizations': {
      'wind_rose': str  # PNG URL
    },
    'windRoseUrl': str,
    'mapUrl': str,
    's3Data': {...},
    'message': str
  }
}
```

### Orchestrator Artifact (handler.ts)
```typescript
{
  type: 'wind_rose_analysis',
  data: {
    messageContentType: 'wind_rose_analysis',
    title: string,
    subtitle?: string,
    projectId: string,
    coordinates?: {lat: number, lng: number},
    windRoseData: WindRoseData[],
    windStatistics: {...},
    plotlyWindRose?: {  # ← MUST BE ADDED
      data: any[],
      layout: any,
      statistics: any
    },
    visualizationUrl?: string,  # ← SHOULD BE ADDED
    s3_data?: any,
    message?: string
  },
  actions?: ActionButton[]
}
```

### Frontend Props (WindRoseArtifact.tsx)
```typescript
interface WindRoseArtifactProps {
  data: {
    messageContentType: 'wind_rose_analysis';
    title: string;
    subtitle?: string;
    projectId: string;
    coordinates?: {lat: number; lng: number};
    visualizationUrl?: string;
    windRoseUrl?: string;
    mapUrl?: string;
    windRoseData: WindRoseData[];
    windStatistics: {...};
    plotlyWindRose?: {  # ← ALREADY DEFINED
      data: any[];
      layout: any;
      statistics: {...};
    };
    // ... other fields
  };
  actions?: ActionButton[];
  onFollowUpAction?: (action: string) => void;
}
```

## Error Handling

### Missing Plotly Data
- **Scenario**: Backend fails to generate Plotly data
- **Handling**: Fall back to matplotlib PNG if available
- **User Experience**: User sees static PNG instead of interactive chart

### Missing All Visualizations
- **Scenario**: Both Plotly and matplotlib fail
- **Handling**: Render SVG fallback using windRoseData
- **User Experience**: User sees basic SVG wind rose

### No Data
- **Scenario**: No wind data available
- **Handling**: Display "No wind data available" message
- **User Experience**: Clear message explaining why visualization is missing

## Testing Strategy

### Unit Tests
1. Test WindRoseArtifact with plotlyWindRose data → renders PlotlyWindRose
2. Test WindRoseArtifact without plotlyWindRose → falls back to PNG
3. Test WindRoseArtifact without PNG → falls back to SVG
4. Test header title wrapping with long titles

### Integration Tests
1. Test orchestrator passes through plotlyWindRose field
2. Test end-to-end flow: query → backend → orchestrator → frontend
3. Test visualization priority: Plotly > PNG > SVG > None

### Visual Tests
1. Verify Export button appears in top right
2. Verify title wraps with 20px margin
3. Verify Plotly wind rose renders with dark background
4. Verify interactive features work (hover, zoom, pan)

## Implementation Notes

### Why Plotly Isn't Showing
The backend IS generating Plotly data (confirmed in simulation/handler.py lines 220-240), but the orchestrator is NOT passing it through to the frontend (handler.ts lines 1610-1628). This is a simple data mapping issue.

### Why Export Button Position Matters
Consistent UI patterns improve usability. All other artifacts (terrain, layout, simulation) have action buttons in the top right. Wind rose should match this pattern.

### Performance Considerations
- Plotly bundle is ~3MB but already loaded for other visualizations
- Interactive wind rose provides significantly better UX than static PNG
- PNG fallback ensures functionality even if Plotly fails to load
