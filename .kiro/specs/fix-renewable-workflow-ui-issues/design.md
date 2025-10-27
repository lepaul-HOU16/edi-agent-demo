# Design Document: Fix Renewable Workflow UI Issues

## Overview

This design addresses critical gaps in the renewable energy workflow where artifacts are missing key data elements (action buttons, perimeter features, terrain features, turbine markers, wake heat maps) and where intent detection is misrouting queries. The solution involves fixes at three layers: backend Lambda functions (data generation), orchestrator (artifact formatting), and frontend components (rendering and error handling).

### Workflow Flow (Based on Notebook Demo)

The correct workflow sequence from the demo notebooks is:

**USER STEP 1: Initial Site Analysis**
1. User provides location (lat/lon), capacity target, turbine model
2. System retrieves terrain data (satellite, maps, OSM features)
3. System obtains wind data (NREL Wind Toolkit)
4. System analyzes site constraints and generates initial layout
5. **CTA: "Optimize Turbine Layout"** → Proceed to layout optimization
6. **CTA: "View Project Dashboard"** → Always accessible

**USER STEP 2: Layout Optimization & Wake Analysis**
1. System generates optimized turbine placement
2. User validates layout and can request modifications
3. System calculates wake effects using PyWake
4. System calculates energy yield
5. **CTA: "Run Wake Simulation"** → Proceed to wake analysis
6. **CTA: "View Project Dashboard"** → Always accessible
7. **CTA: "Refine Layout"** → Iterate on layout

**USER STEP 3: Financial Analysis & Reporting**
1. System calculates approximate costs (interconnection, land, etc.)
2. System calculates LCOE (optional)
3. User validates and can add constraints
4. **CTA: "Generate Report"** → Produce comprehensive report
5. **CTA: "Financial Analysis"** → Calculate ROI and economics
6. **CTA: "View Project Dashboard"** → Always accessible

**Key Principle:** Dashboard must be accessible at every step, not just at the end.

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  - LayoutMapArtifact.tsx                                    │
│  - WakeAnalysisArtifact.tsx                                 │
│  - WorkflowCTAButtons.tsx                                   │
│  - ActionButtons.tsx                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Artifacts with actions
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Orchestrator Layer                         │
│  - handler.ts (formatArtifacts)                             │
│  - RenewableIntentClassifier.ts                             │
│  - actionButtonTypes.ts (generateActionButtons)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Tool invocation
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Tool Lambda Layer                         │
│  - terrain/handler.py (perimeter generation)                │
│  - layout/handler.py (terrain + turbine GeoJSON)            │
│  - simulation/handler.py (wake heat map)                    │
│  - report/handler.py (financial analysis)                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Backend Tool Lambda Fixes

#### 1.1 Terrain Tool - Perimeter Generation

**File:** `amplify/functions/renewableTools/terrain/handler.py`

**Current Issue:** Perimeter feature not included in GeoJSON output

**Solution:**
```python
def generate_perimeter_feature(center_lat, center_lon, radius_km):
    """Generate a circular perimeter polygon around the site"""
    from shapely.geometry import Point
    from shapely import affinity
    
    # Create circle with radius in meters
    center = Point(center_lon, center_lat)
    circle = center.buffer(radius_km / 111.32)  # Rough conversion to degrees
    
    # Convert to GeoJSON
    perimeter_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [list(circle.exterior.coords)]
        },
        "properties": {
            "type": "perimeter",
            "name": "Site Perimeter",
            "radius_km": radius_km,
            "area_km2": (3.14159 * radius_km * radius_km)
        }
    }
    
    return perimeter_geojson

# In main handler, add perimeter to features
features = []
features.extend(osm_features)  # Buildings, roads, water
features.append(generate_perimeter_feature(lat, lon, radius_km))

geojson = {
    "type": "FeatureCollection",
    "features": features
}
```

#### 1.2 Layout Tool - Terrain Features Inclusion

**File:** `amplify/functions/renewableTools/layout/handler.py`

**Current Issue:** Layout GeoJSON only contains turbines, missing terrain features

