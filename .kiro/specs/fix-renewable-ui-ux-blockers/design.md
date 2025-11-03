# Design Document: Fix Renewable UI/UX Blockers

## Overview

This design addresses critical UI/UX blockers in the renewable energy workflow by implementing fixes for perimeter circle clickthrough, intelligent placement validation, OSM feature preservation, and action button functionality. The design emphasizes **visual validation** - proving features work in the browser, not just in tests.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LayoutMapArtifact.tsx                                 │ │
│  │  - Renders turbines + OSM features                     │ │
│  │  - Displays algorithm metadata                         │ │
│  │  - Perimeter with pointer-events: none                 │ │
│  │  - Action buttons (wake simulation, etc.)              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Backend (Lambda Functions)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layout Handler (simple_handler.py)                    │ │
│  │  - Calls intelligent_placement.py                      │ │
│  │  - Logs algorithm selection                            │ │
│  │  - Merges OSM features with turbines                   │ │
│  │  - Returns metadata with algorithm proof               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Intelligent Placement (intelligent_placement.py)      │ │
│  │  - Avoids buildings, roads, water                      │ │
│  │  - Returns turbine positions + decisions               │ │
│  │  - Logs constraint application                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Layout Handler Enhancement

**File:** `amplify/functions/renewableTools/layout/simple_handler.py`

**Purpose:** Orchestrate intelligent placement and merge OSM features with turbine layout

**Key Changes:**
- Import `intelligent_placement` module
- Add comprehensive logging at each step
- Extract OSM features from project context
- Call intelligent placement with terrain constraints
- Merge OSM features with turbine GeoJSON
- Return algorithm metadata for UI display

**Interface:**

```python
# Input Event Structure
{
    "parameters": {
        "project_id": str,
        "latitude": float,
        "longitude": float,
        "area_km2": float,
        "num_turbines": int,
        "spacing_m": float
    },
    "project_context": {
        "terrain_results": {
            "geojson": {
                "type": "FeatureCollection",
                "features": [
                    # OSM buildings, roads, water bodies
                ]
            },
            "exclusionZones": {
                "buildings": [...],
                "roads": [...],
                "waterBodies": [...]
            }
        }
    }
}

# Output Response Structure
{
    "success": true,
    "data": {
        "messageContentType": "wind_farm_layout",
        "projectId": str,
        "geojson": {
            "type": "FeatureCollection",
            "features": [
                # Turbines (Point features)
                # OSM buildings (Polygon features)
                # OSM roads (LineString features)
                # OSM water bodies (Polygon features)
                # Perimeter (Polygon feature)
            ]
        },
        "metadata": {
            "algorithm": "intelligent_placement",
            "algorithm_proof": "INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED",
            "constraints_applied": int,
            "terrain_features_considered": [str],
            "placement_decisions": [
                {
                    "turbine_id": str,
                    "position": [lat, lon],
                    "avoided_features": [str],
                    "wind_exposure_score": float,
                    "placement_reason": str
                }
            ],
            "layout_metadata": {
                "total_turbines": int,
                "site_area_km2": float,
                "available_area_km2": float,
                "average_spacing_m": float
            }
        }
    }
}
```

### 2. Intelligent Placement Algorithm

**File:** `amplify/functions/renewableTools/layout/intelligent_placement.py`

**Purpose:** Place turbines intelligently based on terrain constraints

**Algorithm Flow:**

```
1. Receive center coordinates, radius, exclusion zones, spacing
2. Generate hexagonal grid of candidate positions
3. Filter candidates that are too close to exclusion zones:
   - Buildings: 100m safety margin
   - Roads: 150m safety margin  
   - Water bodies: 100m safety margin
4. Select best positions with minimum spacing
5. Return positions with placement decisions
```

**Key Features:**
- Pure Python implementation (no numpy/shapely)
- Hexagonal grid for better coverage
- Bounding box checks for performance
- Fallback to grid if insufficient valid positions
- Detailed logging of decisions

### 3. Frontend Map Component

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

**Purpose:** Render turbines and OSM features on interactive map

**Key Changes:**

