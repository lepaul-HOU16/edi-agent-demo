# Bugfix Requirements Document

## Introduction

The map component crashes with `Invalid LngLat object: (NaN, NaN)` and `Invalid LngLat object: (NaN, 0)` errors when well data contains missing, null, or undefined coordinates. The bug manifests in three distinct code paths within `MapComponent.tsx` and is fed by unvalidated coordinate data from `CatalogPage.tsx`. The crashes break the map view entirely, preventing users from viewing search results on the map.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN catalog search returns well records with null/undefined longitude or latitude AND `CatalogPage.tsx` constructs GeoJSON features using `record.longitude || 0` / `record.latitude || 0` (which does NOT catch `NaN`) THEN the system produces GeoJSON features with NaN coordinates that propagate to the map

1.2 WHEN `fitBoundsToFeatures` in `MapComponent.tsx` collects coordinates from GeoJSON features that contain NaN values THEN the system passes NaN coordinates to `maplibregl.LngLatBounds.extend()` which throws `Invalid LngLat object: (NaN, NaN)`

1.3 WHEN `fitBounds` in `MapComponent.tsx` receives bounds containing NaN values (minLon, maxLon, minLat, or maxLat) THEN the system passes NaN to `new maplibregl.LngLatBounds()` which throws `Invalid LngLat object`

1.4 WHEN `restoreMapState` in `MapComponent.tsx` receives a state object with NaN center coordinates (derived from NaN bounds via `(bounds.minLon + bounds.maxLon) / 2`) THEN the system passes NaN center to `map.jumpTo()` which throws `Invalid LngLat object: (NaN, NaN)`

1.5 WHEN `CatalogPage.tsx` calculates bounds from coordinates that include NaN values using `Math.min(...coordinates.map(c => c[0]))` THEN the system produces NaN bounds because `Math.min/Math.max` with any NaN input returns NaN, and these NaN bounds propagate to `setMapState`, `fitBounds`, and `restoreMapState`

1.6 WHEN a single-point feature has NaN coordinates AND `fitBoundsToFeatures` calls `mapRef.current.setCenter(allCoordinates[0])` THEN the system crashes with `Invalid LngLat object`

### Expected Behavior (Correct)

2.1 WHEN catalog search returns well records with null, undefined, or NaN longitude/latitude THEN the system SHALL filter out those records before constructing GeoJSON features, ensuring no feature has NaN coordinates

2.2 WHEN `fitBoundsToFeatures` collects coordinates from GeoJSON features THEN the system SHALL filter out any coordinates where longitude or latitude is NaN, null, undefined, or not a finite number before calculating bounds

2.3 WHEN `fitBounds` receives bounds containing NaN or non-finite values in any of minLon, maxLon, minLat, or maxLat THEN the system SHALL skip the fitBounds call and log a warning instead of passing invalid values to maplibre-gl

2.4 WHEN `restoreMapState` receives a state with NaN or non-finite center coordinates THEN the system SHALL skip the jumpTo call and log a warning instead of passing invalid values to maplibre-gl

2.5 WHEN `CatalogPage.tsx` calculates bounds from well coordinates THEN the system SHALL first filter out any coordinates with NaN or non-finite values before computing Math.min/Math.max, and SHALL return null bounds if no valid coordinates remain

2.6 WHEN all features in a search result have invalid coordinates THEN the system SHALL keep the map at its current position and log a warning, rather than crashing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN catalog search returns well records with valid finite longitude and latitude values THEN the system SHALL CONTINUE TO construct GeoJSON features and display them on the map correctly

3.2 WHEN `fitBoundsToFeatures` receives GeoJSON features with all valid coordinates THEN the system SHALL CONTINUE TO calculate bounds and animate the map to fit those bounds

3.3 WHEN `fitBounds` receives bounds with all valid finite values THEN the system SHALL CONTINUE TO call `maplibregl.LngLatBounds` and fit the map to those bounds with padding and animation

3.4 WHEN `restoreMapState` receives a state with valid finite center coordinates and zoom THEN the system SHALL CONTINUE TO call `map.jumpTo()` and restore the map view correctly

3.5 WHEN switching between catalog panel and map panel with valid saved map state THEN the system SHALL CONTINUE TO restore the map view with the correct well data, bounds, and center position

3.6 WHEN a mix of valid and invalid coordinate wells are returned THEN the system SHALL CONTINUE TO display the valid wells on the map and fit bounds to only the valid wells
