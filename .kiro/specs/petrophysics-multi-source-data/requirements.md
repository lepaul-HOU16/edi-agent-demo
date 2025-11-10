# Requirements Document

## Introduction

This specification defines the enhancement of the petrophysical analysis agent to support multiple data sources beyond the current hardcoded S3 .las files. The agent must be able to discover, retrieve, and analyze well log data from OSDU (Open Subsurface Data Universe) and other external data sources while maintaining all existing S3-based functionality.

## Glossary

- **Petrophysics Agent**: The EnhancedStrandsAgent that performs petrophysical calculations (porosity, shale volume, saturation)
- **OSDU**: Open Subsurface Data Universe - external API providing access to subsurface data
- **MCP Server**: Model Context Protocol server that provides well data access and calculations
- **Data Source**: Origin of well log data (S3, OSDU, or future sources)
- **Well Log Data**: Time-series measurements from wellbores including curves like GR, RHOB, NPHI, RT
- **LAS File**: Log ASCII Standard file format for well log data
- **Data Source Adapter**: Component that translates between different data source formats and the agent's internal format

## Requirements

### Requirement 1: Preserve Existing S3 Functionality

**User Story:** As a geoscientist using the petrophysics agent, I want all existing S3-based well analysis to continue working exactly as it does now, so that my current workflows are not disrupted.

#### Acceptance Criteria

1. WHEN the System receives a petrophysics query for wells WELL-001 through WELL-024, THE System SHALL continue to use the existing S3 bucket data source
2. WHEN the System performs calculations on S3 wells, THE System SHALL maintain the existing MCP server integration and calculation methods
3. WHEN the System displays results for S3 wells, THE System SHALL preserve all existing visualization and artifact formats
4. THE System SHALL NOT modify or remove any existing S3 data access code
5. THE System SHALL maintain backward compatibility with all existing petrophysics queries

### Requirement 2: Add OSDU Data Source Support

**User Story:** As a geoscientist, I want to perform petrophysical analysis on wells from OSDU (like "MAR-3"), so that I can analyze external subsurface data using the same professional tools.

#### Acceptance Criteria

1. WHEN the System receives a query mentioning an OSDU well name (e.g., "MAR-3"), THE System SHALL detect OSDU as the data source
2. WHEN the System needs well data from OSDU, THE System SHALL call the OSDU Search API to retrieve well information
3. WHEN the System receives OSDU well data, THE System SHALL extract log curves (GR, RHOB, NPHI, RT, etc.) from the OSDU response
4. WHEN the System has OSDU log data, THE System SHALL convert it to the internal format used by the MCP calculation engines
5. WHERE OSDU data is incomplete or missing required curves, THE System SHALL provide clear error messages indicating which curves are missing

### Requirement 3: Implement Data Source Detection

**User Story:** As a geoscientist, I want the system to automatically determine whether to use S3 or OSDU data based on my query, so that I don't need to manually specify the data source.

#### Acceptance Criteria

1. WHEN the System receives a well name matching the pattern WELL-\d+ (e.g., WELL-001), THE System SHALL route to S3 data source
2. WHEN the System receives a well name not matching S3 patterns, THE System SHALL attempt OSDU data source first
3. WHEN the System cannot find a well in the detected data source, THE System SHALL try alternative data sources before failing
4. THE System SHALL log the detected data source for debugging purposes
5. WHERE the user explicitly specifies a data source (e.g., "from OSDU"), THE System SHALL honor that preference

### Requirement 4: Create Data Source Abstraction Layer

**User Story:** As a developer, I want a clean abstraction layer for data sources, so that adding new sources in the future is straightforward and doesn't require modifying calculation logic.

#### Acceptance Criteria

1. THE System SHALL implement a DataSourceAdapter interface that all data sources must implement
2. WHEN a data source adapter is called, THE System SHALL return well data in a standardized format (depths, curves, metadata)
3. THE System SHALL implement an S3DataSourceAdapter that wraps existing S3 functionality
4. THE System SHALL implement an OSDUDataSourceAdapter that retrieves data from OSDU API
5. THE System SHALL use a DataSourceRegistry to manage and select appropriate adapters