1. **Algorithm Metadata Display:**
```typescript
{data.metadata && (
  <Alert severity="info" sx={{ mb: 2 }}>
    <Typography variant="subtitle2">
      <strong>Algorithm:</strong> {data.metadata.algorithm}
    </Typography>
    <Typography variant="body2">
      <strong>Proof:</strong> {data.metadata.algorithm_proof}
    </Typography>
    <Typography variant="body2">
      Constraints applied: {data.metadata.constraints_applied}
    </Typography>
    <Typography variant="body2">
      Features considered: {data.metadata.terrain_features_considered?.join(', ')}
    </Typography>
  </Alert>
)}
```

2. **OSM Feature Rendering:**
```typescript
// Render all features from GeoJSON
data.geojson.features.forEach(feature => {
  const featureType = feature.properties.type;
  
  if (featureType === 'turbine') {
    // Render turbine marker (blue icon)
    L.marker([lat, lon], { icon: turbineIcon })
      .bindPopup(turbineInfo)
      .addTo(map);
  }
  else if (featureType === 'building') {
    // Render building polygon (red fill)
    L.geoJSON(feature, {
      style: { color: '#ff0000', fillOpacity: 0.3 }
    }).addTo(map);
  }
  else if (featureType === 'road') {
    // Render road line (gray)
    L.geoJSON(feature, {
      style: { color: '#666666', weight: 2 }
    }).addTo(map);
  }
  else if (featureType === 'water') {
    // Render water polygon (blue fill)
    L.geoJSON(feature, {
      style: { color: '#0000ff', fillOpacity: 0.3 }
    }).addTo(map);
  }
  else if (featureType === 'perimeter') {
    // Render perimeter with clickthrough
    L.geoJSON(feature, {
      style: { 
        color: '#333333', 
        weight: 3, 
        dashArray: '10, 10',
        fillOpacity: 0,
        className: 'perimeter-non-interactive'
      }
    }).addTo(map);
  }
});
```

3. **Perimeter Clickthrough CSS:**
```css
.perimeter-non-interactive {
  pointer-events: none !important;
}
```

4. **Placement Decisions Table:**
```typescript
{data.metadata?.placement_decisions && (
  <Accordion>
    <AccordionSummary>
      Intelligent Placement Decisions
    </AccordionSummary>
    <AccordionDetails>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Turbine ID</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Avoided Features</TableCell>
            <TableCell>Wind Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.metadata.placement_decisions.map(decision => (
            <TableRow key={decision.turbine_id}>
              <TableCell>{decision.turbine_id}</TableCell>
              <TableCell>{decision.position}</TableCell>
              <TableCell>{decision.avoided_features}</TableCell>
              <TableCell>{decision.wind_exposure_score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AccordionDetails>
  </Accordion>
)}
```

### 4. Action Buttons Component

**File:** `src/components/renewable/ActionButtons.tsx`

**Purpose:** Provide workflow progression buttons

**Key Changes:**

1. **Unique Keys:**
```typescript
{actions.map((action, index) => (
  <Button
    key={`${action.label}-${action.type}-${index}`}
    onClick={() => handleAction(action)}
  >
    {action.label}
  </Button>
))}
```

2. **Wake Simulation Handler:**
```typescript
const handleWakeSimulation = async () => {
  console.log('🌊 Wake simulation button clicked');
  setLoading(true);
  
  try {
    const query = `run wake simulation for ${projectName}`;
    await sendMessage(query);
    console.log('✅ Wake simulation request sent');
  } catch (error) {
    console.error('❌ Wake simulation failed:', error);
  } finally {
    setLoading(false);
  }
};
```

3. **Cleanup:**
```typescript
useEffect(() => {
  return () => {
    // Cleanup to prevent duplicates
  };
}, []);
```

## Data Models

### OSM Feature Types

```typescript
interface OSMFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    type: 'building' | 'road' | 'water' | 'turbine' | 'perimeter';
    name?: string;
    osm_id?: string;
    // Additional OSM properties
  };
}
```

### Layout Metadata

```typescript
interface LayoutMetadata {
  algorithm: 'intelligent_placement' | 'grid';
  algorithm_proof: string;
  constraints_applied: number;
  terrain_features_considered: string[];
  placement_decisions: PlacementDecision[];
  layout_metadata: {
    total_turbines: number;
    site_area_km2: number;
    available_area_km2: number;
    average_spacing_m: number;
  };
}

interface PlacementDecision {
  turbine_id: string;
  position: [number, number];
  avoided_features: string[];
  wind_exposure_score: number;
  placement_reason: string;
}
```

