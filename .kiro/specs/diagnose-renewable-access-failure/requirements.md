# Requirements Document

## Introduction

Despite extensive testing, logging, diagnostics, and fixes to the renewable energy orchestrator flow, users are still experiencing a fundamental access failure with the error message: "There was an access issue. Please refresh the page and try again." This indicates a deeper authentication, authorization, or Lambda invocation problem that has not been addressed by the previous fixes.

The symptoms suggest that the renewable energy backend is either:
1. Not accessible due to IAM permission issues
2. Not properly deployed or configured
3. Failing authentication checks before reaching the orchestrator
4. Experiencing a fundamental GraphQL/AppSync authorization issue

## Requirements

### Requirement 1: Diagnose Authentication Flow

**User Story:** As a developer, I want to understand the complete authentication flow from the frontend to the renewable energy backend, so that I can identify where access is being denied.

#### Acceptance Criteria

1. WHEN a user sends a renewable energy query THEN the system SHALL log the authentication token being used
2. WHEN the query reaches the GraphQL layer THEN the system SHALL log the authorization mode and user identity
3. WHEN the lightweight agent is invoked THEN the system SHALL log whether the user is authenticated
4. WHEN the RenewableProxyAgent is called THEN the system SHALL verify Lambda invocation permissions
5. IF authentication fails at any step THEN the system SHALL log the specific failure point and reason

### Requirement 2: Verify Lambda Deployment Status

**User Story:** As a developer, I want to verify that all renewable energy Lambda functions are actually deployed and accessible, so that I can rule out deployment issues.

#### Acceptance Criteria

1. WHEN checking deployment status THEN the system SHALL verify the renewableOrchestrator Lambda exists
2. WHEN checking deployment status THEN the system SHALL verify all tool Lambdas (terrain, layout, simulation, report) exist
3. WHEN checking deployment status THEN the system SHALL verify the renewableAgentCoreProxy Lambda exists
4. WHEN checking deployment status THEN the system SHALL verify environment variables are set correctly
5. IF any Lambda is missing THEN the system SHALL provide specific deployment instructions

### Requirement 3: Test Direct Lambda Invocation

**User Story:** As a developer, I want to test invoking the renewable energy Lambdas directly (bypassing the UI), so that I can determine if the issue is in the frontend or backend.

#### Acceptance Criteria

1. WHEN invoking the orchestrator directly THEN the system SHALL successfully call the Lambda
2. WHEN invoking with a test payload THEN the system SHALL return a valid response
3. WHEN checking IAM permissions THEN the system SHALL verify the invoking role has lambda:InvokeFunction permission
4. IF direct invocation fails THEN the system SHALL log the specific AWS error code and message
5. WHEN direct invocation succeeds but UI fails THEN the issue is in the frontend/GraphQL layer

### Requirement 4: Verify GraphQL Schema and Resolvers

**User Story:** As a developer, I want to verify that the GraphQL schema correctly defines the renewable energy queries and that resolvers are properly configured, so that I can rule out schema issues.

#### Acceptance Criteria

1. WHEN checking the GraphQL schema THEN the system SHALL verify the invokeRenewableAgent query exists
2. WHEN checking resolvers THEN the system SHALL verify the query is connected to the correct Lambda function
3. WHEN checking authorization THEN the system SHALL verify the query allows authenticated users
4. IF the schema is misconfigured THEN the system SHALL provide the correct schema definition
5. WHEN the schema is correct THEN the issue is in the Lambda execution or permissions

### Requirement 5: Check IAM Role Permissions

**User Story:** As a developer, I want to verify that all IAM roles have the correct permissions for Lambda invocation and cross-Lambda calls, so that I can fix permission issues.

#### Acceptance Criteria

1. WHEN checking the lightweight agent role THEN it SHALL have permission to invoke the renewableOrchestrator
2. WHEN checking the orchestrator role THEN it SHALL have permission to invoke tool Lambdas
3. WHEN checking the proxy agent role THEN it SHALL have permission to invoke the AgentCore proxy
4. IF permissions are missing THEN the system SHALL provide the specific IAM policy statements needed
5. WHEN all permissions are correct THEN the issue is in the Lambda code or configuration

### Requirement 6: Verify Environment Variables

**User Story:** As a developer, I want to verify that all Lambda functions have the correct environment variables set, so that they can find and invoke each other.

#### Acceptance Criteria

1. WHEN checking the lightweight agent THEN it SHALL have RENEWABLE_ORCHESTRATOR_FUNCTION_NAME set
2. WHEN checking the orchestrator THEN it SHALL have all tool Lambda function names set
3. WHEN checking the proxy agent THEN it SHALL have AGENTCORE_PROXY_FUNCTION_NAME set
4. IF environment variables are missing THEN the system SHALL provide the correct values
5. WHEN all environment variables are set THEN the issue is in the invocation logic

### Requirement 7: Test with Minimal Payload

**User Story:** As a developer, I want to test the renewable energy backend with the simplest possible payload, so that I can isolate complex query parsing issues.

#### Acceptance Criteria

1. WHEN sending a minimal test query THEN the system SHALL successfully invoke the orchestrator
2. WHEN the orchestrator receives the test query THEN it SHALL return a simple success response
3. WHEN testing with health check payload THEN the system SHALL return orchestrator metadata
4. IF the minimal payload fails THEN the issue is in the invocation mechanism itself
5. WHEN the minimal payload succeeds but real queries fail THEN the issue is in query parsing

### Requirement 8: Implement Comprehensive Error Logging

**User Story:** As a developer, I want detailed error logging at every step of the renewable energy flow, so that I can pinpoint exactly where the "access issue" occurs.

#### Acceptance Criteria

1. WHEN an error occurs in the frontend THEN the system SHALL log the error with full stack trace
2. WHEN an error occurs in the GraphQL layer THEN the system SHALL log the AppSync error details
3. WHEN an error occurs in Lambda invocation THEN the system SHALL log the AWS SDK error
4. WHEN an error occurs in the orchestrator THEN the system SHALL log the specific failure point
5. WHEN errors are logged THEN they SHALL include request IDs for correlation across services

### Requirement 9: Create Diagnostic Script

**User Story:** As a developer, I want a single diagnostic script that tests all aspects of the renewable energy backend, so that I can quickly identify the root cause.

#### Acceptance Criteria

1. WHEN running the diagnostic script THEN it SHALL test Lambda existence
2. WHEN running the diagnostic script THEN it SHALL test IAM permissions
3. WHEN running the diagnostic script THEN it SHALL test direct Lambda invocation
4. WHEN running the diagnostic script THEN it SHALL test environment variables
5. WHEN the script completes THEN it SHALL provide a clear diagnosis and remediation steps

### Requirement 10: Provide Clear User Feedback

**User Story:** As a user, I want clear, actionable error messages when the renewable energy backend is unavailable, so that I know what to do next.

#### Acceptance Criteria

1. WHEN the backend is not deployed THEN the system SHALL display "Renewable energy features are not currently available"
2. WHEN there's a permission issue THEN the system SHALL display "Unable to access renewable energy backend - please contact support"
3. WHEN there's a timeout THEN the system SHALL display "Request timed out - please try again"
4. WHEN there's an unknown error THEN the system SHALL display the error message with a request ID
5. WHEN errors occur THEN the loading state SHALL be cleared immediately

