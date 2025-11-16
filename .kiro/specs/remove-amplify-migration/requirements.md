# Requirements: Remove Amplify Migration

## Introduction

This document outlines the requirements for migrating away from AWS Amplify Gen 2 to a pure CDK + Next.js architecture, eliminating Amplify-specific limitations and deployment issues.

## Glossary

- **CDK**: AWS Cloud Development Kit - Infrastructure as Code framework
- **Next.js**: React framework for production web applications
- **API Gateway**: AWS service for creating REST/HTTP APIs
- **Lambda**: AWS serverless compute service
- **Cognito**: AWS authentication service
- **AppSync**: AWS GraphQL service (to be replaced)
- **S3**: AWS object storage service
- **DynamoDB**: AWS NoSQL database service

## Requirements

### Requirement 1: Replace Amplify Backend with Pure CDK

**User Story:** As a developer, I want infrastructure defined in pure CDK without Amplify abstractions, so that I have full control and avoid Amplify-specific bugs.

#### Acceptance Criteria

1. WHEN infrastructure is deployed, THE System SHALL use AWS CDK directly without Amplify Gen 2 wrappers
2. WHEN Lambda functions are defined, THE System SHALL use standard CDK Lambda constructs
3. WHEN APIs are created, THE System SHALL use API Gateway HTTP API or REST API instead of AppSync
4. WHEN authentication is configured, THE System SHALL use Cognito directly via CDK
5. WHEN storage is configured, THE System SHALL use S3 buckets via CDK

### Requirement 2: Replace AppSync GraphQL with REST API

**User Story:** As a developer, I want a simple REST API instead of GraphQL, so that I avoid AppSync resolver issues and have simpler debugging.

#### Acceptance Criteria

1. WHEN the frontend calls the backend, THE System SHALL use REST endpoints via API Gateway
2. WHEN mutations are called, THE System SHALL use POST requests to Lambda functions
3. WHEN queries are called, THE System SHALL use GET requests to Lambda functions
4. WHEN authentication is required, THE System SHALL use Cognito JWT tokens in Authorization headers
5. WHEN errors occur, THE System SHALL return standard HTTP status codes

### Requirement 3: Simplify Frontend API Client

**User Story:** As a developer, I want a simple fetch-based API client instead of Amplify's GraphQL client, so that API calls are straightforward and debuggable.

#### Acceptance Criteria

1. WHEN the frontend makes API calls, THE System SHALL use native fetch or axios
2. WHEN authentication is needed, THE System SHALL attach Cognito JWT tokens to requests
3. WHEN responses are received, THE System SHALL parse standard JSON responses
4. WHEN errors occur, THE System SHALL handle HTTP error codes directly
5. WHEN real-time updates are needed, THE System SHALL use WebSockets or polling

### Requirement 4: Keep Next.js for Frontend

**User Story:** As a developer, I want to keep Next.js for the frontend, so that we maintain SSR, routing, and React capabilities without rewriting the UI.

#### Acceptance Criteria

1. WHEN the application runs, THE System SHALL use Next.js 14 with App Router
2. WHEN pages are rendered, THE System SHALL support both SSR and client-side rendering
3. WHEN routes are defined, THE System SHALL use Next.js file-based routing
4. WHEN static assets are served, THE System SHALL use Next.js public directory
5. WHEN the app is built, THE System SHALL generate optimized production bundles

### Requirement 5: Deploy Frontend to S3 + CloudFront

**User Story:** As a developer, I want the Next.js app deployed to S3 with CloudFront, so that we have fast global delivery without Amplify Hosting.

#### Acceptance Criteria

1. WHEN the frontend is built, THE System SHALL export static files via `next export` or standalone mode
2. WHEN files are deployed, THE System SHALL upload to S3 bucket
3. WHEN users access the app, THE System SHALL serve via CloudFront CDN
4. WHEN API calls are made, THE System SHALL route through CloudFront to API Gateway
5. WHEN cache is needed, THE System SHALL use CloudFront caching policies

### Requirement 6: Maintain Authentication with Cognito

**User Story:** As a user, I want to continue using my existing login credentials, so that migration is seamless.

#### Acceptance Criteria

1. WHEN users log in, THE System SHALL authenticate via existing Cognito User Pool
2. WHEN tokens are issued, THE System SHALL use Cognito JWT tokens
3. WHEN tokens expire, THE System SHALL refresh using Cognito refresh tokens
4. WHEN users sign up, THE System SHALL create accounts in Cognito
5. WHEN password reset is needed, THE System SHALL use Cognito forgot password flow

### Requirement 7: Preserve All Lambda Functions

**User Story:** As a developer, I want to keep all existing Lambda functions, so that business logic remains unchanged.

#### Acceptance Criteria

1. WHEN Lambda functions are deployed, THE System SHALL use the same handler code
2. WHEN functions are invoked, THE System SHALL maintain the same input/output contracts
3. WHEN permissions are needed, THE System SHALL grant IAM roles via CDK
4. WHEN environment variables are set, THE System SHALL configure them via CDK
5. WHEN layers are needed, THE System SHALL attach Lambda layers via CDK

### Requirement 8: Maintain DynamoDB Tables

**User Story:** As a developer, I want to keep existing DynamoDB tables and data, so that no data is lost during migration.

#### Acceptance Criteria

1. WHEN tables are defined, THE System SHALL use existing table names and schemas
2. WHEN data is accessed, THE System SHALL use the same partition/sort keys
3. WHEN indexes are needed, THE System SHALL maintain existing GSIs
4. WHEN permissions are granted, THE System SHALL use IAM policies via CDK
5. WHEN data is migrated, THE System SHALL preserve all existing records

### Requirement 9: Simplify Deployment Process

**User Story:** As a developer, I want a simple deployment command, so that deployments are fast and reliable.

#### Acceptance Criteria

1. WHEN infrastructure is deployed, THE System SHALL use `cdk deploy` command
2. WHEN frontend is deployed, THE System SHALL use a single script to build and upload
3. WHEN changes are made, THE System SHALL detect and deploy only changed resources
4. WHEN rollback is needed, THE System SHALL support CloudFormation rollback
5. WHEN deployment status is checked, THE System SHALL show clear progress and errors

### Requirement 10: Improve Development Experience

**User Story:** As a developer, I want fast local development, so that I can iterate quickly without waiting for deployments.

#### Acceptance Criteria

1. WHEN developing locally, THE System SHALL run Next.js dev server with hot reload
2. WHEN testing Lambda functions, THE System SHALL support local invocation
3. WHEN debugging, THE System SHALL provide clear error messages and stack traces
4. WHEN code changes, THE System SHALL reflect changes immediately in dev mode
5. WHEN environment variables change, THE System SHALL reload without full restart
