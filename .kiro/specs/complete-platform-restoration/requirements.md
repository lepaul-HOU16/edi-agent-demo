# Requirements Document: Complete Platform Restoration

## Introduction

The renewable energy platform has regressed significantly with multiple incomplete fixes and broken functionality. This spec addresses ALL critical issues systematically to restore the platform to full working order. The platform was previously working well but is now completely non-functional due to accumulated regressions.

## Requirements

### Requirement 1: Restore Basic Chat Functionality

**User Story:** As a user, I want to send queries and receive responses without the UI getting stuck, so that I can use the platform.

#### Acceptance Criteria

1. WHEN a user sends a query THEN the "Analyzing your request" loading state SHALL appear
2. WHEN the backend completes processing THEN the loading state SHALL disappear and show the response
3. WHEN a response is received THEN the `responseComplete` flag SHALL be set correctly
4. IF the response fails THEN an error message SHALL be displayed (not stuck loading)
5. WHEN multiple queries are sent THEN each SHALL complete independently without blocking others

### Requirement 2: Fix Renewable Energy Orchestrator Flow

**User Story:** As a user, I want renewable energy queries to route correctly and invoke the appropriate tools, so that I get accurate results.

#### Acceptance Criteria

1. WHEN a user requests a wind farm layout THEN coordinates SHALL be extracted correctly from the query
2. WHEN coordinates are provided (e.g., "35.067482, -101.395466") THEN they SHALL be passed as `latitude` and `longitude` parameters
3. WHEN a layout tool is invoked THEN it SHALL receive all required parameters (latitude, longitude, capacity)
4. IF parameters are missing THEN a clear error message SHALL be returned
5. WHEN a terrain analysis is requested THEN it SHALL generate a unique project ID (not "default-project")

### Requirement 3: Preserve All Terrain Features (151 Features)

**User Story:** As a user, I want to see all terrain features from OpenStreetMap, so that I have complete data for site analysis.

#### Acceptance Criteria

1. WHEN terrain data is fetched from OSM THEN all features SHALL be preserved
2. WHEN optimization is applied THEN feature arrays SHALL NOT be sampled
3. WHEN coordinate arrays are large THEN only coordinate arrays SHALL be sampled (not feature arrays)
4. WHEN terrain data is stored in S3 THEN the feature count SHALL match the OSM response
5. WHEN terrain data is displayed THEN the UI SHALL show the correct feature count

### Requirement 4: Fix Lambda Deployment and Configuration

**User Story:** As a developer, I want all Lambda functions to be deployed with the latest code, so that fixes are actually applied.

#### Acceptance Criteria

1. WHEN code changes are made THEN Lambda functions SHALL be redeployed
2. WHEN Lambda functions are deployed THEN they SHALL use the latest code from the repository
3. WHEN IAM permissions are needed THEN they SHALL be configured correctly
4. WHEN environment variables are required THEN they SHALL be set properly
5. WHEN Lambda functions are invoked THEN they SHALL have access to all required AWS services

### Requirement 5: Restore Visualization Rendering

**User Story:** As a user, I want to see terrain maps and other visualizations, so that I can analyze site data visually.

#### Acceptance Criteria

1. WHEN terrain data is received THEN the terrain map SHALL render correctly
2. WHEN features are present THEN they SHALL be displayed on the map
3. IF visualization data is invalid THEN a clear error message SHALL be shown
4. WHEN artifacts are created THEN they SHALL be properly serialized for GraphQL
5. WHEN artifacts are retrieved THEN they SHALL be properly deserialized for rendering

### Requirement 6: Fix Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and can take action.

#### Acceptance Criteria

1. WHEN a Lambda function fails THEN the error SHALL be logged to CloudWatch
2. WHEN an error occurs THEN a user-friendly message SHALL be displayed in the UI
3. WHEN parameters are missing THEN the error message SHALL specify which parameters are required
4. WHEN a timeout occurs THEN the user SHALL be notified (not stuck loading)
5. WHEN debugging is needed THEN comprehensive logs SHALL be available in CloudWatch

### Requirement 7: Validate End-to-End Workflow

**User Story:** As a user, I want to complete a full renewable energy analysis workflow, so that I can make informed decisions about site selection.

#### Acceptance Criteria

1. WHEN a user requests terrain analysis THEN it SHALL complete successfully with all features
2. WHEN a user requests a wind farm layout THEN it SHALL create a layout with correct coordinates
3. WHEN a user requests a simulation THEN it SHALL run and return results
4. WHEN a user requests a report THEN it SHALL generate and be downloadable
5. WHEN multiple analyses are performed THEN each SHALL work independently without interference

## Success Metrics

- Zero "Analyzing your request" stuck states
- 100% of terrain features preserved (no sampling of feature arrays)
- All renewable energy queries complete successfully
- All Lambda functions deployed with latest code
- All visualizations render correctly
- Clear error messages for all failure scenarios

## Out of Scope

- New features or enhancements
- Performance optimization beyond fixing regressions
- UI/UX improvements beyond restoring functionality
- Additional renewable energy analysis types

## Dependencies

- AWS Lambda deployment working
- AWS Amplify Gen 2 configuration correct
- CloudWatch logging enabled
- S3 bucket access configured
- IAM permissions properly set
