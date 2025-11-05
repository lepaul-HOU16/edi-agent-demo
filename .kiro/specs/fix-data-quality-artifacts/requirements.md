# Requirements Document

## Introduction

The data quality assessment functionality currently returns only text responses without visual artifacts, making it difficult for users to understand and interpret the quality metrics. This feature will add proper artifact generation to data quality assessments so users can see visual representations of completeness, outliers, and quality scores.

## Glossary

- **Petrophysics Calculator**: AWS Lambda function that performs petrophysical calculations and data quality assessments
- **Artifact**: A structured data object that the frontend can render as an interactive visualization component
- **Data Quality Assessment**: Analysis of well log data completeness, outliers, and overall quality
- **Curve**: A single measurement type in well log data (e.g., GR, RHOB, NPHI)
- **Completeness**: Percentage of valid (non-null) data points in a curve
- **Cloudscape Component**: AWS Cloudscape Design System UI component for professional data display

## Requirements

### Requirement 1: Data Quality Artifact Generation

**User Story:** As a petrophysicist, I want to see visual representations of data quality assessments, so that I can quickly identify data completeness issues and make informed decisions about which wells and curves to use in my analysis.

#### Acceptance Criteria

1. WHEN the system performs a well data quality assessment, THE Petrophysics Calculator SHALL generate an artifact with type 'data_quality_assessment'

2. WHEN the system generates a data quality artifact, THE Petrophysics Calculator SHALL include completeness percentages for all curves in the artifact data structure

3. WHEN the system generates a data quality artifact, THE Petrophysics Calculator SHALL include total points and valid points counts for each curve in the artifact data structure

4. WHEN the system generates a data quality artifact, THE Petrophysics Calculator SHALL include an overall quality score in the artifact data structure

5. WHEN the system returns a data quality assessment response, THE Petrophysics Calculator SHALL include the artifact in the 'artifacts' array field

### Requirement 2: Frontend Visualization Component

**User Story:** As a petrophysicist, I want to see data quality metrics displayed in a professional, easy-to-read format, so that I can quickly assess whether the data is suitable for analysis.

#### Acceptance Criteria

1. WHEN the frontend receives a data quality artifact, THE ChatMessage component SHALL render a CloudscapeDataQualityDisplay component

2. WHEN the CloudscapeDataQualityDisplay component renders, THE component SHALL display the well name and overall quality score prominently

3. WHEN the CloudscapeDataQualityDisplay component renders, THE component SHALL display each curve's completeness as a progress bar with percentage

4. WHEN the CloudscapeDataQualityDisplay component renders, THE component SHALL use color coding (green for >90%, yellow for 50-90%, red for <50%) to indicate quality levels

5. WHEN the CloudscapeDataQualityDisplay component renders, THE component SHALL display total points and valid points for each curve

### Requirement 3: Consistent Response Format

**User Story:** As a developer, I want all petrophysics tools to return responses in a consistent format, so that the frontend can reliably render artifacts without special case handling.

#### Acceptance Criteria

1. WHEN the system performs any petrophysics calculation, THE Petrophysics Calculator SHALL return a response with 'success', 'message', and 'artifacts' fields

2. WHEN the system performs a data quality assessment, THE Petrophysics Calculator SHALL follow the same response format as porosity, shale volume, and saturation calculations

3. WHEN the system encounters an error during data quality assessment, THE Petrophysics Calculator SHALL return a response with 'success: false' and an 'error' field

4. WHEN the system returns artifacts, THE Petrophysics Calculator SHALL ensure each artifact has a 'messageContentType' field for frontend routing

5. WHEN the system returns data quality artifacts, THE Petrophysics Calculator SHALL use 'data_quality_assessment' as the messageContentType value
