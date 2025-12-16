# Requirements Document

## Introduction

The shale volume calculator tool currently returns text-only responses instead of rich interactive artifacts with visualizations. This is a regression from the previous implementation which provided comprehensive shale analysis artifacts with depth plots, statistical charts, and completion recommendations. Users need the same rich visualization experience for shale volume analysis that they get for porosity analysis.

## Glossary

- **Shale Volume (Vsh)**: The fraction of rock volume occupied by shale/clay minerals, calculated from gamma ray logs
- **Artifact**: A structured data object containing analysis results, visualizations, and metadata that the frontend renders as interactive UI components
- **MCP Tool**: Model Context Protocol tool - a backend function that performs calculations and returns structured responses
- **Enhanced Strands Agent**: The petrophysics agent that orchestrates tool calls and formats responses
- **Gamma Ray (GR) Log**: A well log measuring natural radioactivity, used to identify shale content
- **IGR (Gamma Ray Index)**: Normalized gamma ray value used in shale volume calculations
- **Larionov Method**: Non-linear shale volume calculation method accounting for geological age
- **messageContentType**: Identifier field in artifacts that tells the frontend which component to use for rendering

## Requirements

### Requirement 1

**User Story:** As a petrophysicist, I want to see interactive visualizations when I calculate shale volume, so that I can analyze gamma ray data and identify clean sand intervals for completion targeting.

#### Acceptance Criteria

1. WHEN a user requests shale volume calculation for a well THEN the system SHALL return a comprehensive artifact with messageContentType 'comprehensive_shale_analysis'
2. WHEN the shale volume artifact is created THEN the system SHALL include depth plots showing shale volume vs depth with clean sand interval highlighting
3. WHEN the shale volume artifact is created THEN the system SHALL include statistical charts showing distribution analysis and quartile summaries
4. WHEN the shale volume artifact is created THEN the system SHALL include an executive summary with key findings and completion recommendations
5. WHEN the shale volume artifact is created THEN the system SHALL include methodology documentation with formulas, parameters, and industry standards

### Requirement 2

**User Story:** As a petrophysicist, I want shale volume analysis to match the quality and depth of porosity analysis, so that I have consistent professional-grade tools across all petrophysical calculations.

#### Acceptance Criteria

1. WHEN comparing shale volume and porosity artifacts THEN both SHALL include executive summaries with key findings
2. WHEN comparing shale volume and porosity artifacts THEN both SHALL include interactive depth plots with statistical overlays
3. WHEN comparing shale volume and porosity artifacts THEN both SHALL include methodology documentation with formulas and parameters
4. WHEN comparing shale volume and porosity artifacts THEN both SHALL include quality metrics and uncertainty analysis
5. WHEN comparing shale volume and porosity artifacts THEN both SHALL follow the same artifact structure pattern with messageContentType, analysisType, and results

### Requirement 3

**User Story:** As a developer, I want the enhanced shale volume tool to create artifacts instead of returning JSON strings, so that the agent can preserve and pass through rich visualizations to the frontend.

#### Acceptance Criteria

1. WHEN the enhancedCalculateShaleVolumeTool executes THEN the system SHALL create an artifact object with structured data
2. WHEN the enhancedCalculateShaleVolumeTool returns THEN the system SHALL include the artifact in the response artifacts array
3. WHEN the agent receives the tool response THEN the system SHALL preserve artifacts without modification
4. WHEN the agent formats the response THEN the system SHALL NOT strip artifacts by returning only message text
5. WHEN the final response is sent to the frontend THEN the system SHALL include all artifacts in the response payload

### Requirement 4

**User Story:** As a petrophysicist, I want shale volume calculations to use the correct method-specific formulas, so that I get accurate results for different geological settings (tertiary vs pre-tertiary rocks).

#### Acceptance Criteria

1. WHEN using larionov_tertiary method THEN the system SHALL apply the formula Vsh = 0.083 * (2^(3.7*IGR) - 1)
2. WHEN using larionov_pre_tertiary method THEN the system SHALL apply the formula Vsh = 0.33 * (2^(2*IGR) - 1)
3. WHEN using clavier method THEN the system SHALL apply the formula Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
4. WHEN using linear method THEN the system SHALL apply the formula Vsh = IGR
5. WHEN calculating IGR THEN the system SHALL apply the formula IGR = (GR - GR_clean) / (GR_shale - GR_clean) with proper bounds [0, 1]

### Requirement 5

**User Story:** As a petrophysicist, I want clean sand intervals automatically identified in shale volume analysis, so that I can quickly target the best zones for completion.

#### Acceptance Criteria

1. WHEN shale volume is calculated THEN the system SHALL identify intervals where Vsh < 30% as clean sand zones
2. WHEN clean sand intervals are identified THEN the system SHALL calculate thickness, average shale volume, and net-to-gross ratio for each interval
3. WHEN clean sand intervals are identified THEN the system SHALL rank them by quality (Excellent, Good, Fair) based on shale volume
4. WHEN clean sand intervals are identified THEN the system SHALL assign completion priority (Primary Target, Secondary Target) based on thickness and quality
5. WHEN no clean sand intervals exist THEN the system SHALL provide clear messaging about reservoir quality and alternative completion strategies
