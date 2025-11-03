# Implementation Plan

- [x] 1. Add Enhanced Horizon Detection Patterns to Agent Router
  - Update `amplify/functions/agents/agentRouter.ts` edicraftPatterns array
  - Add horizon finding patterns: /find.*horizon|horizon.*find/i, /get.*horizon|horizon.*name/i, /list.*horizon|show.*horizon/i
  - Add coordinate conversion patterns: /convert.*coordinates|coordinates.*convert/i, /convert.*to.*minecraft|minecraft.*convert/i, /coordinates.*for.*minecraft|minecraft.*coordinates/i
  - Add combined horizon + coordinate patterns: /horizon.*coordinates|coordinates.*horizon/i, /horizon.*minecraft|minecraft.*horizon/i, /horizon.*convert|convert.*horizon/i
  - Add natural language patterns: /tell.*me.*horizon|horizon.*tell.*me/i, /what.*horizon|which.*horizon/i, /where.*horizon|horizon.*where/i
  - Add coordinate output patterns: /coordinates.*you.*use|coordinates.*to.*use/i, /print.*coordinates|output.*coordinates/i
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Enhance Pattern Matching Logging
  - Update pattern matching logic in determineAgentType method
  - Add detailed logging for each pattern test
  - Log matched pattern source and query excerpt
  - Log total number of patterns matched
  - Log final agent selection decision
  - _Requirements: 1.4, 4.1, 4.2_

- [x] 3. Create Unit Tests for Horizon Pattern Matching
  - Create test file `tests/unit/test-agent-router-horizon.test.ts`
  - Test "find a horizon" routes to EDIcraft
  - Test "horizon name" routes to EDIcraft
  - Test "convert to minecraft coordinates" routes to EDIcraft
  - Test complex query "find a horizon, tell me its name, convert it to minecraft coordinates..." routes to EDIcraft
  - Test that horizon queries don't route to petrophysics agent
  - _Requirements: 5.1_

- [x] 4. Create Integration Test for Horizon Workflow
  - Create test file `tests/integration/test-edicraft-horizon-workflow.test.ts`
  - Test end-to-end horizon query processing
  - Verify agentUsed is 'edicraft'
  - Verify response includes horizon-related content
  - Verify response includes coordinate information
  - Verify thought steps are present
  - _Requirements: 5.2, 5.3_

- [x] 5. Create Manual Test Script
  - Create test script `tests/manual/test-edicraft-horizon-query.sh`
  - Test simple horizon query: "find a horizon"
  - Test horizon name query: "tell me the horizon name"
  - Test coordinate conversion: "convert to minecraft coordinates"
  - Test complex user query: "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"
  - Document expected results for each test
  - _Requirements: 5.5_

- [x] 6. Deploy and Test Pattern Matching
  - Run TypeScript compilation: npx tsc --noEmit
  - Run linter: npm run lint
  - Deploy to sandbox: npx ampx sandbox
  - Wait for deployment to complete
  - Test with user's actual query
  - Verify routing logs show EDIcraft pattern matched
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3_

- [x] 7. Validate End-to-End Horizon Query Processing
  - Send query: "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"
  - Verify query routes to EDIcraft agent (check logs)
  - Verify EDIcraft handler processes the query
  - Verify response is NOT the petrophysics welcome message
  - Verify response includes horizon-related content
  - Verify thought steps show proper execution
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5_

- [x] 8. Test Error Handling for Horizon Queries
  - Test with invalid horizon query
  - Test with missing OSDU credentials
  - Test with unreachable Minecraft server
  - Verify error messages are user-friendly
  - Verify error messages include troubleshooting steps
  - _Requirements: 2.5, 5.4_

- [x] 9. Validate No Regressions in Existing Functionality
  - Test existing EDIcraft queries still work: "build wellbore trajectory", "visualize horizon surface"
  - Test petrophysics queries still route correctly: "calculate porosity", "analyze well data"
  - Test renewable queries still route correctly: "wind farm analysis", "terrain analysis"
  - Test maintenance queries still route correctly: "equipment status"
  - Verify no existing functionality is broken
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 10. Document Pattern Matching Enhancement
  - Update agent router documentation with new patterns
  - Document which patterns match which query types
  - Add examples of queries that match each pattern
  - Document troubleshooting steps for routing issues
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

## New Tasks: Hybrid Intent Classifier Implementation

- [x] 11. Create Intent Classifier Module
  - Create `amplify/functions/edicraftAgent/intentClassifier.ts`
  - Implement `classifyIntent()` function with pattern matching
  - Add patterns for wellbore_trajectory (with well ID extraction)
  - Add patterns for horizon_surface (with optional horizon name extraction)
  - Add patterns for list_players
  - Add patterns for player_positions
  - Add patterns for system_status
  - Return Intent object with type, confidence, and extracted parameters
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 12. Implement Tool Call Message Generator
  - Add `generateToolCallMessage()` function to intentClassifier.ts
  - Generate DIRECT_TOOL_CALL format for each intent type
  - Format: "DIRECT_TOOL_CALL: function_name(parameters)"
  - Include extracted parameters (well IDs, horizon names)
  - _Requirements: 2.2, 2.3_

- [x] 13. Update TypeScript Handler to Use Intent Classifier
  - Update `amplify/functions/edicraftAgent/handler.ts`
  - Import classifyIntent and generateToolCallMessage
  - Call classifyIntent() before MCP client
  - Route high-confidence intents (>= 0.85) to direct tool calls
  - Route low-confidence intents to LLM agent
  - Add logging for intent classification and routing decisions
  - _Requirements: 2.4, 2.5, 4.1, 4.2_

- [x] 14. Add Direct Tool Call Handler to Python Agent
  - Update `edicraft-agent/agent.py`
  - Add `handle_direct_tool_call()` function
  - Parse DIRECT_TOOL_CALL messages with regex
  - Extract function name and parameters
  - Route to appropriate composite workflow tools
  - Add error handling for invalid tool calls
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 15. Update Python Agent to Support Hybrid Approach
  - Modify agent system prompt to handle both direct calls and natural language
  - Create wrapper `agent()` function that checks message type
  - Route DIRECT_TOOL_CALL messages to handler
  - Route natural language messages to LLM agent
  - Maintain existing composite workflow tools
  - _Requirements: 3.4, 3.5_

- [x] 16. Deploy and Test Hybrid Intent Classifier
  - Deploy Python agent: `make -C edicraft-agent deploy`
  - Wait for sandbox hot reload
  - Test wellbore trajectory with exact pattern: "Build wellbore trajectory for WELL-011"
  - Test wellbore trajectory with variation: "Visualize wellbore WELL-005"
  - Test horizon surface: "Build horizon surface"
  - Test list players: "List players"
  - Test system status: "Hello"
  - Verify all tests route correctly and execute proper tools
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 17. Create Comprehensive Intent Classifier Tests
  - Create `test-intent-scenarios.js` test script
  - Test deterministic patterns (wellbore, horizon, players, status)
  - Test pattern variations for each intent type
  - Test ambiguous cases that should use LLM
  - Verify correct tool execution for each scenario
  - Document test results
  - _Requirements: 5.4, 5.5_

- [x] 18. Validate Performance and Accuracy
  - Measure response time for deterministic routing vs LLM routing
  - Verify 95%+ accuracy for common patterns
  - Test edge cases and boundary conditions
  - Verify no regressions in existing functionality
  - Document performance metrics
  - _Requirements: 4.3, 4.4, 4.5_
