# Requirements Document

## Introduction

The petrophysics agent currently returns plain text responses for well analysis queries, which provides a poor user experience compared to other agents that return rich, interactive visualizations. This feature will transform the petrophysics agent responses to return professional artifacts with Cloudscape components, charts, tables, and interactive visualizations that match the quality of the renewable energy and EDIcraft agents.

## Glossary

- **System**: AWS Energy Data Insights platform
- **Petrophysics Agent**: AI agent that performs well log analysis and petrophysical calculations
- **Artifact**: Rich, interactive visualization component displayed in the chat interface
- **Cloudscape Components**: AWS design system components for professional UI rendering
- **Formation Evaluation**: Comprehensive well analysis including porosity, shale volume, saturation, and reservoir quality
- **MCP Server**: Model Context Protocol server that provides petrophysical calculation tools
- **Well Log Data**: Subsurface measurements from oil and gas wells (GR, RHOB, NPHI, RT curves)

## Requirements

### Requirement 1: Formation Evaluation Artifacts

**User Story:** As a petroleum engineer, I want formation evaluation results displayed as rich interactive artifacts, so that I can quickly understand well quality and make informed decisions.

#### Acceptance Criteria

1. WHEN a user requests "analyze well data for WELL-001" THEN the System SHALL return an artifact with type "formation_evaluation"
2. WHEN displaying formation evaluation results THEN the System SHALL include Cloudscape Container components with proper headers
3. WHEN showing workflow steps THEN the System SHALL use Cloudscape StatusIndicator components with success/error states
4. WHEN presenting calculation results THEN the System SHALL use Cloudscape KeyValuePairs for statistics
5. WHEN displaying porosity data THEN the System SHALL include a Plotly chart showing depth vs porosity
6. WHEN showing shale volume THEN the System SHALL include a Plotly chart showing depth vs shale volume with color fills
7. WHEN presenting water saturation THEN the System SHALL include a Plotly chart showing depth vs saturation
8. WHEN displaying reservoir quality THEN the System SHALL use Cloudscape ProgressBar components for quality metrics
9. WHEN showing data quality THEN the System SHALL use Cloudscape Alert components for warnings or issues
10. WHEN presenting methodology THEN the System SHALL use Cloudscape ExpandableSection for detailed documentation

### Requirement 2: Porosity Analysis Artifacts

**User Story:** As a geoscientist, I want porosity calculations displayed with interactive charts and statistical summaries, so that I can evaluate reservoir quality visually.

#### Acceptance Criteria

1. WHEN a user requests "calculate porosity for WELL-001" THEN the System SHALL return an artifact with type "porosity_analysis"
2. WHEN displaying porosity results THEN the System SHALL include a depth plot showing density porosity, neutron porosity, and effective porosity
3. WHEN showing porosity statistics THEN the System SHALL use Cloudscape Table components with mean, median, min, max, and standard deviation
4. WHEN presenting porosity distribution THEN the System SHALL include a histogram showing porosity value frequency
5. WHEN displaying uncertainty THEN the System SHALL show error bars or confidence intervals on the depth plot
6. WHEN showing data quality THEN the System SHALL include completeness percentage and outlier count
7. WHEN presenting methodology THEN the System SHALL include calculation formulas and parameters used

### Requirement 3: Shale Volume Artifacts

**User Story:** As a completion engineer, I want shale volume analysis displayed with clean sand identification, so that I can select optimal perforation intervals.

#### Acceptance Criteria

1. WHEN a user requests "calculate shale volume for WELL-001" THEN the System SHALL return an artifact with type "shale_volume_analysis"
2. WHEN displaying shale volume THEN the System SHALL include a depth plot with brown fill for shale and green fill for clean sand
3. WHEN showing clean sand intervals THEN the System SHALL use Cloudscape Table components listing depth ranges and thicknesses
4. WHEN presenting shale statistics THEN the System SHALL include average shale volume, net-to-gross ratio, and clean sand percentage
5. WHEN displaying gamma ray data THEN the System SHALL include the raw GR curve alongside calculated shale volume
6. WHEN showing cutoff values THEN the System SHALL indicate GR clean and GR shale values used for calculation
7. WHEN presenting method THEN the System SHALL display which method was used (Larionov, Clavier, Linear)

### Requirement 4: Water Saturation Artifacts

**User Story:** As a reservoir engineer, I want water saturation results displayed with hydrocarbon zones highlighted, so that I can identify productive intervals.

#### Acceptance Criteria

1. WHEN a user requests "calculate water saturation for WELL-001" THEN the System SHALL return an artifact with type "saturation_analysis"
2. WHEN displaying saturation THEN the System SHALL include a depth plot with blue fill for water and green fill for hydrocarbons
3. WHEN showing hydrocarbon zones THEN the System SHALL use Cloudscape Table components listing productive intervals
4. WHEN presenting saturation statistics THEN the System SHALL include average water saturation and hydrocarbon saturation
5. WHEN displaying resistivity data THEN the System SHALL include the RT curve alongside calculated saturation
6. WHEN showing parameters THEN the System SHALL display Rw, a, m, n values used in Archie equation
7. WHEN presenting uncertainty THEN the System SHALL include confidence intervals for saturation values

### Requirement 5: Multi-Well Correlation Artifacts

**User Story:** As a geoscientist, I want multi-well correlation displayed as an interactive panel, so that I can identify geological trends across the field.

#### Acceptance Criteria

