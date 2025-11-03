# Requirements Document

## Introduction

The terrain analysis feature is currently returning 150K+ OSM features to the frontend, causing severe performance issues and browser crashes. The frontend component attempts to render all features on the map, which is not feasible. We need to implement intelligent feature filtering and sampling to return only the most relevant features while maintaining accurate analysis metrics.

## Requirements

### Requirement 1: Backend Feature Filtering

**User Story:** As a user analyzing terrain, I want the map to load quickly and display the most important features, so that I can make informed decisions without waiting for 150K features to render.

#### Acceptance Criteria

1. WHEN the backend queries OSM data THEN it SHALL filter features to a maximum of 1000 most relevant features for map display
2. WHEN filtering features THEN it SHALL prioritize features by importance (buildings > major highways > water > minor roads)
3. WHEN filtering features THEN it SHALL maintain accurate total feature counts in metrics
4. WHEN filtering features THEN it SHALL preserve all exclusion zones regardless of count
5. WHEN filtering features THEN it SHALL include a `filtered` flag in the response indicating data was sampled

### Requirement 2: Feature Importance Scoring

**User Story:** As a wind farm developer, I want to see the most critical terrain features first, so that I can quickly assess site suitability.

#### Acceptance Criteria

1. WHEN scoring features THEN buildings SHALL have highest priority (score: 100)
2. WHEN scoring features THEN major highways SHALL have high priority (score: 80)
3. WHEN scoring features THEN water bodies SHALL have medium-high priority (score: 70)
4. WHEN scoring features THEN power infrastructure SHALL have medium priority (score: 60)
5. WHEN scoring features THEN minor roads SHALL have low priority (score: 30)
6. WHEN scoring features THEN other features SHALL have lowest priority (score: 10)

### Requirement 3: Spatial Distribution

**User Story:** As a user viewing the terrain map, I want features distributed across the entire analysis area, so that I don't see clustering in one region while other areas appear empty.

#### Acceptance Criteria

1. WHEN sampling features THEN it SHALL divide the area into a grid (e.g., 10x10)
2. WHEN sampling features THEN it SHALL select top N features from each grid cell
3. WHEN a grid cell has fewer than N features THEN it SHALL include all features from that cell
4. WHEN sampling THEN it SHALL ensure geographic coverage across the entire radius

### Requirement 4: Frontend Display Optimization

**User Story:** As a user, I want the terrain map to render smoothly without freezing my browser, so that I can interact with the visualization immediately.

#### Acceptance Criteria

1. WHEN receiving filtered features THEN the frontend SHALL display a notice indicating data was sampled
2. WHEN displaying metrics THEN it SHALL show both total features and displayed features
3. WHEN features are filtered THEN it SHALL provide a way to view full feature statistics
4. WHEN the map loads THEN it SHALL render within 3 seconds

### Requirement 5: Metrics Accuracy

**User Story:** As a wind farm analyst, I need accurate feature counts and statistics, so that my site assessment is based on complete data even if the map shows a subset.

#### Acceptance Criteria

1. WHEN filtering features THEN metrics SHALL reflect the TOTAL unfiltered feature count
2. WHEN filtering features THEN feature breakdown by type SHALL reflect TOTAL counts
3. WHEN filtering features THEN the response SHALL include both `totalFeatures` and `displayedFeatures`
4. WHEN filtering features THEN exclusion zone analysis SHALL use ALL features, not just displayed ones