### Requirement 5: Support OSDU Well Discovery

**User Story:** As a geoscientist, I want to search for wells in OSDU by name or pattern, so that I can discover available wells before performing analysis.

#### Acceptance Criteria

1. WHEN the System receives a query like "list OSDU wells", THE System SHALL call the OSDU Search API to retrieve available wells
2. WHEN the System displays OSDU wells, THE System SHALL show well names, locations, and available log curves
3. WHERE OSDU returns multiple matching wells, THE System SHALL display all matches and allow the user to select one
4. WHEN the System searches OSDU, THE System SHALL handle pagination if more than 10 results are returned
5. THE System SHALL cache OSDU well lists for 5 minutes to reduce API calls

### Requirement 6: Handle OSDU Data Format Differences

**User Story:** As a developer, I want OSDU data properly transformed to match the agent's expected format, so that calculations work correctly regardless of data source.

#### Acceptance Criteria

1. WHEN the System receives OSDU well data, THE System SHALL map OSDU curve names to standard names (e.g., "GammaRay" → "GR")
2. WHEN the System processes OSDU depth data, THE System SHALL convert to the same units used by S3 data (feet or meters)
3. WHERE OSDU uses different null value conventions, THE System SHALL normalize to -999.25 (the standard null value)
4. WHEN the System encounters OSDU-specific metadata, THE System SHALL preserve it for display but not require it for calculations
5. THE System SHALL validate that OSDU data contains required curves before attempting calculations

### Requirement 7: Maintain Calculation Engine Compatibility

**User Story:** As a geoscientist, I want the same professional petrophysical calculations to work on both S3 and OSDU data, so that results are consistent and reliable.

#### Acceptance Criteria

1. WHEN the System performs porosity calculations on OSDU data, THE System SHALL use the same PorosityCalculator as S3 data
2. WHEN the System performs shale volume calculations on OSDU data, THE System SHALL use the same ShaleVolumeCalculator as S3 data
3. WHEN the System performs saturation calculations on OSDU data, THE System SHALL use the same SaturationCalculator as S3 data
4. THE System SHALL apply the same data quality checks to OSDU data as S3 data
5. THE System SHALL generate the same artifact formats for OSDU results as S3 results

### Requirement 8: Provide Clear Data Source Attribution

**User Story:** As a geoscientist, I want to know which data source was used for my analysis, so that I can properly cite and validate results.

#### Acceptance Criteria

1. WHEN the System displays petrophysical results, THE System SHALL clearly indicate the data source (S3 or OSDU)
2. WHEN the System generates artifacts, THE System SHALL include data source metadata in the artifact
3. WHERE OSDU data is used, THE System SHALL include the OSDU record ID and data partition in the results
4. WHEN the System logs analysis operations, THE System SHALL log the data source for audit purposes
5. THE System SHALL display data source information in the chat response header

### Requirement 9: Handle Data Source Errors Gracefully

**User Story:** As a geoscientist, I want clear error messages when data source issues occur, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN the OSDU API is unavailable, THE System SHALL display "OSDU data source is currently unavailable. Try S3 wells (WELL-001 through WELL-024)."
2. WHEN a well is not found in any data source, THE System SHALL display "Well [name] not found in S3 or OSDU. Please verify the well name."
3. WHERE OSDU data is missing required curves, THE System SHALL display "Well [name] from OSDU is missing required curves: [list]. Cannot perform [analysis type]."
4. WHEN OSDU API returns an error, THE System SHALL log the error details but display a user-friendly message
5. THE System SHALL never expose OSDU API keys or internal error details to the user

### Requirement 10: Enable Future Data Source Extensibility

**User Story:** As a developer, I want the architecture to support adding new data sources in the future (e.g., corporate databases, cloud storage), so that the system can grow with business needs.

#### Acceptance Criteria

1. THE System SHALL use a plugin-style architecture where new data source adapters can be added without modifying existing code
2. WHEN a new data source adapter is registered, THE System SHALL automatically include it in data source detection
3. THE System SHALL document the DataSourceAdapter interface with clear examples for future implementers
4. THE System SHALL provide a template adapter implementation that can be copied for new sources
5. THE System SHALL support priority ordering of data sources for fallback behavior