## Data Flow

### Complete Workflow Data Flow

```
1. Terrain Analysis
   ↓
   Stores OSM features in project context
   {
     terrain_results: {
       geojson: { features: [...] },
       exclusionZones: { buildings, roads, waterBodies }
     }
   }

2. Layout Optimization
   ↓
   Receives terrain data from context
   ↓
   Calls intelligent_placement with exclusion zones
   ↓
   Merges OSM features with turbine positions
   ↓
   Returns combined GeoJSON + metadata

3. Frontend Rendering
   ↓
   Receives combined GeoJSON
   ↓
   Renders all features on map:
   - Turbines (blue markers)
   - Buildings (red polygons)
   - Roads (gray lines)
   - Water (blue polygons)
   - Perimeter (dashed line, non-interactive)
   ↓
   Displays algorithm metadata
   ↓
   Shows placement decisions table
```

## Error Handling

### Backend Error Handling

```python
def handler(event, context):
    try:
        # Extract terrain data
        terrain_features = event.get('project_context', {}).get('terrain_results', {}).get('geojson', {}).get('features', [])
        
        if not terrain_features:
            logger.warning("No terrain features provided - using basic grid")
            # Fall back to grid placement
        
        # Call intelligent placement
        try:
            positions = intelligent_turbine_placement(...)
        except Exception as e:
            logger.error(f"Intelligent placement failed: {e}")
            # Fall back to grid placement
            positions = basic_grid_placement(...)
        
        # Return response
        return {
            'success': True,
            'data': {...}
        }
        
    except Exception as e:
        logger.error(f"Layout handler failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }
```

### Frontend Error Handling

```typescript
// Graceful degradation if metadata missing
const algorithmName = data.metadata?.algorithm || 'unknown';
const algorithmProof = data.metadata?.algorithm_proof || 'Not provided';

// Defensive rendering
{data.geojson?.features?.length > 0 ? (
  <Map features={data.geojson.features} />
) : (
  <Alert severity="warning">No layout data available</Alert>
)}
```

## Testing Strategy

### Visual Validation (Primary)

**User must validate in browser:**

1. **Intelligent Placement Visual Check:**
   - [ ] Turbines are NOT in a regular grid
   - [ ] Turbines visibly avoid buildings (red polygons)
   - [ ] Turbines visibly avoid roads (gray lines)
   - [ ] Turbines visibly avoid water (blue polygons)
   - [ ] Spacing between turbines is irregular

2. **Algorithm Metadata Check:**
   - [ ] Blue info box shows "Algorithm: intelligent_placement"
   - [ ] Shows "Proof: INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED"
   - [ ] Shows number of constraints applied
   - [ ] Shows terrain features considered

3. **OSM Overlay Check:**
   - [ ] Buildings visible as red polygons
   - [ ] Roads visible as gray lines
   - [ ] Water bodies visible as blue polygons
   - [ ] Perimeter visible as dashed line
   - [ ] All features render on same map

4. **Clickthrough Check:**
   - [ ] Can click turbines through perimeter
   - [ ] Can click buildings through perimeter
   - [ ] Perimeter doesn't show pointer cursor

5. **Action Buttons Check:**
   - [ ] Each button appears exactly once
   - [ ] Wake simulation button triggers analysis
   - [ ] No duplicate buttons after re-render

### CloudWatch Logs Validation

**Required log entries:**

```
="============================================================"
LAYOUT OPTIMIZATION STARTING
Algorithm selection: INTELLIGENT PLACEMENT
="============================================================"
Received 47 terrain features from context
Calling intelligent_placement.py with 47 terrain constraints
Terrain features: ['building', 'road', 'water', ...]
="============================================================"
🎯 INTELLIGENT TURBINE PLACEMENT (Pure Python)
   Target: 25 turbines
   Spacing: 500m between turbines
   Radius: 2.5km
="============================================================"
   Exclusion zones: 15 buildings, 8 roads, 3 water bodies
   Generated 1024 candidate positions
   512 candidates avoid exclusion zones
✅ Placed 25 turbines intelligently
   Avoided 26 terrain constraints
="============================================================"
Intelligent placement returned 25 turbines
  Turbine T001: (35.067, -101.395) - avoided: ['building_123', 'road_456']
  Turbine T002: (35.068, -101.394) - avoided: ['water_789']
  ...
Returning 72 total features (47 terrain + 25 turbines)
="============================================================"
```

