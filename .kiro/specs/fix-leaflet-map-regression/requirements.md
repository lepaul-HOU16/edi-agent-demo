# Requirements Document

## Introduction

The Leaflet map component in the TerrainMapArtifact has multiple regressions that need to be fixed:
1. Map loading failure (initialization issue)
2. Missing feature list table below the map
3. Incorrect water body styling (not filled, labeled as 'way')
4. Incorrect building styling (not filled properly)
5. Lost original feature styling from the Renewables notebook reference implementation

These regressions need to be diagnosed and fixed to restore full terrain analysis functionality.

## Requirements

### Requirement 1: Diagnose Map Loading Failure

**User Story:** As a developer, I want to understand why the Leaflet map is no longer loading, so that I can identify the root cause of the regression.

#### Acceptance Criteria

1. WHEN investigating the TerrainMapArtifact component THEN the system SHALL identify any console errors related to Leaflet initialization
2. WHEN checking the component's useEffect hooks THEN the system SHALL verify the map initialization logic is being executed
3. WHEN examining the mapRef THEN the system SHALL confirm the DOM element is available when Leaflet tries to initialize
4. IF Leaflet is not importing correctly THEN the system SHALL identify the import issue
5. IF the map container is not rendering THEN the system SHALL identify the rendering issue

### Requirement 2: Restore Leaflet Map Functionality

**User Story:** As a user, I want the terrain analysis map to display correctly, so that I can visualize exclusion zones and geographic features.

#### Acceptance Criteria

1. WHEN a terrain analysis artifact is rendered THEN the system SHALL display an interactive Leaflet map
2. WHEN the map loads THEN the system SHALL show the center marker at the analysis coordinates
3. WHEN the map loads THEN the system SHALL display all GeoJSON features (water, highways, buildings)
4. WHEN clicking on features THEN the system SHALL show popups with feature details
5. WHEN the map is displayed THEN the system SHALL allow panning and zooming interactions

### Requirement 3: Prevent Future Map Regressions

**User Story:** As a developer, I want to ensure the map component remains stable, so that future changes don't break the visualization.

#### Acceptance Criteria

1. WHEN making changes to the component THEN the system SHALL preserve the Leaflet initialization pattern
2. WHEN the component mounts THEN the system SHALL properly clean up the map instance on unmount
3. WHEN the component re-renders THEN the system SHALL not recreate the map unnecessarily
4. IF the mapRef is not available THEN the system SHALL handle the error gracefully
5. WHEN Leaflet CSS is loaded THEN the system SHALL ensure it's available before map initialization

### Requirement 4: Restore Feature List Table

**User Story:** As a user, I want to see a paginated table of all terrain features below the map, so that I can review feature details in a structured format.

#### Acceptance Criteria

1. WHEN a terrain analysis artifact is rendered THEN the system SHALL display a feature table below the map
2. WHEN the feature table loads THEN the system SHALL show columns for Type, OSM ID, Name, and Details
3. WHEN the feature table has more than 5 items THEN the system SHALL provide pagination controls
4. WHEN viewing the feature table THEN the system SHALL display the correct feature count in the header
5. WHEN the table is empty THEN the system SHALL show an appropriate empty state message

### Requirement 5: Fix Water Body Styling

**User Story:** As a user, I want water bodies to be properly styled with blue fill, so that I can easily identify water features on the map.

#### Acceptance Criteria

1. WHEN water features are rendered THEN the system SHALL fill polygons with blue color (fillOpacity: 0.4)
2. WHEN water features are rendered THEN the system SHALL use darkblue borders (weight: 2)
3. WHEN clicking on water features THEN the system SHALL show proper feature type (not 'way')
4. WHEN water features are displayed THEN the system SHALL match the original Renewables notebook styling
5. WHEN hovering over water features THEN the system SHALL show appropriate visual feedback

### Requirement 6: Fix Building Styling

**User Story:** As a user, I want buildings to be properly styled with red fill, so that I can easily identify building structures on the map.

#### Acceptance Criteria

1. WHEN building features are rendered THEN the system SHALL fill polygons with red color (fillOpacity: 0.4)
2. WHEN building features are rendered THEN the system SHALL use darkred borders (weight: 2)
3. WHEN clicking on buildings THEN the system SHALL show proper feature type and building details
4. WHEN buildings are displayed THEN the system SHALL match the original Renewables notebook styling
5. WHEN building polygons are rendered THEN the system SHALL properly close the polygon shapes

### Requirement 7: Restore Original Feature Styling

**User Story:** As a developer, I want to match the original Renewables notebook feature styling, so that the visualization is consistent with the reference implementation.

#### Acceptance Criteria

1. WHEN comparing with the original notebook THEN the system SHALL use the same color scheme for each feature type
2. WHEN rendering highways THEN the system SHALL display them as lines (not filled polygons)
3. WHEN rendering water/buildings THEN the system SHALL display them as filled polygons
4. WHEN features have names THEN the system SHALL display the name in popups
5. WHEN features have OSM tags THEN the system SHALL display relevant tag information in popups

### Requirement 8: Verify Complete Rendering

**User Story:** As a QA tester, I want to verify all map components work correctly, so that I can confirm the fix is successful.

#### Acceptance Criteria

1. WHEN testing with real terrain data THEN the system SHALL render the map with all features
2. WHEN checking the feature table THEN the system SHALL display all features with correct data
3. WHEN verifying map controls THEN the system SHALL show zoom controls and layer switcher
4. WHEN testing map interactions THEN the system SHALL respond to drag, zoom, and click events
5. WHEN checking browser console THEN the system SHALL show no Leaflet-related errors
