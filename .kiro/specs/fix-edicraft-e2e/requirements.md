# Requirements Document: Fix All Agent Backend Functionality

## Introduction

Multiple agents are non-functional due to backend issues introduced during the Amplify to CDK migration. While frontend UX patterns are correct, backends have incomplete implementations, missing connections, or broken integrations. This is a **systemic backend problem** affecting multiple agents, not just EDIcraft.

**Root Cause**: During migration, Amplify hooks and fallbacks were not properly replicated in the CDK approach, leaving backend stubs incomplete or non-functional.

**Scope**: This spec systematically identifies and fixes backend breakages across ALL agents:
- EDIcraft Agent (Minecraft/MCP connection)
- Petrophysics Agent (calculation/analysis backend)
- Maintenance Agent (equipment data backend)
- Renewable Agent (workflow orchestration)
- Auto Agent (general knowledge routing)

**Approach**: Intelligent, pattern-based fixes - not brute force. Identify common patterns, fix systematically.

## Glossary

- **Agent**: Specialized AI system for specific domain (EDIcraft, Petrophysics, Maintenance, Renewable, Auto)
- **Backend Stub**: Incomplete backend implementation left after migration
- **Amplify Fallback**: Automatic error handling/retry logic in Amplify that wasn't replicated in CDK
- **Agent Handler**: Lambda function code that processes agent-specific requests
- **MCP (Model Context Protocol)**: Protocol for connecting AI agents to external tools and services
- **RCON (Remote Console)**: Protocol for remote administration of Minecraft servers
- **Bedrock Agent Runtime**: AWS service for invoking deployed Bedrock Agents
- **Thought Steps**: Chain-of-thought reasoning steps from the AI agent
- **Frontend**: React application running in browser
- **Backend**: AWS Lambda function handling chat/agent requests
- **Localhost Testing**: Testing on local development server (npm run dev) with deployed Lambda backends
- **Systemic Issue**: Problem pattern affecting multiple agents, not isolated to one component

## Requirements

### Requirement 0: Systematic Agent Analysis

**User Story:** As a developer, I want to systematically analyze all agents for backend breakages, so that I can identify common patterns and fix them intelligently.

#### Acceptance Criteria

1. WHEN analyzing agents THEN the system SHALL check each agent's backend handler implementation
2. WHEN checking implementations THEN the system SHALL identify incomplete stubs, missing connections, and broken integrations
3. WHEN patterns are found THEN the system SHALL document the pattern and affected agents
4. WHEN fixes are designed THEN the system SHALL apply pattern-based solutions across similar agents
5. WHEN testing THEN the system SHALL test on localhost with deployed Lambda backends

### Requirement 1: Frontend Button Behavior

**User Story:** As a user, I want the Clear button to provide proper feedback during the operation, so that I know the system is working.

#### Acceptance Criteria

1. WHEN the Clear button is clicked THEN the system SHALL display a loading spinner on the button
2. WHEN the clear operation is in progress THEN the button SHALL remain disabled
3. WHEN the clear operation completes successfully THEN the system SHALL display a success alert
4. WHEN the clear operation fails THEN the system SHALL display an error alert with details
5. WHEN an alert is displayed THEN the system SHALL auto-dismiss it after 5 seconds

### Requirement 2: Message Handling

**User Story:** As a user, I want the clear operation to execute silently without cluttering my chat, so that I can focus on the results.

#### Acceptance Criteria

1. WHEN the Clear button is clicked THEN the system SHALL NOT display a user message in the chat interface
2. WHEN the agent processes the clear request THEN the system SHALL display the agent's response in chat
3. WHEN the agent provides thought steps THEN the system SHALL display them in the chain-of-thought panel
4. WHEN the clear operation completes THEN the system SHALL display only the final result message
5. WHEN multiple clear operations are triggered THEN the system SHALL prevent duplicate submissions

### Requirement 3: Backend Agent Configuration

**User Story:** As a system administrator, I want the EDIcraft agent properly configured, so that it can process requests.

#### Acceptance Criteria

1. WHEN the chat Lambda function starts THEN the system SHALL load BEDROCK_AGENT_ID from environment variables
2. WHEN BEDROCK_AGENT_ID is missing THEN the system SHALL return a clear error message
3. WHEN the agent is invoked THEN the system SHALL use the correct agent alias ID
4. WHEN the agent is invoked THEN the system SHALL use the correct AWS region
5. WHEN IAM permissions are insufficient THEN the system SHALL return a permission error with guidance