**Solution:**
```python
def merge_terrain_and_turbines(terrain_results, turbine_positions):
    """Merge terrain features with turbine markers"""
    
    # Extract terrain features from previous analysis
    terrain_features = []
    if terrain_results and 'geojson' in terrain_results:
        terrain_geojson = terrain_results['geojson']
        if isinstance(terrain_geojson, str):
            terrain_geojson = json.loads(terrain_geojson)
        terrain_features = terrain_geojson.get('features', [])
    
    # Create turbine features
    turbine_features = []
    for i, pos in enumerate(turbine_positions):
        turbine_feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [pos['lng'], pos['lat']]
            },
            "properties": {
                "type": "turbine",
                "turbine_id": f"T{i+1:03d}",
                "capacity_MW": 2.5,
                "hub_height_m": 80,
                "rotor_diameter_m": 100
            }
        }
        turbine_features.append(turbine_feature)
    
    # Combine terrain and turbines
    all_features = terrain_features + turbine_features
    
    return {
        "type": "FeatureCollection",
        "features": all_features
    }

# In main handler
geojson = merge_terrain_and_turbines(
    context.get('terrain_results'),
    turbine_positions
)
```

#### 1.3 Simulation Tool - Wake Heat Map Generation

**File:** `amplify/functions/renewableTools/simulation/handler.py`

**Current Issue:** Wake heat map visualization not being generated or uploaded to S3

**Solution:**
```python
def generate_wake_heat_map(turbine_positions, wake_data, s3_bucket, project_id):
    """Generate interactive Plotly wake heat map and upload to S3"""
    import plotly.graph_objects as go
    import boto3
    
    # Create heat map data
    fig = go.Figure(data=go.Heatmap(
        z=wake_data['deficit_matrix'],
        x=wake_data['x_coords'],
        y=wake_data['y_coords'],
        colorscale='RdYlGn_r',
        colorbar=dict(title='Wake Deficit (%)'),
        hovertemplate='X: %{x:.2f}m<br>Y: %{y:.2f}m<br>Deficit: %{z:.1f}%<extra></extra>'
    ))
    
    # Add turbine markers
    turbine_x = [t['x'] for t in turbine_positions]
    turbine_y = [t['y'] for t in turbine_positions]
    
    fig.add_trace(go.Scatter(
        x=turbine_x,
        y=turbine_y,
        mode='markers',
        marker=dict(size=10, color='blue', symbol='circle'),
        name='Turbines',
        hovertemplate='Turbine<br>X: %{x:.2f}m<br>Y: %{y:.2f}m<extra></extra>'
    ))
    
    fig.update_layout(
        title='Wake Interaction Heat Map',
        xaxis_title='Distance (m)',
        yaxis_title='Distance (m)',
        width=800,
        height=600
    )
    
    # Convert to HTML
    html_content = fig.to_html(include_plotlyjs='cdn', full_html=True)
    
    # Upload to S3
    s3_client = boto3.client('s3')
    s3_key = f'projects/{project_id}/visualizations/wake_heat_map.html'
    
    s3_client.put_object(
        Bucket=s3_bucket,
        Key=s3_key,
        Body=html_content.encode('utf-8'),
        ContentType='text/html',
        CacheControl='max-age=3600'
    )
    
    # Generate presigned URL (valid for 7 days)
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': s3_bucket, 'Key': s3_key},
        ExpiresIn=604800
    )
    
    return url

# In main handler
visualizations = {
    'wake_heat_map': generate_wake_heat_map(
        turbine_positions,
        wake_data,
        os.environ['RENEWABLE_S3_BUCKET'],
        project_id
    ),
    'wake_analysis': existing_wake_chart_url,
    # ... other visualizations
}
```

### 2. Orchestrator Layer Fixes

#### 2.1 Intent Classification Fix

**File:** `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts`

**Current Issue:** "Financial analysis" queries misclassified as terrain_analysis

**Solution:**
```typescript
// Add financial analysis patterns BEFORE terrain patterns (order matters!)
const INTENT_PATTERNS = [
  // Financial analysis (HIGH PRIORITY - check first)
  {
    type: 'report_generation',
    patterns: [
      /financial\s+analysis/i,
      /roi\s+calculation/i,
      /return\s+on\s+investment/i,
      /economic\s+analysis/i,
      /cost\s+benefit/i,
      /project\s+economics/i,
      /financial\s+report/i
    ],
    confidence: 95
  },
  
  // Terrain analysis (LOWER PRIORITY - check after financial)
  {
    type: 'terrain_analysis',
    patterns: [
      /terrain\s+analysis/i,
      /analyze\s+terrain/i,
      /site\s+analysis/i
    ],
    confidence: 90,
    // CRITICAL: Exclude financial queries
    excludePatterns: [
      /financial/i,
      /roi/i,
      /economic/i,
      /cost/i
    ]
  },
  // ... rest of patterns
];

// In classify method
classify(query: string): IntentResult {
  for (const pattern of INTENT_PATTERNS) {
    // Check exclusions first
    if (pattern.excludePatterns) {
      const isExcluded = pattern.excludePatterns.some(p => p.test(query));
      if (isExcluded) {
        continue; // Skip this pattern
      }
    }
    
    // Check if query matches
    const matches = pattern.patterns.some(p => p.test(query));
    if (matches) {
      return {
        type: pattern.type,
        confidence: pattern.confidence,
        params: this.extractParams(query, pattern.type)
      };
    }
  }
  
  return { type: 'unknown', confidence: 0, params: {} };
}
```

