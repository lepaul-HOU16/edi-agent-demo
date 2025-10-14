# Requirements Document

## Introduction

The renewable energy terrain analysis feature is successfully generating artifacts (60 terrain features, 376.95 KB), but these artifacts are failing to save to the database due to a GraphQL validation error: "Variable 'artifacts' has an invalid value." This is a critical regression that prevents users from seeing their analysis results.

The root cause is a mismatch between how artifacts are being serialized and what the GraphQL schema expects. The schema defines `artifacts: a.json().array()` which expects an array of JSON-serialized strings, but the code is passing JavaScript objects directly.

## Requirements

### Requirement 1: Fix Artifact Serialization for GraphQL

**User Story:** As a user requesting renewable energy terrain analysis, I want my analysis results to be saved and displayed correctly, so that I can review the terrain features and exclusion zones.

#### Acceptance Criteria

1. WHEN artifacts are processed for storage THEN each artifact SHALL be serialized as a JSON string before being added to the artifacts array
2. WHEN the artifacts array is passed to GraphQL THEN it SHALL contain JSON strings, not JavaScript objects
3. WHEN artifacts are retrieved from the database THEN they SHALL be deserialized from JSON strings back to JavaScript objects
4. WHEN large artifacts are optimized THEN the optimization SHALL return a JSON string, not a JavaScript object
5. IF S3 upload fails THEN the fallback optimization SHALL produce a valid JSON string for GraphQL

### Requirement 2: Maintain Backward Compatibility

**User Story:** As a developer, I want the artifact storage fix to work with existing code, so that other features continue to function without modification.

#### Acceptance Criteria

1. WHEN existing petrophysical analysis artifacts are saved THEN they SHALL continue to work without changes
2. WHEN log plot viewer artifacts are saved THEN they SHALL continue to work without changes
3. WHEN the frontend retrieves artifacts THEN it SHALL automatically deserialize JSON strings to objects
4. WHEN artifacts are displayed in components THEN they SHALL receive JavaScript objects, not JSON strings

### Requirement 3: Preserve S3 Fallback Logic

**User Story:** As a system administrator, I want the S3 upload fallback to continue working, so that large artifacts can be stored efficiently when S3 permissions are fixed.

#### Acceptance Criteria

1. WHEN an artifact exceeds 300KB THEN the system SHALL attempt S3 upload first
2. IF S3 upload fails due to permissions THEN the system SHALL fall back to optimization
3. WHEN optimization is applied THEN the result SHALL be a valid JSON string
4. WHEN S3 permissions are fixed THEN S3 uploads SHALL resume automatically without code changes

### Requirement 4: Fix IAM Permissions for S3 Upload

**User Story:** As a system administrator, I want authenticated users to have permission to upload artifacts to S3, so that large artifacts can be stored efficiently.

#### Acceptance Criteria

1. WHEN an authenticated user uploads an artifact THEN they SHALL have s3:PutObject permission on the chatSessionArtifacts path
2. WHEN the IAM role is updated THEN it SHALL include the correct S3 bucket ARN
3. WHEN permissions are applied THEN they SHALL work for both sandbox and production environments
4. WHEN a user uploads an artifact THEN the upload SHALL succeed without AccessDenied errors

### Requirement 5: Add Comprehensive Error Handling

**User Story:** As a user, I want clear error messages when artifact storage fails, so that I understand what went wrong and what to do next.

#### Acceptance Criteria

1. WHEN artifact serialization fails THEN a clear error message SHALL be logged with the artifact type
2. WHEN GraphQL validation fails THEN the error SHALL include details about which artifact failed
3. WHEN S3 upload fails THEN the error SHALL distinguish between permission errors and other failures
4. WHEN all storage attempts fail THEN the user SHALL receive a helpful error message with next steps