### Requirement 4: MCP Client Connection

**User Story:** As a developer, I want the MCP client to connect to the Minecraft server, so that commands can be executed.

#### Acceptance Criteria

1. WHEN the MCP client initializes THEN the system SHALL load Minecraft server credentials from environment
2. WHEN the MCP client connects THEN the system SHALL verify RCON connectivity to the Minecraft server
3. WHEN RCON credentials are invalid THEN the system SHALL return a connection error
4. WHEN the Minecraft server is unreachable THEN the system SHALL return a timeout error
5. WHEN the connection succeeds THEN the system SHALL log the successful connection

### Requirement 5: Clear Command Execution

**User Story:** As a user, I want the clear command to actually remove structures from Minecraft, so that I can reset the environment.

#### Acceptance Criteria

1. WHEN a clear command is received THEN the system SHALL invoke the Bedrock Agent with the clear request
2. WHEN the Bedrock Agent processes the request THEN the system SHALL execute RCON commands on the Minecraft server
3. WHEN structures are cleared THEN the system SHALL remove all wellbores, rigs, and markers
4. WHEN the clear operation completes THEN the system SHALL return a success message with details
5. WHEN the clear operation fails THEN the system SHALL return an error message with the failure reason

### Requirement 6: Thought Step Streaming

**User Story:** As a user, I want to see the agent's reasoning process, so that I understand what it's doing.

#### Acceptance Criteria

1. WHEN the agent processes a request THEN the system SHALL stream thought steps in real-time
2. WHEN thought steps are received THEN the system SHALL update the chain-of-thought display
3. WHEN the agent completes processing THEN the system SHALL mark all thought steps as complete
4. WHEN thought steps include tool calls THEN the system SHALL display the tool name and parameters
5. WHEN thought steps include errors THEN the system SHALL display the error details

### Requirement 7: Error Handling and Recovery

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can take corrective action.

#### Acceptance Criteria

1. WHEN the Bedrock Agent is not configured THEN the system SHALL display "Agent not configured" with setup instructions
2. WHEN the Minecraft server is unreachable THEN the system SHALL display "Server unreachable" with connection details
3. WHEN RCON authentication fails THEN the system SHALL display "Authentication failed" with credential guidance
4. WHEN IAM permissions are missing THEN the system SHALL display "Permission denied" with required permissions
5. WHEN an unknown error occurs THEN the system SHALL display the error message and log details for debugging

### Requirement 8: Environment Variable Management

**User Story:** As a developer, I want environment variables properly configured, so that the agent can connect to external services.

#### Acceptance Criteria

1. WHEN the Lambda function deploys THEN the system SHALL include BEDROCK_AGENT_ID in environment variables
2. WHEN the Lambda function deploys THEN the system SHALL include MINECRAFT_HOST in environment variables
3. WHEN the Lambda function deploys THEN the system SHALL include MINECRAFT_RCON_PASSWORD in environment variables
4. WHEN environment variables are missing THEN the system SHALL provide clear error messages
5. WHEN environment variables are set THEN the system SHALL validate their format before use

### Requirement 9: IAM Permissions

**User Story:** As a system administrator, I want proper IAM permissions configured, so that the Lambda can invoke the Bedrock Agent.

#### Acceptance Criteria

1. WHEN the Lambda role is created THEN the system SHALL include bedrock-agent-runtime:InvokeAgent permission
2. WHEN the Lambda invokes the agent THEN the system SHALL have permission to access the specific agent ARN
3. WHEN permissions are insufficient THEN the system SHALL return a clear permission error
4. WHEN permissions are correct THEN the system SHALL successfully invoke the agent
5. WHEN the agent is invoked THEN the system SHALL log the invocation for auditing

### Requirement 10: End-to-End Validation

**User Story:** As a user, I want the complete flow to work from button click to Minecraft update, so that I can use the EDIcraft features.

#### Acceptance Criteria

1. WHEN the Clear button is clicked THEN the system SHALL execute the complete flow without errors
2. WHEN the flow completes THEN the Minecraft world SHALL have all structures removed
3. WHEN the flow completes THEN the user SHALL see a success message in the UI
4. WHEN the flow completes THEN the agent's response SHALL appear in the chat
5. WHEN the flow completes THEN the thought steps SHALL be visible in the chain-of-thought panel


### Requirement 11: Petrophysics Agent Backend

**User Story:** As a user, I want the Petrophysics agent to perform calculations and analysis, so that I can analyze well data.

#### Acceptance Criteria