#### 2.2 Action Button Generation

**File:** `amplify/functions/renewableOrchestrator/handler.ts`

**Current Issue:** formatArtifacts function not calling generateActionButtons

**Solution:**
```typescript
function formatArtifacts(
  results: ToolResult[],
  intentType: string,
  projectName?: string,
  projectData?: any
): Artifact[] {
  const artifacts: Artifact[] = [];
  
  for (const result of results) {
    if (!result.success || !result.data) continue;
    
    // Generate contextual action buttons based on artifact type and project status
    const actions = generateActionButtons(
      result.type,
      projectName,
      projectData
    );
    
    console.log(`🔘 Generated ${actions.length} action buttons for ${result.type}`);
    
    const artifact: Artifact = {
      type: result.type,
      data: {
        ...result.data,
        projectId: projectName || result.data.project_id,
        // Ensure all required fields are present
        title: result.data.title || getDefaultTitle(result.type),
        subtitle: result.data.subtitle || getDefaultSubtitle(result.type, projectData)
      },
      actions: actions  // CRITICAL: Include actions in artifact
    };
    
    artifacts.push(artifact);
  }
  
  return artifacts;
}

function getDefaultTitle(artifactType: string): string {
  const titles = {
    'wind_farm_terrain_analysis': 'Terrain Analysis Results',
    'wind_farm_layout': 'Wind Farm Layout Optimization',
    'wake_simulation': 'Wake Simulation Analysis',
    'report_generation': 'Comprehensive Wind Farm Report'
  };
  return titles[artifactType] || 'Analysis Results';
}

function getDefaultSubtitle(artifactType: string, projectData?: any): string {
  if (!projectData) return '';
  
  const coords = projectData.coordinates;
  if (coords) {
    return `Site: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }
  
  return '';
}
```

**File:** `amplify/functions/shared/actionButtonTypes.ts`

**Enhancement:** Ensure comprehensive button generation

```typescript
export function generateActionButtons(
  artifactType: string,
  projectName?: string,
  projectData?: any
): ActionButton[] {
  const buttons: ActionButton[] = [];
  
  // Determine completed steps from project data
  const hasTerrainResults = !!projectData?.terrain_results;
  const hasLayoutResults = !!projectData?.layout_results;
  const hasSimulationResults = !!projectData?.simulation_results;
  
  switch (artifactType) {
    case 'wind_farm_terrain_analysis':
      // Primary next step: Layout optimization
      buttons.push({
        label: 'Optimize Turbine Layout',
        query: 'optimize turbine layout',
        icon: 'settings',
        primary: true
      });
      // Always accessible: Dashboard
      buttons.push({
        label: 'View Project Dashboard',
        query: 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      break;
      
    case 'wind_farm_layout':
      // Primary next step: Wake simulation
      buttons.push({
        label: 'Run Wake Simulation',
        query: 'run wake simulation',
        icon: 'refresh',
        primary: true
      });
      // Always accessible: Dashboard
      buttons.push({
        label: 'View Project Dashboard',
        query: 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      // Optional: Refine layout
      buttons.push({
        label: 'Refine Layout',
        query: 'optimize turbine layout with different spacing',
        icon: 'settings',
        primary: false
      });
      break;
      
    case 'wake_simulation':
      // Primary next step: Generate report
      buttons.push({
        label: 'Generate Report',
        query: 'generate comprehensive executive report',
        icon: 'file',
        primary: true
      });
      // Always accessible: Dashboard
      buttons.push({
        label: 'View Project Dashboard',
        query: 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      // Additional analysis options
      buttons.push({
        label: 'Financial Analysis',
        query: 'perform financial analysis and ROI calculation',
        icon: 'calculator',
        primary: false
      });
      buttons.push({
        label: 'Optimize Layout',
        query: 'optimize turbine layout to reduce wake losses',
        icon: 'settings',
        primary: false
      });
      break;
      
    case 'report_generation':
    case 'financial_analysis':
      // Always accessible: Dashboard
      buttons.push({
        label: 'View Dashboard',
        query: 'show project dashboard',
        icon: 'status-info',
        primary: true
      });
      buttons.push({
        label: 'Export Report',
        query: 'export project report as PDF',
        icon: 'download',
        primary: false
      });
      break;
  }
  
  return buttons;
}
```

### 3. Frontend Component Fixes

#### 3.1 LayoutMapArtifact - Defensive Rendering

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

**Enhancements:**

```typescript
// Add validation before map initialization
useEffect(() => {
  // Validate data
  if (!data.geojson || !data.geojson.features || data.geojson.features.length === 0) {
    console.error('[LayoutMap] No features in GeoJSON, cannot render map');
    return;
  }
  
  // Validate container
  if (!mapRef.current) {
    console.error('[LayoutMap] mapRef.current is null');
    return;
  }
  
  const rect = mapRef.current.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.error('[LayoutMap] Container has no dimensions');
    return;
  }
  
  // Proceed with map initialization...
}, [data.projectId]);

// Add fallback UI for missing data
{data.geojson && data.geojson.features && data.geojson.features.length > 0 ? (
  <div ref={mapRef} style={{ width: '100%', height: '500px', ... }} />
) : (
  <Alert type="warning" header="Map Data Unavailable">
    Layout map cannot be displayed because GeoJSON features are missing.
    {data.turbineCount > 0 && (
      <div>
        However, {data.turbineCount} turbines were calculated. 
        Try re-running the layout optimization.
      </div>
    )}
  </Alert>
)}
```

#### 3.2 WakeAnalysisArtifact - Heat Map Fallback

**File:** `src/components/renewable/WakeAnalysisArtifact.tsx`

**Enhancement:**

```typescript
// In wake_map tab content
{data.visualizations?.wake_heat_map ? (
  <div style={{ position: 'relative', width: '100%', height: '600px' }}>
    <iframe
      src={data.visualizations.wake_heat_map}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Wake Heat Map"
      onLoad={() => setMapLoaded(true)}
      onError={() => {
        console.error('Failed to load wake heat map iframe');
        setMapLoaded(false);
      }}
    />
    {!mapLoaded && (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        Loading heat map...
      </div>
    )}
  </div>
) : (
  <Alert type="info" header="Wake Heat Map Not Available">
    The interactive wake heat map visualization is not available for this simulation.
    {data.visualizations?.wake_analysis && (
      <div>
        <p>You can view the wake analysis chart in the "Analysis Charts" tab instead.</p>
        <Button onClick={() => setActiveTab('charts')}>
          View Wake Analysis Chart
        </Button>
      </div>
    )}
  </Alert>
)}
```

#### 3.3 WorkflowCTAButtons - Always Render

**File:** `src/components/renewable/WorkflowCTAButtons.tsx`

**Enhancement:**

```typescript
// Remove the early return that hides buttons
// Instead, always show at least one button

const getEnabledButtons = (): WorkflowCTAButton[] => {
  const enabled = WORKFLOW_BUTTONS.filter(button => {
    return completedSteps.includes(button.step);
  });
  
  // If no buttons enabled, show the first button as a hint
  if (enabled.length === 0 && WORKFLOW_BUTTONS.length > 0) {
    return [WORKFLOW_BUTTONS[0]];
  }
  
  return enabled;
};

// Always render, even if only showing hints
return (
  <Box margin={{ top: 'm', bottom: 's' }} padding={{ vertical: 's', horizontal: 'm' }}>
    <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
      {enabledButtons.length > 0 ? 'Next Steps' : 'Suggested Next Step'}
    </Box>
    <SpaceBetween direction="horizontal" size="xs">
      {enabledButtons.map((button, index) => (
        <Button
          key={index}
          variant={button === nextAction && button.primary ? 'primary' : 'normal'}
          iconName={button.icon as any}
          onClick={() => {
            const query = button.action.replace('{project_id}', projectId);
            onAction(query);
          }}
        >
          {button.label}
        </Button>
      ))}
    </SpaceBetween>
  </Box>
);
```

## Data Models

### Artifact with Actions

```typescript
interface Artifact {
  type: string;
  data: {
    // Type-specific data
    [key: string]: any;
    
    // Common fields
    projectId: string;
    title: string;
    subtitle?: string;
    
    // GeoJSON for map artifacts
    geojson?: {
      type: 'FeatureCollection';
      features: Feature[];
    };
    
    // Visualizations for simulation artifacts
    visualizations?: {
      wake_heat_map?: string;  // S3 URL
      wake_analysis?: string;
      performance_charts?: string[];
    };
  };
  
  // CRITICAL: Action buttons
  actions?: ActionButton[];
}

interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}
```

### GeoJSON Feature Types

```typescript
interface TerrainFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point';
    coordinates: number[][] | number[][][];
  };
  properties: {
    type: 'building' | 'road' | 'water' | 'perimeter' | 'turbine';
    name?: string;
    // Type-specific properties
    [key: string]: any;
  };
}
```

## Error Handling

### Backend Error Handling

```python
# In terrain/layout/simulation handlers
try:
    # Generate visualization
    result = generate_visualization(...)
except Exception as e:
    logger.error(f"Failed to generate visualization: {str(e)}")
    # Return partial results with error flag
    return {
        'success': True,  # Don't fail entire request
        'data': {
            ...partial_results,
            'visualization_error': str(e),
            'visualization_available': False
        }
    }
```

### Frontend Error Handling

```typescript
// In artifact components
try {
  // Render visualization
  renderMap();
} catch (error) {
  console.error('Map rendering error:', error);
  setRenderError(error.message);
}

// Display error state
{renderError && (
  <Alert type="error" header="Rendering Error">
    Failed to display visualization: {renderError}
    <Button onClick={() => window.location.reload()}>
      Reload Page
    </Button>
  </Alert>
)}
```

## Testing Strategy

### Unit Tests

1. **Intent Classification Tests**
   - Test financial analysis queries return 'report_generation'
   - Test terrain queries don't match financial patterns
   - Test exclusion patterns work correctly

2. **Action Button Generation Tests**
   - Test each artifact type generates correct buttons
   - Test button count and labels
   - Test primary button selection

3. **GeoJSON Generation Tests**
   - Test perimeter feature is included
   - Test terrain features are preserved in layout
   - Test turbine features have correct properties

### Integration Tests

1. **End-to-End Workflow Test**
   - Create terrain analysis → verify perimeter and actions
   - Run layout optimization → verify terrain + turbines + actions
   - Run wake simulation → verify heat map URL + actions
   - Request financial analysis → verify correct artifact type

2. **Frontend Rendering Tests**
   - Test map renders with all feature types
   - Test action buttons display and are clickable
   - Test error states display correctly
   - Test fallback UI for missing data

### Manual Testing Checklist

- [ ] Terrain analysis shows perimeter on map
- [ ] Terrain analysis shows "Optimize Layout" button
- [ ] Layout map shows buildings, roads, water
- [ ] Layout map shows turbine markers
- [ ] Layout shows "Run Wake Simulation" button
- [ ] Wake simulation shows heat map in iframe
- [ ] Wake simulation shows 4 action buttons
- [ ] "Financial analysis" query generates report, not terrain map
- [ ] All maps are interactive (pan, zoom, click)
- [ ] All popups display correct information

## Deployment Plan

### Phase 1: Backend Fixes (Critical)
1. Deploy terrain handler with perimeter generation
2. Deploy layout handler with terrain feature merging
3. Deploy simulation handler with heat map generation
4. Deploy orchestrator with intent classification fix

### Phase 2: Orchestrator Enhancements
1. Deploy action button generation in formatArtifacts
2. Deploy enhanced actionButtonTypes.ts
3. Verify artifacts include actions in CloudWatch logs

### Phase 3: Frontend Fixes
1. Deploy LayoutMapArtifact defensive rendering
2. Deploy WakeAnalysisArtifact heat map fallback
3. Deploy WorkflowCTAButtons always-render logic
4. Test in browser with real data

### Phase 4: Validation
1. Run diagnostic test suite
2. Manual testing of complete workflow
3. Verify all 6 issues are resolved
4. User acceptance testing

## Success Metrics

- 100% of artifacts include action buttons
- 100% of terrain analyses include perimeter feature
- 100% of layout maps show terrain + turbines
- 100% of wake simulations include heat map URL
- 0% of financial queries misclassified as terrain
- 0% of map rendering errors in production
- User can complete full workflow without UI blockers
