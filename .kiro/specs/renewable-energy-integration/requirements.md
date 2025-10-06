# Requirements Document - Renewable Energy Integration

## Introduction

This document outlines the requirements for integrating the AWS renewable energy demo (`agentic-ai-for-renewable-site-design-mainline`) into the EDI Platform. The integration must use the original demo files EXACTLY as-is with ZERO modifications to the renewable demo code. We will only create external integration layers to connect the demo's backend to our existing EDI Platform UI and Cognito user pool.

## Requirements

### Requirement 1: Zero Modifications to Original Demo Code

**User Story:** As a developer, I want to use the renewable demo code exactly as-is so that we avoid breaking their proven implementation and can easily update when they release new versions.

#### Acceptance Criteria

1. WHEN integrating renewable energy capabilities THEN ZERO files in `agentic-ai-for-renewable-site-design-mainline/` SHALL be modified
2. WHEN the system needs agent functionality THEN it SHALL use the original demo's agent files without changes
3. WHEN integration code is needed THEN it SHALL be created OUTSIDE the `agentic-ai-for-renewable-site-design-mainline/` directory
4. WHEN the demo is updated THEN we SHALL be able to pull updates without merge conflicts
5. WHEN deployment is needed THEN we SHALL follow the demo's original deployment instructions

### Requirement 2: Deploy Original Demo Backend with EDI Cognito

**User Story:** As a system architect, I want to deploy the renewable demo's backend using our existing Cognito user pool so that users have a unified authentication experience.

#### Acceptance Criteria

1. WHEN deploying the renewable backend THEN the `deploy-to-agentcore.sh` script SHALL be used
2. WHEN configuring authentication THEN it SHALL be connected to the EDI Platform's existing Cognito user pool
3. WHEN the backend is deployed THEN it SHALL use AWS Bedrock AgentCore runtime as specified in the demo
4. WHEN agents are invoked THEN they SHALL use the demo's original Strands multi-agent orchestration with GraphBuilder
5. WHEN the MCP server is deployed THEN it SHALL use the demo's `wind_farm_mcp_server.py` without modifications
6. WHEN the backend is accessible THEN it SHALL provide an AgentCore invoke endpoint that the EDI Platform can call
7. WHEN deployment completes THEN the AgentCore endpoint URL SHALL be documented for frontend integration

### Requirement 3: Remove Incorrectly Converted TypeScript Code

**User Story:** As a developer, I want to remove the incorrectly converted TypeScript implementations so that we use the original Python agents instead.

#### Acceptance Criteria

1. WHEN cleaning up incorrect code THEN `amplify/functions/agents/renewableEnergyAgent.ts` SHALL be removed or refactored to be a thin proxy
2. WHEN cleaning up incorrect code THEN `amplify/functions/tools/renewableTerrainAnalysisTool.ts` SHALL be removed
3. WHEN cleaning up incorrect code THEN `amplify/functions/tools/renewableLayoutOptimizationTool.ts` SHALL be removed
4. WHEN cleaning up incorrect code THEN `amplify/functions/tools/renewableSimulationTool.ts` SHALL be removed
5. WHEN replacement code is created THEN it SHALL only contain HTTP client calls to the deployed renewable backend

### Requirement 4: Lightweight Frontend Integration Layer

**User Story:** As a frontend developer, I want a minimal integration layer that connects the EDI Platform chat UI to the renewable backend so that users can interact with renewable agents through our existing interface.

#### Acceptance Criteria

1. WHEN creating integration code THEN it SHALL be placed in a new directory outside the demo code (e.g., `src/services/renewable-integration/`)
2. WHEN a user sends a renewable query THEN the integration layer SHALL forward it to the deployed renewable backend
3. WHEN the backend responds THEN the integration layer SHALL transform responses to EDI Platform artifact format
4. WHEN streaming is supported THEN the integration layer SHALL handle SSE streams from the backend
5. WHEN errors occur THEN they SHALL be caught and displayed in the chat interface

### Requirement 5: Use Original Demo Visualizations

**User Story:** As a user, I want to see the same high-quality visualizations from the renewable demo so that I get the proven, tested visualization experience.

#### Acceptance Criteria

1. WHEN terrain analysis completes THEN Folium interactive maps SHALL be displayed (from `visualization_utils.py`)
2. WHEN layout design completes THEN the same Folium turbine layout maps SHALL be used
3. WHEN simulation completes THEN matplotlib charts from the demo SHALL be displayed
4. WHEN maps are rendered THEN they SHALL include USGS Topo, USGS Satellite, and Esri satellite tile layers
5. WHEN visualizations are needed THEN the demo's `visualization_utils.py` functions SHALL be called directly
6. WHEN artifacts are returned THEN they SHALL include the HTML/image outputs from the demo's visualization functions