1. WHEN a user requests multi-well correlation THEN the System SHALL return an artifact with type "multi_well_correlation"
2. WHEN displaying correlation THEN the System SHALL show normalized log curves for all wells side-by-side
3. WHEN showing geological markers THEN the System SHALL draw correlation lines across wells
4. WHEN presenting reservoir zones THEN the System SHALL highlight zones with consistent colors across wells
5. WHEN displaying statistics THEN the System SHALL use Cloudscape Table components for zone properties
6. WHEN showing completion targets THEN the System SHALL rank targets by quality with visual indicators
7. WHEN presenting correlation quality THEN the System SHALL use Cloudscape StatusIndicator for confidence levels

### Requirement 6: Data Quality Artifacts

**User Story:** As a data analyst, I want data quality assessment displayed with clear metrics and visualizations, so that I can identify data issues quickly.

#### Acceptance Criteria

1. WHEN a user requests data quality assessment THEN the System SHALL return an artifact with type "data_quality_assessment"
2. WHEN displaying completeness THEN the System SHALL use Cloudscape ProgressBar showing percentage of valid data points
3. WHEN showing outliers THEN the System SHALL include a scatter plot highlighting outlier points
4. WHEN presenting curve quality THEN the System SHALL use Cloudscape Table with quality scores for each curve
5. WHEN displaying environmental corrections THEN the System SHALL list corrections applied with Cloudscape StatusIndicator
6. WHEN showing data gaps THEN the System SHALL highlight missing depth intervals on a depth plot
7. WHEN presenting recommendations THEN the System SHALL use Cloudscape Alert components for actionable suggestions

### Requirement 7: Comprehensive Workflow Artifacts

**User Story:** As a petroleum engineer, I want comprehensive analysis workflows to return a single rich artifact with all results, so that I have a complete view of well performance.

#### Acceptance Criteria

1. WHEN a user requests comprehensive analysis THEN the System SHALL return an artifact with type "comprehensive_analysis"
2. WHEN displaying workflow results THEN the System SHALL use Cloudscape Tabs to organize different analysis sections
3. WHEN showing overview THEN the System SHALL include a summary tab with key metrics and quality indicators
4. WHEN presenting porosity THEN the System SHALL include a dedicated tab with porosity charts and statistics
5. WHEN displaying shale volume THEN the System SHALL include a dedicated tab with shale analysis and clean sand intervals
6. WHEN showing saturation THEN the System SHALL include a dedicated tab with saturation analysis and hydrocarbon zones
7. WHEN presenting reservoir quality THEN the System SHALL include a dedicated tab with quality metrics and completion recommendations
8. WHEN displaying methodology THEN the System SHALL include a dedicated tab with calculation documentation
9. WHEN showing audit trail THEN the System SHALL include a dedicated tab with calculation history and parameters

### Requirement 8: Artifact Rendering Infrastructure

**User Story:** As a developer, I want a consistent artifact rendering system for petrophysics, so that all analysis types display correctly in the chat interface.

#### Acceptance Criteria

1. WHEN the agent returns an artifact THEN the System SHALL include artifact type, title, and data in the response
2. WHEN the frontend receives an artifact THEN the System SHALL route it to the appropriate renderer component
3. WHEN rendering formation evaluation THEN the System SHALL use FormationEvaluationArtifact component
4. WHEN rendering porosity analysis THEN the System SHALL use PorosityAnalysisArtifact component
5. WHEN rendering shale volume THEN the System SHALL use ShaleVolumeArtifact component
6. WHEN rendering saturation analysis THEN the System SHALL use SaturationAnalysisArtifact component
7. WHEN rendering multi-well correlation THEN the System SHALL use MultiWellCorrelationArtifact component
8. WHEN rendering data quality THEN the System SHALL use DataQualityArtifact component
9. WHEN rendering comprehensive analysis THEN the System SHALL use ComprehensiveAnalysisArtifact component
10. WHERE an artifact type is not recognized THEN the System SHALL fall back to displaying the raw data in a Cloudscape Container

### Requirement 9: Chart and Visualization Quality

**User Story:** As a petroleum engineer, I want professional-quality charts that match industry standards, so that I can use them in presentations and reports.

#### Acceptance Criteria

1. WHEN displaying depth plots THEN the System SHALL use inverted Y-axis (depth increases downward)
2. WHEN showing log curves THEN the System SHALL use industry-standard colors (GR=green, RHOB=red, NPHI=blue, RT=black)
3. WHEN presenting porosity THEN the System SHALL use yellow/gold color scheme
4. WHEN displaying shale volume THEN the System SHALL use brown for shale and green for clean sand
5. WHEN showing saturation THEN the System SHALL use blue for water and green for hydrocarbons
6. WHEN rendering charts THEN the System SHALL include proper axis labels with units
7. WHEN displaying multiple curves THEN the System SHALL include a legend with curve names
8. WHEN showing data points THEN the System SHALL use appropriate line thickness and marker sizes
9. WHEN presenting fills THEN the System SHALL use semi-transparent colors for overlapping areas
10. WHEN rendering charts THEN the System SHALL be responsive and work on mobile devices

### Requirement 10: Error Handling and Fallbacks

**User Story:** As a user, I want clear error messages when analysis fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN MCP tool call fails THEN the System SHALL return an artifact with type "error" and clear error message
2. WHEN well data is missing THEN the System SHALL display available wells and suggest valid queries
3. WHEN required curves are missing THEN the System SHALL list missing curves and available alternatives
4. WHEN calculation fails THEN the System SHALL explain the failure reason and suggest parameter adjustments
5. WHEN data quality is poor THEN the System SHALL display warnings but still show available results
6. WHERE partial results are available THEN the System SHALL display them with warnings about missing data
7. WHEN displaying errors THEN the System SHALL use Cloudscape Alert components with appropriate severity levels
