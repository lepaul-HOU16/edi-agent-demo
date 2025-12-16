# Requirements Document

## Introduction

The data quality assessment tool (`assess_well_data_quality`) is broken in production. Users receive an "Unknown tool: assess_well_data_quality" error when attempting to assess well data quality. This is a regression - the tool was previously working but is now missing from the petrophysics calculator Lambda function.

The root cause is that the Lambda handler only implements 3 tools (calculate_porosity, calculate_shale_volume, calculate_saturation) while the agent attempts to call 8 additional tools that exist in the MCP server but are missing from the Lambda.

## Glossary

- **Lambda Function**: AWS Lambda serverless compute function that executes petrophysical calculations
- **MCP Server**: Model Context Protocol server that provides well data analysis tools (scripts/mcp-well-data-server.py)
- **Petrophysics Calculator**: The Lambda function at cdk/lambda-functions/petrophysics-calculator/handler.py
- **Enhanced Strands Agent**: The agent that routes user requests to appropriate tools
- **LAS File**: Log ASCII Standard file format containing well log data
- **Well Data**: Petrophysical measurements from oil and gas wells stored in S3
- **Data Quality Assessment**: Analysis of well log data completeness, outliers, and noise
- **Curve**: A single measurement type in a well log (e.g., GR, RHOB, NPHI)

## Requirements

### Requirement 1

**User Story:** As a petrophysicist, I want to assess the quality of well data, so that I can determine if the data is suitable for analysis.

#### Acceptance Criteria

1. WHEN a user requests data quality assessment for a well THEN the system SHALL invoke the assess_well_data_quality tool successfully
2. WHEN the assess_well_data_quality tool is invoked THEN the system SHALL return quality metrics for all curves in the well
3. WHEN quality assessment completes THEN the system SHALL return overall quality rating (excellent, good, fair, poor)
4. WHEN quality assessment completes THEN the system SHALL return completeness percentage for each curve
5. WHEN quality assessment completes THEN the system SHALL return outlier detection results

### Requirement 2

**User Story:** As a petrophysicist, I want to assess individual curve quality, so that I can identify problematic measurements.

#### Acceptance Criteria

1. WHEN a user requests curve quality assessment THEN the system SHALL invoke the assess_curve_quality tool successfully
2. WHEN assess_curve_quality is invoked THEN the system SHALL analyze data completeness for the specified curve
3. WHEN assess_curve_quality is invoked THEN the system SHALL detect outliers in the curve data
4. WHEN assess_curve_quality is invoked THEN the system SHALL calculate noise level metrics
5. WHEN assess_curve_quality completes THEN the system SHALL return validation notes explaining quality issues

### Requirement 3

**User Story:** As a petrophysicist, I want to retrieve well information and curve data, so that I can perform custom analysis.

#### Acceptance Criteria

1. WHEN a user requests to list wells THEN the system SHALL invoke the list_wells tool successfully
2. WHEN a user requests well information THEN the system SHALL invoke the get_well_info tool successfully
3. WHEN a user requests curve data THEN the system SHALL invoke the get_curve_data tool successfully
4. WHEN a user requests curve statistics THEN the system SHALL invoke the calculate_statistics tool successfully
5. WHEN any data retrieval tool is invoked THEN the system SHALL fetch data from S3 bucket successfully

### Requirement 4

**User Story:** As a petrophysicist, I want detailed data completeness metrics, so that I can understand data gaps and coverage.

#### Acceptance Criteria

1. WHEN a user requests data completeness analysis THEN the system SHALL invoke the calculate_data_completeness tool successfully
2. WHEN calculate_data_completeness is invoked THEN the system SHALL calculate total data points
3. WHEN calculate_data_completeness is invoked THEN the system SHALL calculate valid data points
4. WHEN calculate_data_completeness is invoked THEN the system SHALL calculate null value count
5. WHEN calculate_data_completeness completes THEN the system SHALL return completeness percentage

### Requirement 5

**User Story:** As a petrophysicist, I want to validate environmental corrections, so that I can ensure measurements are properly calibrated.

#### Acceptance Criteria

1. WHEN a user requests environmental correction validation THEN the system SHALL invoke the validate_environmental_corrections tool successfully
2. WHEN validate_environmental_corrections is invoked for GR curve THEN the system SHALL validate gamma ray corrections
3. WHEN validate_environmental_corrections is invoked for RHOB curve THEN the system SHALL validate density corrections
4. WHEN validate_environmental_corrections is invoked for NPHI curve THEN the system SHALL validate neutron porosity corrections
5. WHEN validation completes THEN the system SHALL return correction status and recommendations

### Requirement 6

**User Story:** As a system administrator, I want all tools to return consistent response formats, so that the frontend can display results reliably.

#### Acceptance Criteria

1. WHEN any tool completes successfully THEN the system SHALL return response with success field set to true
2. WHEN any tool completes successfully THEN the system SHALL return response with message field containing human-readable summary
3. WHEN any tool completes successfully THEN the system SHALL return response with artifacts array containing visualization data
4. WHEN any tool encounters an error THEN the system SHALL return response with success field set to false
5. WHEN any tool encounters an error THEN the system SHALL return response with error field containing error description

### Requirement 7

**User Story:** As a developer, I want the Lambda function to match the MCP server capabilities, so that all documented tools are available in production.

#### Acceptance Criteria

1. WHEN the Lambda function is deployed THEN the system SHALL support all tools defined in the MCP server
2. WHEN the agent invokes any MCP tool THEN the Lambda SHALL recognize the tool name
3. WHEN the Lambda receives a tool request THEN the system SHALL validate required parameters
4. WHEN the Lambda processes a tool request THEN the system SHALL fetch LAS files from S3
5. WHEN the Lambda completes processing THEN the system SHALL return results in the expected format

### Requirement 8

**User Story:** As a petrophysicist, I want error messages to be clear and actionable, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN a well is not found THEN the system SHALL return error message stating which well was not found
2. WHEN a required curve is missing THEN the system SHALL return error message listing missing curves
3. WHEN S3 access fails THEN the system SHALL return error message with S3 bucket and key information
4. WHEN LAS file parsing fails THEN the system SHALL return error message with parsing details
5. WHEN any error occurs THEN the system SHALL NOT return mock or fake data

### Requirement 9

**User Story:** As a petrophysicist, I want to see data completeness as a visual progress indicator, so that I can quickly assess data coverage at a glance.

#### Acceptance Criteria

1. WHEN data quality assessment completes THEN the system SHALL ensure summary.average_completeness field is present in the response
2. WHEN the CloudscapeDataQualityDisplay component receives data THEN the system SHALL render the progress bar if summary.average_completeness is defined
3. WHEN the progress bar is rendered THEN the system SHALL show the percentage value alongside the visual indicator
4. WHEN the completeness is below 85% THEN the system SHALL use status="error" for the progress bar
5. WHEN the completeness is between 85% and 95% THEN the system SHALL use status="in-progress" for the progress bar
6. WHEN the completeness is 95% or above THEN the system SHALL use status="success" for the progress bar
