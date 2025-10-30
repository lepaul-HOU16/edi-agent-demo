# EDIcraft Horizon Query Routing Fix - Requirements

## Introduction

The EDIcraft agent is failing to process horizon-related queries. When a user asks "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft", the system returns a generic petrophysical welcome message instead of routing to the EDIcraft agent and processing the horizon visualization request.

## Glossary

- **EDIcraft Agent**: A specialized agent that visualizes subsurface geological data (wellbores, horizons) in Minecraft
- **Horizon**: A geological boundary surface representing formation tops in subsurface data
- **Agent Router**: System component that routes user queries to appropriate specialized agents based on intent detection
- **Intent Detection**: Pattern matching logic that determines which agent should handle a query
- **Minecraft Coordinates**: 3D coordinate system used in Minecraft for positioning blocks and structures

## Requirements

### Requirement 1: Horizon Query Intent Detection

**User Story:** As a user, I want my horizon-related queries to be routed to the EDIcraft agent, so that I can visualize horizon surfaces in Minecraft.

#### Acceptance Criteria

1. WHEN a user query contains "horizon" AND ("minecraft" OR "coordinates" OR "convert" OR "show" OR "visualize" OR "build" OR "find"), THE Agent Router SHALL route the query to the EDIcraft agent
2. WHEN a user query contains "find.*horizon" OR "horizon.*name" OR "horizon.*coordinates", THE Agent Router SHALL route the query to the EDIcraft agent
3. WHEN a user query contains "convert.*coordinates.*minecraft" OR "minecraft.*coordinates", THE Agent Router SHALL route the query to the EDIcraft agent
4. WHEN the Agent Router detects a horizon pattern, THE System SHALL log the pattern match with the specific regex that matched
5. WHEN the Agent Router routes to EDIcraft for a horizon query, THE System SHALL pass the complete user message without modification

### Requirement 2: EDIcraft Agent Horizon Processing

**User Story:** As a user, I want the EDIcraft agent to process horizon queries and return Minecraft coordinates, so that I can build horizon surfaces in Minecraft.

#### Acceptance Criteria

1. WHEN the EDIcraft agent receives a horizon query, THE System SHALL invoke the Bedrock AgentCore agent with the query
2. WHEN the agent processes a horizon query, THE System SHALL extract horizon data from OSDU or local sources
3. WHEN the agent converts coordinates, THE System SHALL transform UTM coordinates to Minecraft coordinate system
4. WHEN the agent completes processing, THE System SHALL return the horizon name and Minecraft coordinates in the response
5. WHEN the agent encounters an error, THE System SHALL return a user-friendly error message with troubleshooting steps

### Requirement 3: Response Format for Horizon Queries

**User Story:** As a user, I want horizon query responses to include the horizon name and Minecraft coordinates, so that I know what was found and where to see it.

#### Acceptance Criteria

1. WHEN the EDIcraft agent returns a horizon response, THE System SHALL include the horizon name in the message
2. WHEN coordinates are converted, THE System SHALL include both UTM and Minecraft coordinates in the response
3. WHEN the response is formatted, THE System SHALL use clear markdown formatting with coordinate values
4. WHEN multiple horizons are found, THE System SHALL list all horizons with their respective coordinates
5. WHEN the agent provides thought steps, THE System SHALL include steps for: data retrieval, coordinate conversion, and Minecraft building

### Requirement 4: Logging and Debugging

**User Story:** As a developer, I want detailed logging of horizon query routing and processing, so that I can debug issues when queries fail.

#### Acceptance Criteria

1. THE System SHALL log when a horizon pattern is detected in the agent router
2. THE System SHALL log which specific regex pattern matched the query
3. THE System SHALL log the complete query being sent to the EDIcraft agent
4. THE System SHALL log the response received from the Bedrock AgentCore agent
5. THE System SHALL log any errors encountered during horizon processing with full error details

### Requirement 5: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for horizon query routing and processing, so that I can verify the fix works correctly.

#### Acceptance Criteria

1. THE System SHALL provide a test that validates horizon query routing to EDIcraft agent
2. THE System SHALL provide a test that validates horizon data extraction and coordinate conversion
3. THE System SHALL provide a test that validates response format includes horizon name and coordinates
4. THE System SHALL provide a test that validates error handling for missing horizon data
5. THE System SHALL provide a manual test guide for end-to-end horizon visualization workflow
