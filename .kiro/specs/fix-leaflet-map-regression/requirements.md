# Requirements Document

## Introduction

The Leaflet map component in the TerrainMapArtifact was previously working but has stopped loading. This regression needs to be diagnosed and fixed to restore the interactive map functionality for terrain analysis artifacts.

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

### Requirement 4: Verify Map Rendering

**User Story:** As a QA tester, I want to verify the map works correctly, so that I can confirm the fix is successful.

#### Acceptance Criteria

1. WHEN testing with real terrain data THEN the system SHALL render the map with all features
2. WHEN checking the map container THEN the system SHALL have the correct dimensions (600px height)
3. WHEN verifying map controls THEN the system SHALL show zoom controls and layer switcher
4. WHEN testing map interactions THEN the system SHALL respond to drag, zoom, and click events
5. WHEN checking browser console THEN the system SHALL show no Leaflet-related errors
