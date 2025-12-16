# Requirements Document

## Introduction

The porosity analysis tool repeatedly fails with "Artifact size exceeds DynamoDB limit of 400KB" errors. This happens because the tool embeds full log curve data (DEPT, RHOB, NPHI, PHID, PHIN, PHIE, GR) for multiple wells directly in the artifact, causing it to exceed DynamoDB's 400KB item size limit. While S3 storage infrastructure exists, the tool doesn't consistently use it, leading to recurring failures.

## Glossary

- **Artifact**: A structured data object containing analysis results that is stored in DynamoDB and displayed in the UI
- **DynamoDB**: AWS database service with a 400KB item size limit
- **S3**: AWS object storage service for large files
- **Log Data**: Time-series well log measurements (depth, density, neutron porosity, etc.)
- **sessionId**: Chat session identifier used to organize S3 storage
- **Porosity Tool**: The comprehensive_porosity_analysis MCP tool that performs density-neutron porosity analysis

## Requirements

### Requirement 1

**User Story:** As a petrophysicist, I want porosity analysis to work reliably for multiple wells, so that I can analyze field-wide porosity without encountering size limit errors.

#### Acceptance Criteria

1. WHEN analyzing multiple wells THEN the system SHALL store log data in S3 instead of embedding it in the artifact
2. WHEN sessionId is provided THEN the system SHALL use it to organize S3 storage with hierarchical keys
3. WHEN S3 storage succeeds THEN the artifact SHALL contain only an S3 reference (bucket, key, region, size) instead of embedded log data
4. WHEN S3 storage fails THEN the system SHALL fall back to embedded log data and log a warning
5. WHEN no sessionId is provided THEN the system SHALL embed log data in the artifact for backward compatibility

### Requirement 2

**User Story:** As a system administrator, I want the porosity tool to enforce hard limits on well count, so that artifacts never exceed DynamoDB size limits regardless of configuration.

#### Acceptance Criteria

1. WHEN the tool receives a request for more than 2 wells THEN the system SHALL automatically limit analysis to 2 wells maximum
2. WHEN the well limit is enforced THEN the system SHALL log a warning with the original and limited well lists
3. WHEN generating artifacts THEN the system SHALL validate artifact size before returning
4. WHEN artifact size exceeds 400KB THEN the system SHALL throw an error with actionable guidance
5. WHEN artifact size exceeds 350KB THEN the system SHALL log a warning that the artifact is approaching the limit

### Requirement 3

**User Story:** As a developer, I want the artifact generation logic to consistently check for S3 references, so that log data is never accidentally embedded when S3 storage was used.

#### Acceptance Criteria

1. WHEN generating single-well artifacts THEN the system SHALL check if logDataS3 exists before including logData
2. WHEN generating multi-well artifacts THEN the system SHALL check each well's logDataS3 before including logData
3. WHEN generating field overview artifacts THEN the system SHALL check each well's logDataS3 before including logData
4. WHEN logDataS3 exists THEN the artifact SHALL include only the S3 reference and NOT the embedded log data
5. WHEN logDataS3 does not exist THEN the artifact SHALL include embedded log data for backward compatibility

### Requirement 4

**User Story:** As a petrophysicist, I want the frontend to seamlessly fetch log data from S3 when needed, so that I see the same visualizations regardless of storage location.

#### Acceptance Criteria

1. WHEN the frontend receives an artifact with logDataS3 THEN the system SHALL fetch log data from S3 using the provided reference
2. WHEN the frontend receives an artifact with embedded logData THEN the system SHALL use it directly without fetching from S3
3. WHEN S3 fetch succeeds THEN the system SHALL display visualizations using the fetched data
4. WHEN S3 fetch fails THEN the system SHALL display an error message with retry option
5. WHEN displaying visualizations THEN the user SHALL see identical results regardless of whether data came from S3 or was embedded

### Requirement 5

**User Story:** As a system operator, I want clear error messages when artifacts exceed size limits, so that I can quickly diagnose and resolve issues.

#### Acceptance Criteria

1. WHEN artifact size exceeds 400KB THEN the error message SHALL include the actual size in KB
2. WHEN artifact size exceeds 400KB THEN the error message SHALL include the number of wells analyzed
3. WHEN artifact size exceeds 400KB THEN the error message SHALL include the number of wells with embedded data
4. WHEN artifact size exceeds 400KB THEN the error message SHALL suggest reducing well count or depth range
5. WHEN artifact size exceeds 400KB THEN the error message SHALL suggest ensuring sessionId is provided for S3 storage
