# Requirements Document

## Introduction

The deployed production frontend is failing to connect to the backend API because it's configured with an incorrect API Gateway URL. The error shows `ERR_NAME_NOT_RESOLVED` when trying to reach `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`, but the correct URL is `https://t4begsixg2.execute-api.us-east-1.amazonaws.com`. This issue stems from the GitHub Actions workflow using a hardcoded secret that contains an outdated URL.

## Glossary

- **API Gateway**: AWS service that provides REST API endpoints for backend Lambda functions
- **CloudFormation Stack**: AWS infrastructure defined as code that outputs the actual API Gateway URL
- **GitHub Secret**: Encrypted environment variable stored in GitHub repository settings
- **VITE_API_URL**: Environment variable used by Vite during build to configure the API base URL
- **CI/CD Pipeline**: GitHub Actions workflow that builds and deploys the application

## Requirements

### Requirement 1

**User Story:** As a developer, I want the CI/CD pipeline to automatically use the correct API URL from CloudFormation outputs, so that the deployed frontend always connects to the right backend.

#### Acceptance Criteria

1. WHEN the GitHub Actions workflow builds the frontend, THE system SHALL fetch the API Gateway URL from CloudFormation stack outputs
2. WHEN the API Gateway URL is retrieved from CloudFormation, THE system SHALL pass it to the Vite build process as VITE_API_URL
3. WHEN the CloudFormation stack output is unavailable, THE system SHALL use the hardcoded default URL from the code as fallback
4. WHEN the frontend build completes, THE system SHALL log the API URL being used for verification

### Requirement 2

**User Story:** As a developer, I want clear documentation of the API URL configuration, so that I can troubleshoot connection issues quickly.

#### Acceptance Criteria

1. WHEN reviewing the deployment workflow, THE system SHALL include comments explaining how the API URL is determined
2. WHEN the deployment completes, THE system SHALL output the API URL being used in the deployment summary
3. WHEN troubleshooting connection issues, THE documentation SHALL provide steps to verify the correct API URL

### Requirement 3

**User Story:** As a developer, I want the localhost development environment to work correctly, so that I can test changes before deployment.

#### Acceptance Criteria

1. WHEN running the application locally with `npm run dev`, THE system SHALL use the proxy configuration to route API requests
2. WHEN the VITE_API_URL environment variable is not set locally, THE system SHALL use the hardcoded default URL
3. WHEN making API requests from localhost, THE system SHALL successfully connect to the deployed backend
