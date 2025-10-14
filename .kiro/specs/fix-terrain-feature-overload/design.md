# Design Document

## Overview

This design implements intelligent feature filtering and sampling in the terrain analysis backend to prevent frontend performance issues while maintaining accurate metrics. The solution filters 150K+ OSM features down to ~1000 most relevant features for map display while preserving complete statistics.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Terrain Handler (Python)                  │
│                                                              │
│  ┌────────────────┐    ┌──────────────────┐               │
│  │  OSM Query     │───▶│ Feature Scorer   │               │
│  │  (150K+ raw)   │    │ (Importance)     │               │
│  └────────────────┘    └──────────────────┘               │
│                               │                             │
│                               ▼                             │
│                    ┌──────────────────┐                    │
│                    │ Spatial Sampler  │                    │
│                    │ (Grid-based)     │                    │
│                    └──────────────────┘                    │
│                               │                             │
│                               ▼                             │
│                    ┌──────────────────┐                    │
│                    │ Feature Filter   │                    │
│                    │ (Top 1000)       │                    │
│                    └──────────────────┘                    │
│                               │                             │
│                               ▼                             │
│  ┌────────────────────────────────────────────┐           │
│  │  Response Builder                          │           │
│  │  - displayedFeatures: 1000                 │           │
│  │  - totalFeatures: 154280                   │           │
│  │  - metrics: complete stats                 │           │
│  │  - filtered: true                          │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              TerrainMapArtifact (React)                      │
│                                                              │
│  - Renders 1000 features (fast)                             │
│  - Shows "Displaying 1000 of 154280 features" notice        │
│  - Metrics show complete statistics                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Feature Importance Scorer

**Purpose:** Assign importance scores to features based on their relevance to wind farm site assessment.

**Interface:**
```python
def score_feature_importance(feature: dict) -> int:
    """
    Score feature importance for wind farm analysis.
    
    Args:
        feature: GeoJSON feature with properties
        
    Returns:
        Importance score (0-100)
    """
    pass
```

**Scoring Logic:**
- Buildings: 100 (highest priority - setback requirements)
- Major highways: 80 (high priority - access and setback)
- Water bodies: 70 (medium-high - foundation constraints)
- Power infrastructure: 60 (medium - interference concerns)
- Railways: 50 (medium - setback requirements)
- Minor roads: 30 (low - access consideration)
- Other features: 10 (lowest - general awareness)

**Additional Factors:**
- Size/area: Larger features get +10 bonus
- Named features: Features with names get +5 bonus
- Protected areas: Get +20 bonus (regulatory importance)

### 2. Spatial Grid Sampler

**Purpose:** Ensure geographic distribution of features across the analysis area.

**Interface:**
```python
def create_spatial_grid(
    center_lat: float,
    center_lng: float,
    radius_km: float,
    grid_size: int = 10
) -> List[GridCell]:
    """
    Create a spatial grid for feature sampling.
    
    Args:
        center_lat: Center latitude
        center_lng: Center longitude
        radius_km: Analysis radius in km
        grid_size: Number of grid cells per dimension (default: 10x10)
        
    Returns:
        List of GridCell objects with bounds
    """
    pass

def sample_features_by_grid(
    features: List[dict],
    grid: List[GridCell],
    features_per_cell: int = 10
) -> List[dict]:
    """
    Sample features ensuring spatial distribution.
    
    Args:
        features: All features with importance scores
        grid: Spatial grid cells
        features_per_cell: Max features to select per cell
        
    Returns:
        Sampled features distributed across grid
    """
    pass
```

**Algorithm:**
1. Divide analysis area into 10x10 grid (100 cells)
2. Assign each feature to its grid cell based on centroid
3. Sort features within each cell by importance score
4. Select top N features from each cell (N = 10 for ~1000 total)
5. If cell has < N features, include all and redistribute quota

### 3. Feature Filter

**Purpose:** Apply final filtering to ensure we don't exceed display limits.

**Interface:**
```python
def filter_features_for_display(
    features: List[dict],
    max_features: int = 1000,
    preserve_types: List[str] = ['building', 'major_highway', 'water']
) -> Tuple[List[dict], dict]:
    """
    Filter features to display limit while preserving important types.
    
    Args:
        features: Spatially sampled features
        max_features: Maximum features to return
        preserve_types: Feature types to always include
        
    Returns:
        Tuple of (filtered_features, filter_metadata)
    """
    pass
```

**Logic:**
1. Separate features into "must include" (preserve_types) and "optional"
2. Include all "must include" features up to max_features
3. Fill remaining slots with highest-scored optional features
4. Return filter metadata (counts, types preserved, etc.)

### 4. Response Builder

**Purpose:** Construct response with both filtered features and complete metrics.

**Interface:**
```python
def build_terrain_response(
    all_features: List[dict],
    displayed_features: List[dict],
    filter_metadata: dict,
    coordinates: dict,
    radius_km: float
) -> dict:
    """
    Build complete terrain analysis response.
    
    Args:
        all_features: Complete unfiltered feature list
        displayed_features: Filtered features for map display
        filter_metadata: Information about filtering applied
        coordinates: Analysis center coordinates
        radius_km: Analysis radius
        
    Returns:
        Complete response with metrics and filtered data
    """
    pass
```