1. WHEN a petrophysics query is sent THEN the system SHALL route to the petrophysics agent handler
2. WHEN calculations are requested THEN the system SHALL execute the calculation logic
3. WHEN analysis is requested THEN the system SHALL process well data and return results
4. WHEN MCP tools are needed THEN the system SHALL invoke petrophysics MCP server
5. WHEN results are ready THEN the system SHALL return formatted data with thought steps

### Requirement 12: Maintenance Agent Backend

**User Story:** As a user, I want the Maintenance agent to access equipment data, so that I can get maintenance recommendations.

#### Acceptance Criteria

1. WHEN a maintenance query is sent THEN the system SHALL route to the maintenance agent handler
2. WHEN equipment data is requested THEN the system SHALL fetch from the appropriate data source
3. WHEN analysis is requested THEN the system SHALL process equipment status and return recommendations
4. WHEN MCP tools are needed THEN the system SHALL invoke maintenance MCP server
5. WHEN results are ready THEN the system SHALL return formatted recommendations with thought steps

### Requirement 13: Renewable Agent Backend

**User Story:** As a user, I want the Renewable agent to orchestrate wind farm workflows, so that I can analyze sites and optimize layouts.

#### Acceptance Criteria

1. WHEN a renewable query is sent THEN the system SHALL route to the renewable orchestrator
2. WHEN workflow steps are needed THEN the system SHALL execute the workflow in correct order
3. WHEN tools are needed THEN the system SHALL invoke renewable tools Lambda
4. WHEN artifacts are generated THEN the system SHALL store them in S3 and return references
5. WHEN results are ready THEN the system SHALL return workflow results with thought steps

### Requirement 14: Auto Agent Backend

**User Story:** As a user, I want the Auto agent to route general queries intelligently, so that I get appropriate responses.

#### Acceptance Criteria

1. WHEN a general query is sent THEN the system SHALL route to the auto agent handler
2. WHEN intent classification is needed THEN the system SHALL determine the appropriate sub-agent
3. WHEN no specific agent matches THEN the system SHALL use general knowledge model
4. WHEN responses are generated THEN the system SHALL return formatted responses
5. WHEN errors occur THEN the system SHALL provide helpful fallback responses

### Requirement 15: Common Backend Patterns

**User Story:** As a developer, I want to identify common backend patterns, so that I can fix issues systematically.

#### Acceptance Criteria

1. WHEN analyzing agents THEN the system SHALL identify common initialization patterns
2. WHEN analyzing agents THEN the system SHALL identify common error handling patterns
3. WHEN analyzing agents THEN the system SHALL identify common MCP connection patterns
4. WHEN analyzing agents THEN the system SHALL identify common response formatting patterns
5. WHEN patterns are identified THEN the system SHALL document them for reuse

### Requirement 16: Localhost Testing with Deployed Backends

**User Story:** As a developer, I want to test on localhost with deployed Lambda backends, so that I can validate fixes quickly.

#### Acceptance Criteria

1. WHEN testing locally THEN the system SHALL connect to deployed Lambda functions
2. WHEN Lambda changes are made THEN the system SHALL deploy only Lambda (not frontend)
3. WHEN testing THEN the system SHALL use localhost frontend at http://localhost:3000
4. WHEN validating THEN the system SHALL verify backend responses in browser console
5. WHEN issues are found THEN the system SHALL iterate on Lambda code and redeploy

### Requirement 17: Intelligent Pattern-Based Fixes

**User Story:** As a developer, I want to apply intelligent fixes based on patterns, so that I don't repeat the same work.

#### Acceptance Criteria

1. WHEN a pattern is identified THEN the system SHALL create a reusable fix template
2. WHEN applying fixes THEN the system SHALL adapt the template to each agent's specifics
3. WHEN testing fixes THEN the system SHALL verify the pattern works across all affected agents
4. WHEN documenting THEN the system SHALL explain the pattern and why it works
5. WHEN future issues arise THEN the system SHALL check if existing patterns apply

### Requirement 18: Systematic Validation

**User Story:** As a developer, I want to systematically validate all agents, so that I know they all work.

#### Acceptance Criteria

1. WHEN validation starts THEN the system SHALL test each agent in sequence
2. WHEN testing an agent THEN the system SHALL verify basic functionality works
3. WHEN testing an agent THEN the system SHALL verify error handling works
4. WHEN testing an agent THEN the system SHALL verify thought steps are returned
5. WHEN all agents pass THEN the system SHALL document the validation results
