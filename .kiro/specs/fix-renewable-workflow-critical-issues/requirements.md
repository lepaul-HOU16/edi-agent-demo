# Requirements Document

## Introduction

This spec addresses critical failures in the renewable energy workflow that prevent the demo from functioning. The system currently fails at multiple points: wake simulation errors, incorrect layout algorithm selection, missing terrain feature visualization, and lack of guided workflow navigation.

## Glossary

- **System**: The renewable energy analysis platform
- **User**: A person using the renewable energy demo workflow
- **Terrain Analysis**: The first step that identifies site features and constraints
- **Layout Optimization**: The second step that places turbines intelligently
- **Wake Simulation**: The third step that calculates energy production
- **Call-to-Action (CTA)**: Interactive buttons that guide users through the workflow
- **Perimeter**: The boundary polygon of the analysis area
- **OSM Features**: OpenStreetMap geographic features (roads, buildings, water bodies)
- **Intelligent Placement**: Algorithm that uses terrain features to optimize turbine locations
- **Grid Layout**: Simple grid-based turbine placement (fallback algorithm)

## Requirements

### Requirement 1: Wake Simulation Must Execute Successfully

**User Story:** As a user, I want wake simulation to complete without errors, so that I can see energy production estimates.

#### Acceptance Criteria

1. WHEN the User requests wake simulation, THE System SHALL retrieve layout data from S3
2. WHEN layout data exists in S3, THE System SHALL pass complete layout JSON to simulation Lambda
3. IF layout data is missing from S3, THEN THE System SHALL return a clear error message indicating the missing data
4. WHEN simulation Lambda receives layout data, THE System SHALL execute py-wake calculations without errors
5. WHEN simulation completes, THE System SHALL return AEP and capacity factor results

### Requirement 2: Layout Optimization Must Use Intelligent Placement

**User Story:** As a user, I want turbines placed intelligently based on terrain features, so that the layout respects site constraints.

#### Acceptance Criteria

1. WHEN terrain analysis completes with OSM features, THE System SHALL select intelligent placement algorithm
2. WHEN intelligent placement executes, THE System SHALL use OSM features as constraints
3. WHEN OSM features include exclusion zones, THE System SHALL place turbines outside those zones
4. WHEN intelligent placement completes, THE System SHALL save layout JSON to S3 with algorithm metadata
5. IF OSM data is unavailable, THEN THE System SHALL fall back to grid layout with logged warning

### Requirement 3: Turbine Layout Must Display Terrain Features

**User Story:** As a user, I want to see terrain features overlaid on the turbine layout, so that I understand placement decisions.

#### Acceptance Criteria

1. WHEN layout visualization renders, THE System SHALL display the site perimeter polygon
2. WHEN OSM features exist, THE System SHALL render roads as lines on the map
3. WHEN OSM features exist, THE System SHALL render buildings as polygons on the map
4. WHEN OSM features exist, THE System SHALL render water bodies as blue polygons on the map
5. WHEN turbines are placed, THE System SHALL render turbine markers on top of terrain features

### Requirement 4: Workflow Must Provide Call-to-Action Navigation

**User Story:** As a user, I want guided buttons to step through the workflow, so that I can complete the demo without typing prompts.

#### Acceptance Criteria

1. WHEN terrain analysis completes, THE System SHALL display a CTA button "Optimize Turbine Layout"
2. WHEN layout optimization completes, THE System SHALL display a CTA button "Run Wake Simulation"
3. WHEN wake simulation completes, THE System SHALL display a CTA button "Generate Wind Rose"
4. WHEN wind rose completes, THE System SHALL display a CTA button "View Project Dashboard"
5. WHEN User clicks a CTA button, THE System SHALL execute the corresponding analysis step

### Requirement 5: Dashboards Must Be Accessible

**User Story:** As a user, I want to access consolidated dashboards, so that I can view all analysis results in one place.

#### Acceptance Criteria

1. WHEN any analysis completes, THE System SHALL make dashboard artifacts available
2. WHEN User requests project dashboard, THE System SHALL display WindResourceDashboard component
3. WHEN User requests project dashboard, THE System SHALL display PerformanceAnalysisDashboard component
4. WHEN User requests project dashboard, THE System SHALL display WakeAnalysisDashboard component
5. WHEN dashboards render, THE System SHALL display all completed analysis results

### Requirement 6: Layout JSON Must Persist to S3

**User Story:** As a developer, I want layout data saved to S3, so that wake simulation can retrieve it.

#### Acceptance Criteria

1. WHEN layout optimization completes, THE System SHALL serialize layout data to JSON
2. WHEN layout JSON is created, THE System SHALL include turbine coordinates array
3. WHEN layout JSON is created, THE System SHALL include perimeter polygon
4. WHEN layout JSON is created, THE System SHALL include OSM features array
5. WHEN layout JSON is complete, THE System SHALL upload to S3 with project-specific key

### Requirement 7: Error Messages Must Be Actionable

**User Story:** As a user, I want clear error messages, so that I know how to fix problems.

#### Acceptance Criteria

1. WHEN wake simulation fails due to missing layout, THE System SHALL display "Please run layout optimization first"
2. WHEN layout optimization fails due to missing terrain, THE System SHALL display "Please run terrain analysis first"
3. WHEN any Lambda times out, THE System SHALL display "Analysis is taking longer than expected, please try again"
4. WHEN S3 retrieval fails, THE System SHALL display "Unable to retrieve analysis data, please contact support"
5. WHEN parameter validation fails, THE System SHALL display specific missing parameter names
