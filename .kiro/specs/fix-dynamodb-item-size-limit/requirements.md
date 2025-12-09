# Requirements Document

## Introduction

The petrophysics porosity analysis tool is failing with "Item size has exceeded the maximum allowed size" errors when storing results in DynamoDB. This occurs because the tool returns large log curve data arrays (DEPT, RHOB, NPHI, PHID, PHIN, PHIE, GR) that exceed DynamoDB's 400KB item size limit.

## Glossary

- **DynamoDB**: AWS NoSQL database service with 400KB item size limit
- **Log Curve Data**: Arrays of numerical measurements from well logs (depth, density, neutron, porosity, gamma ray)
- **S3**: AWS object storage service for large data files
- **Artifact**: Structured response object containing analysis results and visualizations
- **Session**: User conversation stored in DynamoDB with messages and artifacts

## Requirements

### Requirement 1

**User Story:** As a petrophysicist, I want to analyze wells with large datasets without encountering storage errors, so that I can view comprehensive porosity analysis results.

#### Acceptance Criteria

1. WHEN the porosity analysis tool generates log curve data THEN the system SHALL store the data in S3 instead of DynamoDB
2. WHEN log curve data is stored in S3 THEN the system SHALL return an S3 reference in the artifact
3. WHEN the frontend receives an artifact with S3 references THEN the system SHALL fetch the log data from S3 for visualization
4. WHEN storing log data in S3 THEN the system SHALL use a consistent naming convention with sessionId and wellName
5. WHEN log data is stored in S3 THEN the system SHALL include metadata about the S3 location in the artifact

### Requirement 2

**User Story:** As a developer, I want artifacts to stay under DynamoDB's size limit, so that the system remains reliable and scalable.

#### Acceptance Criteria

1. WHEN an artifact is created THEN the system SHALL separate large data arrays from metadata
2. WHEN large data is detected THEN the system SHALL store it in S3 and replace with S3 reference
3. WHEN the artifact is stored in DynamoDB THEN the system SHALL validate it is under 400KB
4. WHEN multiple wells are analyzed THEN the system SHALL store each well's log data separately in S3
5. WHEN S3 storage fails THEN the system SHALL return a clear error message without crashing

### Requirement 3

**User Story:** As a user, I want the porosity visualization to load quickly and display correctly, so that I can analyze well data efficiently.

#### Acceptance Criteria

1. WHEN the frontend renders a porosity artifact THEN the system SHALL detect S3 references in logData
2. WHEN S3 references are detected THEN the system SHALL fetch the data from S3 asynchronously
3. WHEN S3 data is loading THEN the system SHALL display a loading indicator
4. WHEN S3 data fetch fails THEN the system SHALL display a clear error message
5. WHEN S3 data is fetched THEN the system SHALL cache it to avoid redundant requests

### Requirement 4

**User Story:** As a system administrator, I want S3 storage to be organized and maintainable, so that data can be easily managed and cleaned up.

#### Acceptance Criteria

1. WHEN log data is stored in S3 THEN the system SHALL use a hierarchical path structure
2. WHEN storing log data THEN the system SHALL include sessionId in the S3 key for traceability
3. WHEN storing log data THEN the system SHALL include wellName in the S3 key for identification
4. WHEN storing log data THEN the system SHALL use JSON format for easy inspection
5. WHEN storing log data THEN the system SHALL set appropriate S3 lifecycle policies for cleanup