### Requirement 11: Optimize OSDU API Usage

**User Story:** As a system administrator, I want OSDU API calls to be efficient and cached appropriately, so that we don't exceed rate limits or incur unnecessary costs.

#### Acceptance Criteria

1. WHEN the System retrieves well data from OSDU, THE System SHALL cache the data for 15 minutes
2. WHEN the System performs multiple calculations on the same OSDU well, THE System SHALL reuse cached data
3. THE System SHALL implement exponential backoff for OSDU API retries on transient failures
4. THE System SHALL log OSDU API call counts and response times for monitoring
5. WHERE OSDU API rate limits are approached, THE System SHALL queue requests rather than failing immediately

### Requirement 12: Support Mixed-Source Analysis

**User Story:** As a geoscientist, I want to perform multi-well correlation analysis using wells from both S3 and OSDU, so that I can compare data from different sources.

#### Acceptance Criteria

1. WHEN the System receives a multi-well query with mixed sources (e.g., "correlate WELL-001 and MAR-3"), THE System SHALL retrieve data from both S3 and OSDU
2. WHEN the System displays mixed-source results, THE System SHALL clearly label each well's data source
3. THE System SHALL normalize depth units and curve names across sources for comparison
4. WHERE wells from different sources have different depth ranges, THE System SHALL handle overlapping and non-overlapping intervals appropriately
5. THE System SHALL generate correlation artifacts that work with mixed-source data

### Requirement 13: Maintain Professional Response Quality

**User Story:** As a geoscientist, I want OSDU-based analysis to maintain the same professional quality and industry standards as S3-based analysis, so that results are suitable for technical reports.

#### Acceptance Criteria

1. WHEN the System generates responses for OSDU data, THE System SHALL use the same ProfessionalResponseBuilder patterns as S3 data
2. WHEN the System displays OSDU results, THE System SHALL include SPE/API standard references and methodology documentation
3. THE System SHALL apply the same uncertainty quantification to OSDU data as S3 data
4. THE System SHALL generate the same quality metrics (completeness, outliers, noise) for OSDU data
5. WHERE OSDU data quality is lower than S3 data, THE System SHALL clearly indicate quality differences in the response

### Requirement 14: Enable Data Source Configuration

**User Story:** As a system administrator, I want to configure data source priorities and settings, so that I can control which sources are used and in what order.

#### Acceptance Criteria

1. THE System SHALL read data source configuration from environment variables
2. WHEN multiple data sources are available, THE System SHALL use the configured priority order
3. WHERE a data source is disabled in configuration, THE System SHALL skip it during detection
4. THE System SHALL allow configuration of data source-specific settings (e.g., OSDU data partition, S3 bucket)
5. THE System SHALL validate configuration on startup and log any issues

### Requirement 15: Integrate OSDU Data with Collection System

**User Story:** As a geoscientist, I want OSDU wells to be included in my collections and available in canvases, so that I can organize and analyze OSDU data alongside S3 data in my workspaces.

#### Acceptance Criteria

1. WHEN the System performs petrophysical analysis on an OSDU well, THE System SHALL add the well to the current collection context if one exists
2. WHEN the System saves a collection containing OSDU wells, THE System SHALL store OSDU source metadata (record ID, data partition, source URL)
3. WHEN the System loads a collection in a canvas, THE System SHALL retrieve OSDU well data using the stored metadata
4. WHERE a collection contains both S3 and OSDU wells, THE System SHALL display both types with clear source indicators
5. WHEN the System inherits collection context in a canvas, THE System SHALL make OSDU wells available for analysis and visualization

### Requirement 16: Enable OSDU Well Selection in Collections

**User Story:** As a geoscientist, I want to add OSDU wells to collections through the collection modal, so that I can curate datasets from multiple sources.

#### Acceptance Criteria

