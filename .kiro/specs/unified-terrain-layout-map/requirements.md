# Unified Terrain + Layout Map Visualization

## Problem Statement

Currently, the layout optimization map shows turbines but **does NOT show the OSM terrain features** (buildings, roads, water bodies) that influenced their placement. Users cannot visually verify that turbines are avoiding obstacles.

Additionally, terrain features need **visible buffer zones** to show exclusion areas:
- **Linestrings (roads)**: Buffer corridors on both sides
- **Polygons (buildings, water)**: Buffer perimeters around features
- **Consistent styling**: Same colors and transparency in both terrain and layout maps

## User Stories

### US1: See Terrain Features on Layout Map
**As a** wind farm developer  
**I want** to see all OSM features (buildings, roads, water) on the layout map with turbines  
**So that** I can visually verify turbines are avoiding obstacles  

**Acceptance Criteria:**
1. Layout map includes ALL terrain features from terrain analysis
2. Buildings, roads, and water bodies visible on same map as turbines
3. Features use consistent colors between terrain and layout maps
4. Visual hierarchy: turbines most prominent, terrain as context

### US2: Visualize Buffer Zones
**As a** wind farm developer  
**I want** to see transparent buffer zones around terrain features  
**So that** I understand the exclusion areas used by the placement algorithm  

**Acceptance Criteria:**
1. Buildings show circular buffer zones (e.g., 200m radius)
2. Roads show corridor buffers on both sides (e.g., 100m each side)
3. Water bodies show perimeter buffers (e.g., 150m)
4. Buffer zones are semi-transparent overlays with same base color as feature
5. Buffer zones visible at appropriate zoom levels

### US3: Consistent Styling Between Maps
**As a** user  
**I want** terrain features to look identical in terrain and layout maps  
**So that** I have a consistent visual experience  

**Acceptance Criteria:**
1. Buildings: Same red color (#FF6B6B) in both maps
2. Roads: Same orange color (#FFA726) in both maps
3. Water: Same blue color (#42A5F5) in both maps
4. Buffer zones: Same transparent styling (15% opacity)
5. Feature opacity: 30% for features, 15% for buffers

### US4: Linestring and Polygon Handling
**As a** developer  
**I want** proper geometric handling of different feature types  
**So that** buffers are calculated correctly  

**Acceptance Criteria:**
1. **Linestrings (roads)**: Buffer creates corridor on both sides
2. **Polygons (buildings, water)**: Buffer creates perimeter around shape
3. **Points (if any)**: Buffer creates circular zone
4. All buffer calculations use proper GIS operations
5. Invalid geometries handled gracefully

## Technical Requirements

### TR1: Backend Data Integration
- Layout handler must include terrain features in response
- Terrain features merged with turbine locations in single GeoJSON
- Buffer zones calculated using Shapely geometric operations
- Response includes both unified and layered data structures

### TR2: Visual Styling Standards
```
FEATURES:
- Buildings: #FF6B6B fill, 30% opacity, 1px stroke
- Roads: #FFA726 stroke, 3px width, 80% opacity
- Water: #42A5F5 fill, 40% opacity, 1px stroke
- Turbines: #4CAF50 fill, prominent size

BUFFERS:
- Same base color as parent feature
- 15% opacity fill
- 2px dashed stroke (5,5 pattern)
- 50% stroke opacity

DISTANCES:
- Buildings: 200m buffer radius
- Roads: 100m buffer corridor (50m each side)
- Water: 150m buffer perimeter
```

### TR3: Map Layer Order (Z-Index)
1. **Bottom**: Buffer zones (lowest z-index)
2. **Middle**: Terrain features (buildings, roads, water)
3. **Top**: Turbines (highest z-index, most prominent)

### TR4: Performance Requirements
- Map renders smoothly with 1000+ terrain features
- Buffer calculations don't block UI
- Zoom-based feature visibility for performance
- Memory usage remains reasonable

## Implementation Scope

### In Scope
- Enhance layout handler to merge terrain data with turbine locations
- Calculate buffer zones for all terrain feature types
- Update LayoutMapArtifact to render terrain features + buffers
- Create shared styling system for consistent colors
- Update TerrainMapArtifact to use same styling

### Out of Scope
- Real-time terrain data updates
- 3D visualization
- Custom buffer distance configuration (use fixed distances)
- Satellite imagery integration
- Advanced GIS analysis tools

## Success Metrics

### Visual Success
- [ ] Layout map shows all terrain features from terrain analysis
- [ ] Buffer zones visible around buildings, roads, and water
- [ ] Turbines visually avoid buffer zones
- [ ] Consistent styling between terrain and layout maps
- [ ] Clear visual hierarchy (turbines > features > buffers)

### Technical Success
- [ ] No performance degradation with large datasets
- [ ] Buffer calculations accurate for linestrings and polygons
- [ ] Code reuse between terrain and layout components
- [ ] Clean data flow from backend to frontend

### User Experience Success
- [ ] Users immediately understand constraint relationships
- [ ] Visual design is intuitive and accessible
- [ ] Map loads quickly and responds smoothly
- [ ] Mobile experience is functional

## Dependencies

- **Completed**: Terrain exclusion zones fix (OSM features categorized)
- **Completed**: Intelligent placement algorithm using terrain constraints
- **Required**: Shapely library for buffer calculations
- **Required**: Layout handler access to terrain context

## Risk Mitigation

### Performance Risk
**Risk**: Large terrain datasets slow down rendering  
**Mitigation**: Implement zoom-based filtering, simplify geometries

### Complexity Risk
**Risk**: Buffer calculations become too complex  
**Mitigation**: Use simple Shapely buffers, add error handling

### Consistency Risk
**Risk**: Styling diverges between components  
**Mitigation**: Create shared styling constants and utilities
