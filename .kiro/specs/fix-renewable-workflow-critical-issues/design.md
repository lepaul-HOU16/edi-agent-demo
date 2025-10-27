# Design Document

## Overview

This design addresses seven critical failures in the renewable energy workflow by implementing fixes across the backend (Python Lambda functions), orchestrator (TypeScript), and frontend (React components). The solution ensures proper data persistence, intelligent algorithm selection, comprehensive visualization, and guided user navigation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Layout Artifact  │  │  CTA Buttons     │                │
│  │ + Terrain Layer  │  │  (Footer)        │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Orchestrator (TypeScript)                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Intent Classifier│  │  Error Handler   │                │
│  │ + CTA Generator  │  │  + Messages      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Tool Lambdas (Python)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Terrain    │  │    Layout    │  │  Simulation  │     │
│  │  + Features  │  │  + S3 Save   │  │  + S3 Load   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    S3 Storage                                │
│  projects/{project_id}/layout.json                          │
│  projects/{project_id}/terrain.json                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Layout Handler S3 Persistence

**File**: `amplify/functions/renewableTools/layout/handler.py`

**Changes**:
- Add S3 save operation after layout generation
- Include complete layout JSON with turbines, perimeter, and features
- Return S3 key in response for downstream tools

**Interface**:
```python
def save_layout_to_s3(layout_data: dict, project_id: str) -> str:
    """
    Save complete layout JSON to S3.
    
    Args:
        layout_data: {
            "turbines": [...],
            "perimeter": {...},
            "features": [...],
            "algorithm": "intelligent" | "grid",
            "metadata": {...}
        }
        project_id: Unique project identifier
        
    Returns:
        S3 key path
    """
```

### 2. Simulation Handler S3 Retrieval

**File**: `amplify/functions/renewableTools/simulation/handler.py`

**Changes**:
- Add S3 retrieval before simulation
- Validate layout data exists
- Return clear error if layout missing

**Interface**:
```python
def load_layout_from_s3(project_id: str) -> dict:
    """
    Load layout JSON from S3.
    
    Args:
        project_id: Unique project identifier
        
    Returns:
        Layout data dict
        
    Raises:
        LayoutNotFoundError: If layout doesn't exist
    """
```

### 3. Intelligent Placement Algorithm Selection

**File**: `amplify/functions/renewableTools/layout/intelligent_placement.py`

**Changes**:
- Fix algorithm selection logic to prefer intelligent placement
- Only fall back to grid if OSM data is completely unavailable
- Log algorithm selection decision

**Logic**:
```python
def select_algorithm(osm_features: list) -> str:
    """
    Select layout algorithm based on available data.
    
    Priority:
    1. Intelligent placement if OSM features exist
    2. Grid layout only if no OSM data
    
    Args:
        osm_features: List of OSM feature dicts
        
    Returns:
        "intelligent" or "grid"
    """
    if osm_features and len(osm_features) > 0:
        return "intelligent"
    else:
        logger.warning("No OSM features available, falling back to grid")
        return "grid"
```

### 4. Terrain Feature Visualization

**File**: `src/components/renewable/LayoutOptimizationArtifact.tsx`

**Changes**:
- Add terrain feature layer to map
- Render perimeter polygon
- Render OSM features (roads, buildings, water)
- Layer turbines on top

**Component Structure**:
```typescript
interface TerrainFeatureLayer {
  perimeter: {
    type: "Polygon";
    coordinates: number[][][];
  };
  features: Array<{
    type: string; // "road", "building", "water"
    geometry: GeoJSON.Geometry;
    properties: Record<string, any>;
  }>;
}

function renderTerrainFeatures(features: TerrainFeatureLayer) {
  // Render perimeter as boundary line
  // Render roads as lines
  // Render buildings as polygons
  // Render water as blue polygons
  // Render turbines as markers on top
}
```

### 5. Call-to-Action Button System

**File**: `src/components/renewable/WorkflowCTAButtons.tsx` (new)

**Component**:
```typescript
interface CTAButton {
  label: string;
  action: string; // Query to send
  enabled: boolean;
  icon?: string;
}

interface WorkflowCTAButtonsProps {
  completedSteps: string[]; // ["terrain", "layout", "simulation"]
  projectId: string;
  onAction: (query: string) => void;
}

// Buttons appear in footer after each step completes
const WORKFLOW_BUTTONS = [
  { step: "terrain", label: "Optimize Turbine Layout", action: "optimize turbine layout" },
  { step: "layout", label: "Run Wake Simulation", action: "run wake simulation" },
  { step: "simulation", label: "Generate Wind Rose", action: "generate wind rose" },
  { step: "windrose", label: "View Project Dashboard", action: "show project dashboard" }
];
```

**Integration**: Add to artifact footer in `ChatMessage.tsx`

### 6. Dashboard Accessibility

**File**: `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts`

**Changes**:
- Add intent pattern for "dashboard" queries
- Route to dashboard artifact generator
- Include all completed analyses

**Intent Pattern**:
```typescript
{
  type: 'project_dashboard',
  test: () => this.matchesAny(query, [
    'dashboard',
    'view.*dashboard',
    'show.*dashboard',
    'project.*summary',
    'all.*results'
  ])
}
```