**Response Structure:**
```json
{
  "messageContentType": "wind_farm_terrain_analysis",
  "projectId": "terrain-123456",
  "coordinates": {"lat": 40.7128, "lng": -74.0060},
  "geojson": {
    "type": "FeatureCollection",
    "features": [...],  // 1000 filtered features
    "metadata": {
      "filtered": true,
      "displayedFeatures": 1000,
      "totalFeatures": 154280,
      "filterMethod": "importance_spatial_sampling",
      "gridSize": "10x10",
      "featuresPerCell": 10
    }
  },
  "metrics": {
    "totalFeatures": 154280,  // Complete count
    "displayedFeatures": 1000,  // Filtered count
    "featuresByType": {  // Complete breakdown
      "building": 45000,
      "highway": 89000,
      "water": 15000,
      "other": 5280
    },
    "displayedByType": {  // Filtered breakdown
      "building": 350,
      "highway": 400,
      "water": 150,
      "other": 100
    },
    "radiusKm": 10.0
  },
  "exclusionZones": [...],  // All exclusion zones (not filtered)
  "message": "Displaying 1000 most relevant features out of 154,280 total features"
}
```

## Data Models

### Feature with Importance Score

```python
@dataclass
class ScoredFeature:
    """Feature with importance score for filtering"""
    feature: dict  # Original GeoJSON feature
    importance_score: int  # 0-100
    grid_cell_id: str  # Spatial grid cell assignment
    feature_type: str  # Normalized feature type
    area_m2: float  # Feature area (0 for points/lines)
    has_name: bool  # Whether feature has a name
```

### Grid Cell

```python
@dataclass
class GridCell:
    """Spatial grid cell for feature sampling"""
    id: str  # Cell identifier (e.g., "5_7")
    bounds: dict  # {"min_lat": ..., "max_lat": ..., "min_lng": ..., "max_lng": ...}
    center: dict  # {"lat": ..., "lng": ...}
    features: List[ScoredFeature]  # Features in this cell
    quota: int  # Number of features to select from this cell
```

### Filter Metadata

```python
@dataclass
class FilterMetadata:
    """Metadata about feature filtering"""
    total_features: int
    displayed_features: int
    filter_method: str
    grid_size: str
    features_per_cell: int
    preserved_types: List[str]
    filtering_applied: bool
    spatial_coverage_pct: float  # % of grid cells with features
```

## Error Handling

### Scenarios

1. **Too Few Features (<100)**
   - Don't apply filtering
   - Return all features
   - Set `filtered: false` in metadata

2. **Grid Cell Imbalance**
   - If some cells have many features and others have few
   - Redistribute quota from sparse cells to dense cells
   - Ensure minimum spatial coverage

3. **All Features Same Type**
   - If 99% of features are one type (e.g., all highways)
   - Still apply spatial sampling
   - Ensure diversity in displayed features

4. **Memory Constraints**
   - If processing 150K+ features causes memory issues
   - Process features in batches
   - Stream scoring and filtering

## Testing Strategy

### Unit Tests

1. **Feature Scoring**
   - Test score calculation for each feature type
   - Test bonus scoring (size, name, protected)
   - Test edge cases (missing properties)

2. **Spatial Grid**
   - Test grid creation for various radii
   - Test feature assignment to cells
   - Test quota redistribution

3. **Feature Filtering**
   - Test filtering with various limits
   - Test type preservation
   - Test metadata generation

### Integration Tests

1. **End-to-End Filtering**
   - Test with real OSM data (150K+ features)
   - Verify output is ~1000 features
   - Verify metrics accuracy
   - Verify spatial distribution

2. **Performance Tests**
   - Measure filtering time for 150K features (target: <2s)
   - Measure memory usage (target: <500MB)
   - Verify frontend render time (target: <3s)

### Validation Tests

1. **Data Quality**
   - Verify no duplicate features in output
   - Verify all displayed features have valid geometry
   - Verify metrics match actual counts

2. **Spatial Coverage**
   - Verify features distributed across area
   - Verify no large empty regions
   - Verify center area well-represented

## Performance Considerations

### Backend Optimization

- **Scoring:** O(n) where n = total features (~150K)
  - Target: <500ms for 150K features
  - Use vectorized operations where possible

- **Grid Assignment:** O(n) 
  - Target: <200ms for 150K features
  - Use spatial indexing (R-tree) if available

- **Sampling:** O(n log n) for sorting within cells
  - Target: <1s for 150K features
  - Parallel processing for grid cells

- **Total Backend Time:** <2s for complete filtering

### Frontend Optimization

- **Rendering:** O(m) where m = displayed features (1000)
  - Target: <3s to render 1000 features
  - Use Leaflet clustering if still slow

- **Memory:** ~50MB for 1000 features (vs 500MB+ for 150K)

### Caching Strategy

- Cache filtered results by (lat, lng, radius) for 1 hour
- Invalidate cache if OSM data updates
- Store in Lambda memory or ElastiCache

## Migration Strategy

### Phase 1: Backend Implementation (This Spec)
1. Implement feature scoring
2. Implement spatial grid sampling
3. Implement feature filtering
4. Update response structure
5. Add comprehensive logging

### Phase 2: Frontend Updates
1. Update TerrainMapArtifact to handle filtered data
2. Add "Displaying X of Y features" notice
3. Update metrics display
4. Add filter info tooltip

### Phase 3: Monitoring & Tuning
1. Monitor feature counts in production
2. Tune filtering parameters based on usage
3. Adjust importance scores based on feedback
4. Optimize performance if needed

## Success Metrics

- **Performance:** Map renders in <3s (vs current timeout)
- **Data Quality:** Metrics show complete counts (154K+)
- **User Experience:** No browser freezing or crashes
- **Spatial Coverage:** Features visible across entire analysis area
- **Accuracy:** Exclusion zones and statistics remain accurate
