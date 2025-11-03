# EDIcraft Agent Integration Fix - Requirements

## Introduction

The EDIcraft agent is currently non-functional and incorrectly routing queries to the renewable energy agent. The agent was supposed to integrate with a Python-based Bedrock AgentCore application that connects OSDU platform data to Minecraft for subsurface data visualization. The current implementation is a stub that returns preview messages instead of executing actual functionality.

## Glossary

- **EDIcraft Agent**: A specialized agent that visualizes subsurface geological data (wellbores, horizons) in Minecraft
- **OSDU Platform**: Open Subsurface Data Universe - industry standard for energy data management
- **Bedrock AgentCore**: AWS service for deploying containerized AI agents
- **RCON**: Remote Console protocol for Minecraft server administration
- **Wellbore Trajectory**: The 3D path of a drilled well through subsurface formations
- **Horizon Surface**: A geological boundary surface representing formation tops
- **MCP Server**: Model Context Protocol server for tool integration
- **Agent Router**: System component that routes user queries to appropriate specialized agents

## Requirements

### Requirement 1: Agent Router Intent Detection

**User Story:** As a user, I want my Minecraft and OSDU-related queries to be routed to the EDIcraft agent, so that I can visualize subsurface data in Minecraft.

#### Acceptance Criteria

1. WHEN a user query contains "minecraft" OR "wellbore trajectory" OR "horizon surface" OR "build wellbore" OR "osdu wellbore" OR "osdu horizon" OR "player position" OR "coordinate tracking" OR "transform coordinates" OR "utm minecraft" OR "subsurface visualization" OR "3d wellbore" OR "geological surface" OR "minecraft visualization", THE Agent Router SHALL route the query to the EDIcraft agent
2. WHEN a user query contains "well log" AND "minecraft", THE Agent Router SHALL route the query to the EDIcraft agent with priority over the petrophysics agent
3. WHEN the EDIcraft agent is explicitly selected in the session context, THE Agent Router SHALL route all queries to the EDIcraft agent regardless of content
4. WHEN the Agent Router detects an EDIcraft pattern, THE System SHALL log the pattern match for debugging purposes
5. WHEN the Agent Router routes to EDIcraft, THE System SHALL pass the complete user message without modification to the EDIcraft handler

### Requirement 2: EDIcraft Agent Functionality

**User Story:** As a user, I want the EDIcraft agent to connect to the actual Bedrock AgentCore deployment, so that my queries execute real Minecraft and OSDU operations instead of returning preview messages.

#### Acceptance Criteria

1. WHEN the EDIcraft agent receives a query, THE System SHALL invoke the deployed Bedrock AgentCore agent endpoint
2. WHEN the Bedrock AgentCore agent is not deployed, THE System SHALL return a clear error message indicating deployment is required with instructions
3. WHEN the EDIcraft agent successfully processes a query, THE System SHALL return the agent response with thought steps showing actual execution
4. WHEN the EDIcraft agent encounters an error, THE System SHALL categorize the error type (connection, authentication, OSDU, Minecraft) and return user-friendly troubleshooting guidance
5. WHEN the EDIcraft agent completes a Minecraft build operation, THE System SHALL return confirmation with Minecraft server coordinates

### Requirement 3: Bedrock AgentCore Integration

**User Story:** As a developer, I want the EDIcraft Lambda to properly invoke the Bedrock AgentCore agent, so that the Python-based agent.py functionality is accessible from the web application.

#### Acceptance Criteria

1. WHEN the EDIcraft handler is invoked, THE System SHALL use the BedrockAgentRuntimeClient to invoke the agent
2. WHEN invoking the agent, THE System SHALL pass the agent ID from environment variables
3. WHEN invoking the agent, THE System SHALL create a unique session ID for each conversation
4. WHEN the agent returns a response, THE System SHALL parse the response stream and extract the message content
5. WHEN the agent invocation fails, THE System SHALL capture the error details and return them in a structured format

### Requirement 4: Environment Configuration

**User Story:** As a developer, I want all required environment variables properly configured, so that the EDIcraft agent can connect to Minecraft servers and OSDU platforms.

#### Acceptance Criteria

1. THE System SHALL require the following environment variables: BEDROCK_AGENT_ID, BEDROCK_AGENT_ALIAS_ID, MINECRAFT_HOST, MINECRAFT_PORT, MINECRAFT_RCON_PASSWORD, EDI_USERNAME, EDI_PASSWORD, EDI_CLIENT_ID, EDI_CLIENT_SECRET, EDI_PARTITION, EDI_PLATFORM_URL
2. WHEN any required environment variable is missing, THE System SHALL return an error message indicating which variable is missing
3. WHEN environment variables are configured, THE System SHALL validate the Bedrock agent ID format before attempting invocation
4. WHEN the Minecraft server connection fails, THE System SHALL provide troubleshooting steps including server status check, RCON configuration, and firewall rules
5. WHEN OSDU authentication fails, THE System SHALL provide troubleshooting steps including credential verification and platform accessibility

### Requirement 5: Response Format Compatibility

**User Story:** As a user, I want EDIcraft agent responses to display properly in the chat interface, so that I can see the results of my Minecraft and OSDU operations.

#### Acceptance Criteria

1. WHEN the EDIcraft agent returns a response, THE System SHALL format it with success status, message content, and thought steps
2. WHEN the agent builds structures in Minecraft, THE System SHALL return no visual artifacts (visualization occurs in Minecraft, not the web UI)
3. WHEN the agent provides thought steps, THE System SHALL include step ID, type, timestamp, title, summary, and status for each step
4. WHEN the agent encounters an error, THE System SHALL include the error message and connection status in the response
5. WHEN the agent completes successfully, THE System SHALL set connectionStatus to "connected" or "completed"

### Requirement 6: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for the EDIcraft agent integration, so that I can verify functionality before deployment.

#### Acceptance Criteria

1. THE System SHALL provide a test script that validates agent routing for EDIcraft-specific queries
2. THE System SHALL provide a test script that validates Bedrock AgentCore invocation with mock responses
3. THE System SHALL provide a test script that validates environment variable configuration
4. THE System SHALL provide a test script that validates error handling for connection failures
5. THE System SHALL provide a test script that validates response format compatibility with the chat interface

### Requirement 7: Documentation and Deployment

**User Story:** As a developer, I want clear documentation on deploying the EDIcraft agent, so that I can set up the complete integration.

#### Acceptance Criteria

1. THE System SHALL provide documentation on deploying the Bedrock AgentCore agent from the EDIcraft-main repository
2. THE System SHALL provide documentation on configuring environment variables in the Lambda function
3. THE System SHALL provide documentation on testing the agent integration end-to-end
4. THE System SHALL provide documentation on troubleshooting common issues (connection failures, authentication errors, OSDU access)
5. THE System SHALL provide documentation on the complete user workflow from query to Minecraft visualization