1. WHEN the System displays the collection creation modal, THE System SHALL show OSDU wells alongside S3 wells if OSDU search has been performed
2. WHEN the System saves a collection with OSDU wells, THE System SHALL store sufficient metadata to retrieve the wells later
3. WHERE OSDU wells are selected in a collection, THE System SHALL validate that the wells still exist in OSDU before saving
4. WHEN the System displays collection details, THE System SHALL show data source for each well (S3 or OSDU)
5. THE System SHALL allow filtering collections by data source

### Requirement 17: Maintain OSDU Data Context Across Sessions

**User Story:** As a geoscientist, I want OSDU well data to persist across sessions, so that I don't need to re-search OSDU every time I open a collection.

#### Acceptance Criteria

1. WHEN the System saves a collection with OSDU wells, THE System SHALL cache OSDU well data in the collection metadata
2. WHEN the System loads a collection with OSDU wells, THE System SHALL use cached data if available and fresh (less than 24 hours old)
3. WHERE cached OSDU data is stale, THE System SHALL refresh from OSDU API in the background
4. WHEN the System cannot refresh OSDU data, THE System SHALL use cached data and display a warning
5. THE System SHALL provide a "Refresh OSDU Data" action in collection views

### Requirement 18: Support OSDU Wells in Canvas Visualizations

**User Story:** As a geoscientist, I want to visualize OSDU well data on maps and in analysis panels within canvases, so that I can perform spatial analysis with mixed-source data.

#### Acceptance Criteria

1. WHEN the System displays wells on a map in a canvas, THE System SHALL show OSDU wells with distinct markers from S3 wells
2. WHEN the System displays well log visualizations in a canvas, THE System SHALL render OSDU data using the same components as S3 data
3. WHERE a canvas contains both S3 and OSDU wells, THE System SHALL enable cross-well correlation and comparison
4. WHEN the System performs spatial queries in a canvas, THE System SHALL include OSDU wells in proximity searches
5. THE System SHALL display OSDU well metadata (source, record ID) in well detail panels

### Requirement 19: Enable OSDU Data Inheritance in Workspaces

**User Story:** As a geoscientist, I want OSDU wells from my collections to be automatically available when I open a workspace, so that I can seamlessly continue analysis.

#### Acceptance Criteria

1. WHEN the System opens a workspace with a collection containing OSDU wells, THE System SHALL load OSDU well data into the workspace context
2. WHEN the System performs analysis in a workspace, THE System SHALL make OSDU wells available to the petrophysics agent
3. WHERE workspace context includes OSDU wells, THE System SHALL enable queries like "analyze all wells" to include OSDU data
4. WHEN the System displays workspace well lists, THE System SHALL show data source for each well
5. THE System SHALL maintain OSDU data context when switching between workspaces

### Requirement 20: Enhance Existing Data Source Selector with Multi-Select

**User Story:** As a geoscientist using the data catalog, I want to select which data sources to search, so that I can control where my queries are executed and prepare for future data sources.

#### Acceptance Criteria

1. THE System SHALL preserve the EXACT existing UI appearance, styling, and positioning of the current data source selector
2. THE System SHALL ONLY add multi-select functionality to the existing selector component without changing its visual design
3. THE System SHALL replace the current "Auto" option with "Select All Sources" that auto-checks all available sources individually
4. THE System SHALL display available data sources: "S3 (Local Wells)", "OSDU", "TGS (In Development)", "VOLVE (In Development)"
5. WHERE a data source is marked "In Development", THE System SHALL display it as disabled with a tooltip
6. WHEN the user performs a search, THE System SHALL query only the selected data sources
7. THE System SHALL remember the user's data source selection across sessions
8. THE System SHALL NOT modify any other UI elements, inputs, or components in the data catalog
9. THE System SHALL NOT change the selector's dimensions, colors, fonts, or spacing from the current implementation

### Requirement 21: Provide Data Source Testing Tools

**User Story:** As a developer, I want testing tools to validate data source integrations, so that I can ensure new sources work correctly before deployment.

#### Acceptance Criteria

1. THE System SHALL provide a test script that validates S3 data source connectivity
2. THE System SHALL provide a test script that validates OSDU data source connectivity
3. THE System SHALL provide a test script that validates data format conversion for each source
4. THE System SHALL provide example queries for testing each data source
5. THE System SHALL log detailed diagnostic information during test runs

