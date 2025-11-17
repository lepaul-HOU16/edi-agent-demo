# Requirements Document

## Introduction

The system currently uses mock authentication tokens for development, which causes authentication failures and inconsistent behavior. This feature will disable mock authentication and ensure all API requests use real Cognito JWT tokens from the existing user pool.

## Glossary

- **Cognito User Pool**: AWS managed user directory (ID: us-east-1_sC6yswGji)
- **JWT Token**: JSON Web Token issued by Cognito for authenticated users
- **Mock Auth**: Development-only authentication bypass using fake tokens
- **Lambda Authorizer**: Custom Lambda function that validates JWT tokens
- **Frontend Auth Provider**: Client-side service managing authentication state

## Requirements

### Requirement 1: Disable Mock Authentication

**User Story:** As a system administrator, I want to disable mock authentication so that all API requests use real Cognito tokens

#### Acceptance Criteria

1. WHEN deploying the CDK stack, THE System SHALL set ENABLE_MOCK_AUTH environment variable to 'false'
2. WHEN the Lambda authorizer receives a mock token, THE System SHALL reject it with 401 Unauthorized
3. WHEN the frontend attempts to use mock tokens, THE System SHALL require real Cognito authentication instead
4. WHERE mock authentication is disabled, THE System SHALL log authentication failures with clear error messages

### Requirement 2: Enforce Cognito Authentication

**User Story:** As a user, I want to authenticate with my Cognito credentials so that I can securely access the application

#### Acceptance Criteria

1. WHEN a user is not authenticated, THE Frontend SHALL redirect to the sign-in page
2. WHEN a user signs in with valid credentials, THE System SHALL store the Cognito session
3. WHEN making API requests, THE Frontend SHALL include the Cognito JWT token in the Authorization header
4. IF the Cognito session expires, THEN THE Frontend SHALL prompt the user to sign in again
5. WHEN a user signs out, THE System SHALL clear the Cognito session and redirect to sign-in

### Requirement 3: Update Lambda Authorizer

**User Story:** As a backend service, I want to validate only real Cognito JWT tokens so that unauthorized requests are rejected

#### Acceptance Criteria

1. WHEN the authorizer receives a request, THE System SHALL extract the JWT token from the Authorization header
2. WHEN validating the token, THE System SHALL verify it against the Cognito user pool (us-east-1_sC6yswGji)
3. IF the token is valid, THEN THE System SHALL allow the request and pass user context to the Lambda
4. IF the token is invalid or expired, THEN THE System SHALL return 401 Unauthorized
5. WHEN validation fails, THE System SHALL log the failure reason to CloudWatch

### Requirement 4: Remove Mock Auth Fallbacks

**User Story:** As a developer, I want to remove all mock authentication fallbacks so that authentication issues are caught early

#### Acceptance Criteria

1. WHEN the frontend auth provider fails to get a Cognito token, THE System SHALL throw an error instead of using mock tokens
2. WHEN the isAuthenticated check fails, THE System SHALL return false instead of assuming authenticated
3. WHEN getUserInfo fails, THE System SHALL throw an error instead of returning mock user data
4. WHERE mock auth code exists, THE System SHALL remove or disable it

### Requirement 5: Update Environment Configuration

**User Story:** As a DevOps engineer, I want to configure authentication settings via environment variables so that I can control auth behavior per environment

#### Acceptance Criteria

1. WHEN deploying to development, THE System SHALL set ENABLE_MOCK_AUTH to 'false'
2. WHEN deploying to staging, THE System SHALL set ENABLE_MOCK_AUTH to 'false'
3. WHEN deploying to production, THE System SHALL set ENABLE_MOCK_AUTH to 'false'
4. WHERE environment variables are set, THE System SHALL validate they are correctly applied to all Lambdas

### Requirement 6: Add Sign-In UI

**User Story:** As a user, I want a sign-in page so that I can authenticate with my Cognito credentials

#### Acceptance Criteria

1. WHEN accessing the application without authentication, THE Frontend SHALL display a sign-in page
2. WHEN entering username and password, THE System SHALL authenticate against Cognito
3. IF authentication succeeds, THEN THE Frontend SHALL redirect to the main application
4. IF authentication fails, THEN THE Frontend SHALL display an error message
5. WHEN clicking "Sign Out", THE System SHALL clear the session and return to sign-in

### Requirement 7: Test Authentication Flow

**User Story:** As a QA engineer, I want to test the complete authentication flow so that I can verify it works correctly

#### Acceptance Criteria

1. WHEN testing with valid Cognito credentials, THE System SHALL allow access to all API endpoints
2. WHEN testing without authentication, THE System SHALL reject requests with 401 Unauthorized
3. WHEN testing with expired tokens, THE System SHALL reject requests and prompt for re-authentication
4. WHEN testing sign-out, THE System SHALL clear all authentication state
5. WHEN checking CloudWatch logs, THE System SHALL show successful JWT validation for authenticated requests