**Dashboard Component**: Use existing `ProjectDashboardArtifact.tsx` with consolidated views

### 7. Enhanced Error Messages

**File**: `amplify/functions/shared/errorMessageTemplates.ts`

**Templates**:
```typescript
export const RENEWABLE_ERROR_MESSAGES = {
  LAYOUT_MISSING: {
    title: "Layout Data Not Found",
    message: "Please run layout optimization before wake simulation.",
    action: "Optimize Turbine Layout"
  },
  TERRAIN_MISSING: {
    title: "Terrain Data Not Found",
    message: "Please run terrain analysis before layout optimization.",
    action: "Analyze Terrain"
  },
  LAMBDA_TIMEOUT: {
    title: "Analysis Taking Longer Than Expected",
    message: "The analysis is still processing. Please try again in a moment.",
    action: "Retry"
  },
  S3_RETRIEVAL_FAILED: {
    title: "Unable to Retrieve Analysis Data",
    message: "There was an error accessing your analysis results. Please contact support if this persists.",
    action: null
  },
  PARAMETER_MISSING: (params: string[]) => ({
    title: "Missing Required Parameters",
    message: `The following parameters are required: ${params.join(", ")}`,
    action: null
  })
};
```

## Data Models

### Layout JSON Schema

```typescript
interface LayoutData {
  project_id: string;
  algorithm: "intelligent" | "grid";
  turbines: Array<{
    id: number;
    latitude: number;
    longitude: number;
    hub_height: number;
    rotor_diameter: number;
  }>;
  perimeter: {
    type: "Polygon";
    coordinates: number[][][]; // GeoJSON format
  };
  features: Array<{
    type: "road" | "building" | "water" | "other";
    geometry: GeoJSON.Geometry;
    properties: Record<string, any>;
  }>;
  metadata: {
    created_at: string;
    num_turbines: number;
    total_capacity_mw: number;
    site_area_km2: number;
  };
}
```

### S3 Storage Pattern

```
s3://bucket-name/
  projects/
    {project_id}/
      terrain.json          # Terrain analysis results
      layout.json           # Layout optimization results
      simulation.json       # Wake simulation results
      windrose.json         # Wind rose data
```

## Error Handling

### Error Flow

```
Lambda Error
    ↓
Orchestrator catches error
    ↓
Match error type to template
    ↓
Generate user-friendly message
    ↓
Include CTA button if applicable
    ↓
Return to frontend
```

### Error Types

1. **Missing Prerequisite**: Previous step not completed
2. **Lambda Timeout**: Analysis taking too long
3. **S3 Error**: Cannot read/write data
4. **Validation Error**: Invalid parameters
5. **Algorithm Error**: Calculation failure

## Testing Strategy

### Unit Tests

1. **S3 Operations**:
   - Test layout save to S3
   - Test layout load from S3
   - Test error handling for missing files

2. **Algorithm Selection**:
   - Test intelligent selection with OSM data
   - Test grid fallback without OSM data
   - Test logging of selection decision

3. **Error Templates**:
   - Test message generation for each error type
   - Test parameter substitution
   - Test CTA button inclusion

### Integration Tests

1. **End-to-End Workflow**:
   - Terrain → Layout → Simulation → Dashboard
   - Verify S3 persistence at each step
   - Verify CTA buttons appear correctly

2. **Error Scenarios**:
   - Skip layout, try simulation (should error)
   - Corrupt S3 data (should error gracefully)
   - Lambda timeout (should show retry message)

### Manual Testing

1. **UI Validation**:
   - Verify terrain features render on map
   - Verify perimeter shows correctly
   - Verify CTA buttons in footer
   - Verify dashboard consolidation

2. **Workflow Navigation**:
   - Click through entire workflow using only CTA buttons
   - Verify no typing required after initial terrain query

## Implementation Notes

### Critical Fixes Priority

1. **Highest Priority** (Blocking demo):
   - Layout S3 save (fixes wake simulation)
   - Intelligent placement selection (fixes grid layout)
   - Terrain feature visualization (fixes missing perimeter)

2. **High Priority** (UX improvement):
   - CTA buttons (enables click-through demo)
   - Error messages (improves debugging)

3. **Medium Priority** (Nice-to-have):
   - Dashboard consolidation (already partially working)

### Deployment Sequence

1. Deploy backend changes (Python Lambdas)
2. Deploy orchestrator changes (TypeScript)
3. Deploy frontend changes (React components)
4. Test end-to-end workflow
5. Validate with user

### Rollback Plan

If issues occur:
1. Revert frontend changes (no impact on backend)
2. Revert orchestrator changes (backend still works)
3. Revert backend changes (return to current state)

Each layer can be rolled back independently.

## Performance Considerations

- S3 operations add ~100-200ms latency (acceptable)
- Terrain feature rendering may be slow with >1000 features (optimize with clustering)
- Dashboard consolidation loads multiple artifacts (use lazy loading)

## Security Considerations

- S3 keys include project_id to prevent cross-project access
- Validate project_id ownership before S3 operations
- Sanitize error messages to avoid leaking internal details