### Requirement 6: Agent Router Integration

**User Story:** As a user, I want renewable energy queries to be automatically routed to the renewable backend so that I can seamlessly switch between petrophysical and renewable analysis.

#### Acceptance Criteria

1. WHEN a user types a renewable query THEN the agent router SHALL detect it and route to the renewable integration layer
2. WHEN routing to renewable THEN the query SHALL be forwarded to the deployed renewable backend
3. WHEN the renewable backend responds THEN results SHALL be displayed in the chat interface
4. WHEN a user switches back to petrophysical queries THEN the router SHALL route to existing petrophysical agents
5. WHEN routing logic is updated THEN it SHALL not break existing petrophysical routing

### Requirement 7: Configuration Management

**User Story:** As a DevOps engineer, I want clear configuration for connecting to the renewable backend so that deployment and environment management is straightforward.

#### Acceptance Criteria

1. WHEN the renewable backend is deployed THEN its AgentCore endpoint URL SHALL be stored in environment variables
2. WHEN authentication is needed THEN Cognito credentials SHALL be used for backend access
3. WHEN storage is configured THEN S3 SHALL be used (via SSM parameters as per demo's README)
4. WHEN the demo stores artifacts THEN they SHALL be stored in the configured S3 bucket
5. WHEN configuration changes THEN the frontend SHALL not require code changes
6. WHEN multiple environments exist THEN each SHALL have its own renewable backend configuration
7. WHEN configuration is documented THEN it SHALL include all required environment variables and SSM parameters

### Requirement 8: Deploy Under EDI Account Credentials

**User Story:** As a DevOps engineer, I want to deploy the renewable backend under the EDI Platform's AWS account so that all resources are managed together and use the same authentication.

#### Acceptance Criteria

1. WHEN deploying the renewable backend THEN it SHALL be deployed to the same AWS account as the EDI Platform
2. WHEN deploying to AgentCore THEN it SHALL use the EDI Platform's AWS credentials and region
3. WHEN configuring Bedrock THEN it SHALL use the same Bedrock model access as the EDI Platform
4. WHEN setting up infrastructure THEN resources SHALL be tagged with EDI Platform identifiers
5. WHEN the demo's `deploy-to-agentcore.sh` script is run THEN it SHALL deploy under the EDI account
6. WHEN S3 storage is configured THEN it SHALL use the EDI Platform's S3 bucket or a new bucket in the same account
7. WHEN Cognito is configured THEN it SHALL use the EDI Platform's existing Cognito user pool
8. WHEN deployment completes THEN the AgentCore endpoint SHALL be accessible from the EDI Platform's VPC/network

### Requirement 9: Minimal Code Changes

**User Story:** As a developer, I want to make the absolute minimum code changes necessary so that we reduce risk and maintain simplicity.

#### Acceptance Criteria

1. WHEN integration code is created THEN it SHALL be isolated in new files, not modifying existing files
2. WHEN the agent router is updated THEN changes SHALL be minimal (add renewable pattern detection only)
3. WHEN UI components are added THEN they SHALL be new components, not modifications to existing ones
4. WHEN artifact types are added THEN they SHALL extend the existing artifact system without breaking it
5. WHEN the integration is complete THEN the diff SHALL show only new files and minimal changes to existing files

### Requirement 10: Documentation and Testing

**User Story:** As a developer, I want clear documentation on how the integration works so that I can maintain and extend it.

#### Acceptance Criteria

1. WHEN the integration is complete THEN a README SHALL document the architecture
2. WHEN deployment is needed THEN step-by-step instructions SHALL be provided
3. WHEN testing is needed THEN example queries SHALL be documented
4. WHEN troubleshooting THEN common issues and solutions SHALL be documented
5. WHEN the renewable backend is updated THEN the process for pulling updates SHALL be documented

## Success Criteria

The integration will be considered successful when:

1. ZERO files in `agentic-ai-for-renewable-site-design-mainline/` have been modified
2. The renewable demo backend is deployed using original instructions with EDI Cognito
3. Incorrectly converted TypeScript files have been removed
4. A lightweight integration layer connects the EDI UI to the renewable backend
5. Users can type renewable queries in the chat and see results
6. Renewable artifacts (maps, charts, reports) display correctly in the UI
7. All existing EDI Platform features continue to work without regression
8. The agent router properly detects and routes renewable queries
9. Configuration is documented and environment-specific
10. The integration uses the absolute minimum code changes necessary
