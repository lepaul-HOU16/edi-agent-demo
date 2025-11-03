# Requirements Document: Fix Renewable Workflow UI Issues

## Introduction

This specification addresses critical UI/UX issues in the renewable energy workflow where users are not seeing expected visual elements and interactive features after deployment validation. The issues prevent users from progressing through the workflow and accessing key functionality.

## Glossary

- **Orchestrator**: The renewable energy orchestrator Lambda function that routes queries and generates artifacts
- **Artifact**: A structured data object containing visualization data and metadata returned to the frontend
- **GeoJSON**: Geographic data format used for map features
- **CTA Buttons**: Call-to-action buttons that guide users to the next workflow step
- **Perimeter**: The boundary polygon defining the wind farm site area
- **Wake Heat Map**: Interactive visualization showing wake interference between turbines
- **Terrain Features**: Geographic features like buildings, roads, and water bodies on the map

## Requirements

### Requirement 1: Call-to-Action Buttons

**User Story:** As a renewable energy analyst, I want to see contextual action buttons after each analysis step, so that I know what to do next in the workflow.

#### Acceptance Criteria

1. WHEN the Orchestrator generates a terrain analysis artifact, THE System SHALL include action buttons for "Optimize Turbine Layout" and "View Project Dashboard"
2. WHEN the Orchestrator generates a layout optimization artifact, THE System SHALL include action buttons for "Run Wake Simulation" and "Optimize Layout"
3. WHEN the Orchestrator generates a wake simulation artifact, THE System SHALL include action buttons for "Generate Report", "Optimize Layout", "Financial Analysis", and "Compare Scenarios"
4. WHEN the Frontend renders any renewable energy artifact, THE System SHALL display the WorkflowCTAButtons component with enabled buttons based on completed workflow steps
5. IF no action buttons are present in the artifact, THEN THE System SHALL log a warning and display default next-step suggestions

### Requirement 2: Terrain Feature Perimeter Visualization

**User Story:** As a renewable energy analyst, I want to see the site perimeter boundary on the terrain map, so that I understand the project boundaries and constraints.

#### Acceptance Criteria

1. WHEN the Terrain Tool Lambda generates terrain analysis results, THE System SHALL include a perimeter feature in the GeoJSON output with type "perimeter"
2. WHEN the perimeter feature is included in GeoJSON, THE System SHALL define it as a Polygon geometry with coordinates forming a closed boundary
3. WHEN the LayoutMapArtifact component renders terrain features, THE System SHALL render the perimeter as a dashed line with transparent fill
4. WHEN the user hovers over the perimeter on the map, THE System SHALL display a popup with "Site Perimeter" label and area information
5. WHEN the map legend is displayed, THE System SHALL include an entry for "Perimeter" with dashed line symbol

### Requirement 3: Layout Map Terrain Features

**User Story:** As a renewable energy analyst, I want to see terrain features (buildings, roads, water) on the layout optimization map, so that I can verify turbine placement avoids obstacles.

#### Acceptance Criteria

1. WHEN the Layout Tool Lambda generates layout results, THE System SHALL include all terrain features from the terrain analysis in the layout GeoJSON
2. WHEN terrain features are included in layout GeoJSON, THE System SHALL preserve feature properties including type, name, and styling attributes
3. WHEN the LayoutMapArtifact component renders the map, THE System SHALL render terrain features before rendering turbine markers
4. WHEN terrain features are rendered, THE System SHALL apply feature-specific styling (red for buildings, blue for water, gray for roads)
5. WHEN the map displays both terrain and turbines, THE System SHALL ensure turbines render on top of terrain features with proper z-index

### Requirement 4: Layout Map Turbine Visualization

**User Story:** As a renewable energy analyst, I want to see turbine positions as markers on the layout map, so that I can review the optimized turbine placement.

#### Acceptance Criteria

1. WHEN the Layout Tool Lambda generates layout results, THE System SHALL include turbine features in the GeoJSON with type "turbine"
2. WHEN turbine features are included in GeoJSON, THE System SHALL include properties for turbine_id, capacity_MW, hub_height_m, and rotor_diameter_m
3. WHEN the LayoutMapArtifact component renders turbines, THE System SHALL use Leaflet default markers (blue teardrop icons)
4. WHEN the user clicks a turbine marker, THE System SHALL display a popup with turbine specifications and coordinates
5. WHEN the map fits bounds, THE System SHALL ensure all turbines are visible within the viewport with appropriate padding

