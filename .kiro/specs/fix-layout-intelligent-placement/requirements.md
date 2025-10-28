# Requirements: Fix Layout Intelligent Placement

## Introduction
The layout optimization currently produces grid patterns even when labeled as "intelligent placement" because OSM terrain data is not flowing correctly from terrain analysis to layout optimization. Additionally, OSM features are not displayed on the layout map alongside turbines.

## Glossary
- **Intelligent Placement**: Algorithm that positions turbines while avoiding buildings, roads, and water bodies
- **OSM Features**: OpenStreetMap terrain data (buildings, roads, water bodies)
- **Exclusion Zones**: Structured OSM data used by intelligent placement algorithm
- **Layout Map**: Interactive map showing turbine positions and terrain features

## Requirements

### Requirement 1: Terrain Data Flow
**User Story:** As a user, I want the layout optimization to use real terrain data so turbines avoid buildings and roads

#### Acceptance Criteria
1. WHEN terrain analysis completes, THE System SHALL store exclusionZones in project context
2. WHEN layout optimization is invoked, THE System SHALL pass terrain_results from context to layout Lambda
3. WHEN layout Lambda receives terrain data, THE System SHALL log the count of buildings, roads, and water bodies
4. IF exclusionZones contain features, THEN THE System SHALL use intelligent placement algorithm
5. IF exclusionZones are empty, THEN THE System SHALL log warning and use grid fallback

### Requirement 2: OSM Features on Layout Map
**User Story:** As a user, I want to see terrain features on the layout map so I understand turbine placement decisions

#### Acceptance Criteria
1. WHEN layout optimization generates response, THE System SHALL include terrain features in GeoJSON
2. THE System SHALL merge terrain features with turbine features in combined GeoJSON
3. THE System SHALL preserve feature properties including type for rendering
4. WHEN frontend renders layout map, THE System SHALL display both turbines and terrain features
5. THE System SHALL use different markers for turbines vs terrain features
