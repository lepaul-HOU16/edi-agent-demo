# Requirements Document

## Introduction

Map markers disappear permanently when switching themes (Light/Dark) in the Data Catalog. The root cause is that `updateMapData()` renders markers but doesn't save the data to `currentMapState.wellData`, so when the theme change handler tries to restore markers after `setStyle()` wipes the map, there's no data to restore.

## Glossary

- **MapComponent**: The map component in `src/pages/MapComponent.tsx` that renders well markers
- **Theme Change**: Switching between Light and Dark color schemes
- **currentMapState**: React state that should persist well data across theme changes
- **updateMapData**: Function that renders markers on the map
- **setStyle**: MapLibre function that changes map style but wipes all layers/sources

## Requirements

### Requirement 1: Persist Well Data in State

**User Story:** As a developer, I want well data saved to state when markers are rendered, so that markers can be restored after theme changes.

#### Acceptance Criteria

1. WHEN updateMapData is called with geoJsonData THEN the System SHALL save geoJsonData to currentMapState.wellData
2. WHEN weather data is rendered THEN the System SHALL save both well features and weather features to state
3. WHEN the map is cleared THEN the System SHALL set currentMapState.wellData to null
4. WHEN markers are rendered THEN the System SHALL update state before rendering to ensure data is available
5. WHEN state is updated THEN the System SHALL preserve existing state properties (center, zoom, pitch, bearing)

### Requirement 2: Restore Markers After Theme Change

**User Story:** As a user, I want my well markers to remain visible when I switch themes, so that I don't lose my search results.

#### Acceptance Criteria

1. WHEN the theme changes THEN the System SHALL save current map state (center, zoom, pitch, bearing) before setStyle
2. WHEN setStyle completes THEN the System SHALL restore camera position immediately
3. WHEN styledata event fires THEN the System SHALL check if currentMapState.wellData exists
4. WHERE wellData exists THEN the System SHALL call updateMapData to re-render markers
5. WHEN markers are restored THEN the System SHALL maintain the same visual appearance and interactivity

### Requirement 3: Restore Weather Layers After Theme Change

**User Story:** As a user, I want weather layers to remain visible when I switch themes, so that my weather visualization persists.

#### Acceptance Criteria

1. WHEN weather layers are active THEN the System SHALL track active layer types in currentMapState.weatherLayers
2. WHEN the theme changes THEN the System SHALL save which weather layers were visible
3. WHEN styledata event fires THEN the System SHALL check currentMapState.weatherLayers
4. WHERE weather layers were active THEN the System SHALL re-enable them with toggleWeatherLayer
5. WHEN weather layers are restored THEN the System SHALL maintain the same visibility and opacity settings

### Requirement 4: Handle Edge Cases

**User Story:** As a developer, I want edge cases handled gracefully, so that theme changes never break the map.

#### Acceptance Criteria

1. WHEN no well data exists THEN theme change SHALL complete without errors
2. WHEN map is in 3D mode THEN theme change SHALL preserve 3D state (pitch, bearing)
3. WHEN polygons are drawn THEN theme change SHALL preserve polygon overlays
4. WHEN multiple theme changes occur rapidly THEN the System SHALL handle them without race conditions
5. WHEN theme change fails THEN the System SHALL log errors and maintain current state

### Requirement 5: Maintain Performance

**User Story:** As a user, I want theme changes to be smooth and fast, so that the UI feels responsive.

#### Acceptance Criteria

1. WHEN theme changes THEN the transition SHALL complete in under 1 second
2. WHEN markers are restored THEN the System SHALL use the existing updateMapData function without duplication
3. WHEN state is updated THEN the System SHALL use functional setState to avoid stale closures
4. WHEN multiple layers exist THEN the System SHALL restore them efficiently without blocking the UI
5. WHEN theme changes THEN the System SHALL provide visual feedback (loading indicator if needed)

### Requirement 6: Add Defensive Logging

**User Story:** As a developer, I want clear logs during theme changes, so that I can debug issues quickly.

#### Acceptance Criteria

1. WHEN theme change starts THEN the System SHALL log the new theme and current state
2. WHEN saving state THEN the System SHALL log what data is being saved (well count, weather layers)
3. WHEN restoring markers THEN the System SHALL log how many markers are being restored
4. WHEN restoration completes THEN the System SHALL log success with marker count
5. WHEN errors occur THEN the System SHALL log detailed error information with context

