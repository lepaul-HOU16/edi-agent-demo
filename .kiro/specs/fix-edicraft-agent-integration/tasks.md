# Implementation Plan

- [x] 1. Fix Agent Router Pattern Matching
  - Update `amplify/functions/agents/agentRouter.ts` to add EDIcraft-specific pattern detection
  - Add patterns: minecraft, wellbore trajectory, horizon surface, build wellbore, osdu wellbore, osdu horizon, player position, coordinate tracking, transform coordinates, utm minecraft, subsurface visualization, 3d wellbore, geological surface, minecraft visualization
  - Implement priority handling for "well log" + "minecraft" queries to route to EDIcraft over petrophysics
  - Add logging for routing decisions with matched patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement Environment Variable Validation
  - Add validation function in `amplify/functions/edicraftAgent/handler.ts` to check all required environment variables
  - Required variables: BEDROCK_AGENT_ID, BEDROCK_AGENT_ALIAS_ID, MINECRAFT_HOST, MINECRAFT_PORT, MINECRAFT_RCON_PASSWORD, EDI_USERNAME, EDI_PASSWORD, EDI_CLIENT_ID, EDI_CLIENT_SECRET, EDI_PARTITION, EDI_PLATFORM_URL
  - Return structured error response with list of missing variables
  - Validate agent ID format (should match AWS agent ID pattern)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Implement Bedrock AgentCore Invocation in MCP Client
  - Update `amplify/functions/edicraftAgent/mcpClient.ts` to use BedrockAgentRuntimeClient
  - Create InvokeAgentCommand with sessionId and inputText
  - Process response stream to extract completion text
  - Parse trace information for thought steps
  - Handle streaming response chunks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement Error Categorization and User-Friendly Messages
  - Update error categorization function in handler to detect: CONNECTION_REFUSED, TIMEOUT, AUTH_FAILED, OSDU_ERROR, AGENT_NOT_DEPLOYED, INVALID_CONFIG
  - Create user-friendly error messages with troubleshooting steps for each error type
  - Add specific guidance for Minecraft server issues (server status, RCON config, firewall)
  - Add specific guidance for OSDU issues (credentials, platform URL, permissions)
  - _Requirements: 2.2, 2.4, 4.4, 4.5_

- [x] 5. Implement Thought Step Extraction
  - Parse Bedrock AgentCore response trace to extract execution steps
  - Convert trace events to ThoughtStep format with id, type, timestamp, title, summary, status
  - Handle different trace event types (orchestration, action group invocation, observation)
  - Return thought steps in response to show agent execution progress
  - _Requirements: 2.3, 5.3_

- [x] 6. Remove Stub Logic from EDIcraft Agent Wrapper
  - Remove preview response logic from `amplify/functions/agents/edicraftAgent.ts`
  - Remove handleWellboreVisualization, handleHorizonVisualization, handlePlayerTracking, handleGeneralQuery methods
  - Simplify EDIcraftAgent class to just call the handler
  - Ensure response format matches expected interface
  - _Requirements: 2.1, 2.3, 5.1, 5.2_

- [x] 7. Add Retry Logic with Exponential Backoff
  - Implement retry logic in MCP client for transient failures
  - Use exponential backoff strategy (1s, 2s, 4s delays)
  - Maximum 3 retry attempts
  - Only retry on specific error types (timeout, connection refused)
  - Log retry attempts
  - _Requirements: 3.5_

- [x] 8. Configure Environment Variables in Backend
  - Update `amplify/backend.ts` to add environment variables to edicraftAgent Lambda
  - Add all required Minecraft, OSDU, and Bedrock configuration
  - Use process.env with fallback values for development
  - Document required variables in deployment guide
  - _Requirements: 4.1, 4.2_

- [x] 9. Update Agent Registration in Backend
  - Ensure edicraftAgent is properly registered in `amplify/backend.ts`
  - Grant IAM permissions for Bedrock AgentCore invocation
  - Grant IAM permissions for CloudWatch logging
  - Verify Lambda timeout is set to 300 seconds
  - _Requirements: 3.1, 3.2_

- [x] 10. Create Unit Tests for Agent Router
  - Write tests for EDIcraft pattern matching
  - Test priority handling for "well log" + "minecraft"
  - Test routing decision logging
  - Test confidence scoring
  - _Requirements: 6.1_

- [x] 11. Create Unit Tests for Handler
  - Test environment variable validation
  - Test error categorization for all error types
  - Test response formatting
  - Test thought step generation
  - _Requirements: 6.3, 6.4_

- [x] 12. Create Unit Tests for MCP Client
  - Test Bedrock AgentCore invocation with mock client
  - Test response parsing
  - Test error handling
  - Test retry logic
  - _Requirements: 6.2_

- [x] 13. Create Integration Tests
  - Test complete flow from query to response with mock Bedrock responses
  - Test error scenarios (missing env vars, connection failures)
  - Test thought step extraction from mock traces
  - Test response format compatibility
  - _Requirements: 6.5_

- [x] 14. Manual Testing and Validation
  - Deploy updated Lambda code to sandbox
  - Configure environment variables with actual credentials
  - Test routing with Minecraft-related queries
  - Test agent execution with wellbore visualization request
  - Test error handling with invalid credentials
  - Verify thought steps display in chat interface
  - Validate with user that agent works end-to-end
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.3_

- [x] 15. Update Documentation
  - Update deployment guide with Bedrock AgentCore deployment steps
  - Document all required environment variables
  - Create troubleshooting guide for common errors
  - Document user workflows from query to Minecraft visualization
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