### Requirement 5: Wake Heat Map Visualization

**User Story:** As a renewable energy analyst, I want to see an interactive wake heat map, so that I can understand wake interference patterns and energy losses.

#### Acceptance Criteria

1. WHEN the Simulation Tool Lambda generates wake simulation results, THE System SHALL create an interactive HTML heat map visualization using Plotly
2. WHEN the heat map is created, THE System SHALL upload it to S3 and include the S3 URL in the artifact visualizations object as "wake_heat_map"
3. WHEN the WakeAnalysisArtifact component renders, THE System SHALL display the wake heat map in an iframe if the wake_heat_map URL is present
4. IF the wake_heat_map URL is not present, THEN THE System SHALL display an informational alert with alternative visualization options
5. WHEN the wake heat map loads, THE System SHALL show a loading indicator until the iframe content is fully rendered

### Requirement 6: Financial Analysis Intent Detection

**User Story:** As a renewable energy analyst, I want financial analysis queries to generate financial reports, so that I can evaluate project economics and ROI.

#### Acceptance Criteria

1. WHEN the user submits a query containing "financial analysis" or "ROI calculation", THE IntentRouter SHALL classify the intent as "report_generation" not "terrain_analysis"
2. WHEN the intent is classified as "report_generation", THE Orchestrator SHALL invoke the Report Tool Lambda not the Terrain Tool Lambda
3. WHEN the Report Tool Lambda is invoked for financial analysis, THE System SHALL generate a comprehensive report artifact with financial metrics
4. WHEN the report artifact is returned, THE System SHALL include artifact type "report_generation" or "financial_analysis"
5. IF the intent is misclassified, THEN THE System SHALL log the misclassification with query text and detected intent for debugging

### Requirement 7: Artifact Action Button Generation

**User Story:** As a system developer, I want the orchestrator to automatically generate contextual action buttons for each artifact type, so that users always have clear next steps.

#### Acceptance Criteria

1. WHEN the Orchestrator formats artifacts, THE System SHALL call generateActionButtons function for each artifact type
2. WHEN generateActionButtons is called for terrain_analysis, THE System SHALL return buttons for layout optimization and project dashboard
3. WHEN generateActionButtons is called for layout_optimization, THE System SHALL return buttons for wake simulation and layout refinement
4. WHEN generateActionButtons is called for wake_simulation, THE System SHALL return buttons for report generation, financial analysis, and scenario comparison
5. WHEN action buttons are generated, THE System SHALL include label, query, icon, and primary flag for each button

### Requirement 8: Frontend Artifact Rendering

**User Story:** As a frontend developer, I want artifact components to gracefully handle missing data, so that the UI doesn't break when backend data is incomplete.

#### Acceptance Criteria

1. WHEN an artifact component receives data without action buttons, THE System SHALL render WorkflowCTAButtons based on completedSteps prop
2. WHEN GeoJSON features array is empty, THE System SHALL display a placeholder message instead of attempting to render an empty map
3. WHEN visualization URLs are missing, THE System SHALL display informational alerts explaining what's missing and why
4. WHEN the map container has zero dimensions, THE System SHALL log an error and display a fallback message
5. WHEN any rendering error occurs, THE System SHALL catch the error, log it to console, and display a user-friendly error message

## Success Criteria

- All renewable energy artifacts display contextual action buttons
- Terrain analysis maps show site perimeter boundaries
- Layout optimization maps show both terrain features and turbine markers
- Wake simulation artifacts include interactive heat map visualizations
- Financial analysis queries generate financial reports, not terrain maps
- Users can progress through the complete workflow without UI blockers
- All map visualizations render correctly with proper feature styling
- Error states are handled gracefully with informative messages

## Out of Scope

- Performance optimization of map rendering
- Advanced financial modeling algorithms
- Multi-scenario comparison features
- Real-time collaboration features
- Mobile-responsive map interactions
- Offline map caching