### Automated Tests (Secondary)

```javascript
// Test 1: Verify intelligent placement is called
test('Layout handler calls intelligent placement', async () => {
  const result = await invokeLayoutLambda({
    parameters: {...},
    project_context: {
      terrain_results: { features: [...] }
    }
  });
  
  expect(result.data.metadata.algorithm).toBe('intelligent_placement');
  expect(result.data.metadata.algorithm_proof).toBe('INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED');
});

// Test 2: Verify OSM features are merged
test('Layout response includes OSM features', async () => {
  const result = await invokeLayoutLambda({...});
  
  const features = result.data.geojson.features;
  const buildings = features.filter(f => f.properties.type === 'building');
  const roads = features.filter(f => f.properties.type === 'road');
  const turbines = features.filter(f => f.properties.type === 'turbine');
  
  expect(buildings.length).toBeGreaterThan(0);
  expect(roads.length).toBeGreaterThan(0);
  expect(turbines.length).toBeGreaterThan(0);
});

// Test 3: Verify perimeter clickthrough CSS
test('Perimeter has pointer-events none', () => {
  render(<LayoutMapArtifact data={mockData} />);
  
  const perimeterElement = screen.getByClassName('perimeter-non-interactive');
  const styles = window.getComputedStyle(perimeterElement);
  
  expect(styles.pointerEvents).toBe('none');
});
```

## Performance Considerations

### Backend Performance

- **Intelligent Placement:** O(n*m) where n=candidates, m=exclusion zones
  - Typical: 1000 candidates × 50 zones = 50,000 checks
  - Execution time: ~500ms
  - Acceptable for user workflow

- **GeoJSON Merging:** O(n) where n=total features
  - Typical: 50 terrain + 25 turbines = 75 features
  - Execution time: <10ms
  - Negligible overhead

### Frontend Performance

- **Map Rendering:** Leaflet handles 100s of features efficiently
  - 75 features renders in <100ms
  - No performance issues expected

- **Metadata Display:** Simple React rendering
  - Negligible performance impact

## Security Considerations

- **Input Validation:** Validate coordinates, area, turbine count
- **S3 Access:** Use bucket policies for public read access
- **Lambda Permissions:** Minimal IAM permissions for S3 access
- **XSS Prevention:** Sanitize feature properties before display

## Deployment Strategy

### Phase 1: Backend Deployment

```bash
# Deploy Lambda changes
npx ampx sandbox

# Verify deployment
aws lambda list-functions | grep layout
```

### Phase 2: Frontend Deployment

```bash
# Build frontend
npm run build

# Deploy via Amplify hosting
# (Automatic on git push)
```

### Phase 3: Validation

1. Check CloudWatch logs for algorithm logging
2. Test in browser with real query
3. Validate visual appearance
4. Confirm clickthrough works
5. Test action buttons

## Rollback Plan

If issues occur:

1. **Backend Issues:**
   - Revert to previous Lambda version
   - Check CloudWatch logs for errors
   - Verify S3 permissions

2. **Frontend Issues:**
   - Revert git commit
   - Clear browser cache
   - Check browser console for errors

## Success Metrics

- **User Validation:** User confirms they see intelligent placement in browser
- **Visual Proof:** Screenshots show turbines avoiding obstacles
- **Log Proof:** CloudWatch logs show "INTELLIGENT PLACEMENT" messages
- **Workflow Completion:** User can complete full workflow without blockers
- **Zero Regressions:** Existing functionality continues to work

## Conclusion

This design provides a comprehensive solution to the UI/UX blockers by:

1. **Proving intelligent placement works** through visual validation and logging
2. **Preserving OSM features** throughout the workflow for context
3. **Fixing perimeter clickthrough** to enable map interaction
4. **Fixing action buttons** to enable workflow progression

The emphasis on **visual validation** ensures we're not just claiming features work, but actually proving they work in the browser where users can see them.
