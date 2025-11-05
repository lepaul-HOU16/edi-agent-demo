# Requirements Document

## Introduction

The multi-well correlation workflow is currently broken. When users request multi-well correlation analysis (e.g., "create comprehensive multi-well correlation analysis for wells WELL-001, WELL-002, WELL-003, WELL-004, WELL-005"), the system incorrectly routes to the single well info handler and returns a dashboard for only WELL-001 instead of performing actual multi-well correlation.

## Glossary

- **Multi-Well Correlation**: Analysis that compares log data across multiple wells to identify geological patterns, reservoir zones, and formation continuity
- **Enhanced Strands Agent**: The AI agent responsible for routing and handling petrophysical analysis requests
- **MCP Tool**: Model Context Protocol tool that performs actual calculations and data retrieval
- **Artifact**: Structured data object containing visualization and analysis results that the frontend can render

## Requirements

### Requirement 1: Multi-Well Correlation Intent Detection

**User Story:** As a geoscientist, I want the system to correctly identify when I'm requesting multi-well correlation analysis, so that I get correlation visualizations instead of single well dashboards

#### Acceptance Criteria

1. WHEN a user query contains patterns like "multi-well correlation", "multiwell correlation", "correlation analysis", "wells WELL-001 WELL-002 WELL-003", THEN THE Enhanced Strands Agent SHALL detect intent type as 'multi_well_correlation'
2. WHEN the intent is detected as 'multi_well_correlation', THEN THE Enhanced Strands Agent SHALL extract all well names mentioned in the query
3. WHEN multiple well names are detected (2 or more), THEN THE Enhanced Strands Agent SHALL route to the multi-well correlation handler
4. WHEN the query matches preloaded prompt #2 patterns, THEN THE Enhanced Strands Agent SHALL route to multi-well correlation with high confidence score

### Requirement 2: Multi-Well Correlation Handler Implementation

**User Story:** As a geoscientist, I want a dedicated handler for multi-well correlation requests, so that the system performs the correct analysis workflow

#### Acceptance Criteria

1. WHEN the multi_well_correlation intent is detected, THEN THE Enhanced Strands Agent SHALL invoke a dedicated handleMultiWellCorrelation method
2. WHEN handleMultiWellCorrelation is invoked, THEN THE System SHALL extract well names from the user query
3. WHEN well names are extracted, THEN THE System SHALL validate that at least 2 wells are specified
4. IF fewer than 2 wells are specified, THEN THE System SHALL return a helpful message requesting multiple well names
5. WHEN valid well names are provided, THEN THE System SHALL call the appropriate MCP tool or backend service for multi-well correlation

### Requirement 3: Multi-Well Correlation Artifact Generation

**User Story:** As a geoscientist, I want to see correlation panels and cross-well visualizations, so that I can identify geological patterns across multiple wells

#### Acceptance Criteria

1. WHEN multi-well correlation analysis completes successfully, THEN THE System SHALL generate artifacts with messageContentType 'multi_well_correlation_analysis'
2. WHEN artifacts are generated, THEN THE System SHALL include normalized log correlations for gamma ray, resistivity, and porosity
3. WHEN artifacts are generated, THEN THE System SHALL include geological correlation lines and reservoir zone identification
4. WHEN artifacts are generated, THEN THE System SHALL include statistical analysis comparing the wells
5. WHEN artifacts are returned, THEN THE Frontend SHALL render interactive correlation panels

### Requirement 4: Error Handling and User Guidance

**User Story:** As a geoscientist, I want clear error messages when multi-well correlation fails, so that I can correct my request

#### Acceptance Criteria

1. WHEN multi-well correlation is requested without well names, THEN THE System SHALL return a message listing available wells and example queries
2. WHEN multi-well correlation is requested with only 1 well, THEN THE System SHALL return a message explaining that at least 2 wells are required
3. WHEN multi-well correlation is requested with non-existent wells, THEN THE System SHALL return a message identifying which wells don't exist
4. WHEN multi-well correlation fails due to missing data, THEN THE System SHALL return a message explaining which wells lack required log curves
5. WHEN any error occurs, THEN THE System SHALL maintain success: false in the response structure
