# Requirements Document: Complete CDK Migration

## Introduction

Complete the migration from Amplify to CDK by ensuring all renewable energy tool Lambdas are properly integrated with the CDK stack, updating environment variables, and shutting down the Amplify sandbox. The system currently has a hybrid backend where the CDK renewable orchestrator calls standalone renewable tool Lambdas.

## Glossary

- **CDK Stack**: AWS infrastructure defined in `cdk/lib/main-stack.ts` (EnergyInsights-development)
- **Amplify Sandbox**: Legacy Amplify Gen 2 backend (amplify-agentsforenergy-lepaul-sandbox)
- **Renewable Orchestrator**: CDK Lambda that routes renewable energy requests to tool Lambdas
- **Tool Lambdas**: Standalone Python Lambdas for terrain, layout, simulation analysis
- **Environment Variables**: Lambda configuration that specifies which tool Lambdas to invoke
- **Hybrid Backend**: Current state where CDK orchestrator calls standalone tool Lambdas

## Requirements

### Requirement 1: Configure Renewable Tool Lambda Integration

**User Story:** As a system, I want the CDK renewable orchestrator to invoke the correct tool Lambdas, so that renewable energy features work correctly.

#### Acceptance Criteria

1. WHEN the renewable orchestrator Lambda is deployed, THE System SHALL have environment variable `RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME` set to `renewable-terrain-simple`
2. WHEN the renewable orchestrator Lambda is deployed, THE System SHALL have environment variable `RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME` set to `renewable-layout-simple`
3. WHEN the renewable orchestrator Lambda is deployed, THE System SHALL have environment variable `RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME` set to `renewable-simulation-simple`
4. WHEN checking IAM permissions, THE System SHALL grant the renewable orchestrator permission to invoke all three tool Lambdas
5. WHEN the CDK stack is deployed, THE System SHALL output the renewable orchestrator function name

### Requirement 2: Test Renewable Energy Workflows

**User Story:** As a user, I want renewable energy analysis to work, so that I can design wind farms.

#### Acceptance Criteria

1. WHEN requesting terrain analysis via CDK API, THE System SHALL invoke `renewable-terrain-simple` Lambda and return results
2. WHEN requesting layout optimization via CDK API, THE System SHALL invoke `renewable-layout-simple` Lambda and return results
3. WHEN requesting wake simulation via CDK API, THE System SHALL invoke `renewable-simulation-simple` Lambda and return results
4. WHEN any renewable request fails, THE System SHALL return error messages with diagnostic information
5. WHEN checking CloudWatch logs, THE System SHALL show successful Lambda invocations

### Requirement 3: Verify Chat and Session Management

**User Story:** As a user, I want to send chat messages and manage sessions, so that I can interact with the AI assistant.

#### Acceptance Criteria

1. WHEN sending a chat message via CDK API, THE System SHALL save the message to DynamoDB and return AI response
2. WHEN creating a new chat session via CDK API, THE System SHALL create session in DynamoDB and return session ID
3. WHEN listing chat sessions via CDK API, THE System SHALL return all user sessions from DynamoDB
4. WHEN getting session messages via CDK API, THE System SHALL return all messages for the session
5. WHEN any chat operation completes, THE System SHALL function identically to Amplify implementation

### Requirement 4: Verify File Storage Operations

**User Story:** As a user, I want to upload and download files, so that I can work with data.

#### Acceptance Criteria

1. WHEN uploading a file via CDK API, THE System SHALL store file in S3 bucket and return success
2. WHEN downloading a file via CDK API, THE System SHALL retrieve file from S3 bucket and return signed URL
3. WHEN listing files via CDK API, THE System SHALL return all files from S3 bucket
4. WHEN deleting a file via CDK API, THE System SHALL remove file from S3 bucket
5. WHEN any file operation completes, THE System SHALL function identically to Amplify Storage

### Requirement 5: Update Frontend Configuration

**User Story:** As a developer, I want the frontend to use the correct API endpoint, so that all features work.

#### Acceptance Criteria

1. WHEN the frontend loads, THE System SHALL use API Gateway URL from CDK stack outputs
2. WHEN making API calls, THE System SHALL include mock auth token in Authorization header
3. WHEN API calls fail with 401, THE System SHALL display authentication error message
4. WHEN checking browser console, THE System SHALL show API calls to CDK endpoints (not Amplify)
5. WHEN the application runs, THE System SHALL have zero references to Amplify AppSync

### Requirement 6: Shut Down Amplify Sandbox

**User Story:** As a developer, I want to shut down the Amplify sandbox, so that we only run one backend.

#### Acceptance Criteria

1. WHEN all CDK features are verified working, THE System SHALL allow deletion of Amplify sandbox stack
2. WHEN Amplify sandbox is deleted, THE System SHALL continue functioning via CDK backend
3. WHEN checking AWS resources, THE System SHALL show only CDK stack resources (not Amplify)
4. WHEN checking AWS costs, THE System SHALL show reduced costs from single backend
5. WHEN the migration is complete, THE System SHALL have zero dependencies on Amplify infrastructure

### Requirement 7: Document Migration Completion

**User Story:** As a developer, I want documentation of the completed migration, so that I understand the new architecture.

#### Acceptance Criteria

1. WHEN the migration is complete, THE System SHALL have updated README with CDK deployment instructions
2. WHEN the migration is complete, THE System SHALL have architecture diagram showing CDK components
3. WHEN the migration is complete, THE System SHALL have API documentation for all REST endpoints
4. WHEN the migration is complete, THE System SHALL have troubleshooting guide for common issues
5. WHEN the migration is complete, THE System SHALL have rollback procedure documented
