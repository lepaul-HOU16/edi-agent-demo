# Implementation Plan - Renewable Energy Integration

## Overview

This implementation plan breaks down the renewable energy integration into discrete, manageable tasks. Each task builds on previous tasks and focuses on code implementation that can be executed by a coding agent.

## Task List

- [x] 1. Deploy Renewable Backend to AgentCore
  - Deploy the original demo backend using `deploy-to-agentcore.sh` script
  - Configure S3 storage via SSM parameters
  - Connect to EDI Platform's Cognito user pool
  - Document the AgentCore endpoint URL
  - _Requirements: 1, 2, 7, 8_

- [x] 2. Remove Incorrectly Converted TypeScript Files
  - [x] 2.1 Move incorrect files to deprecated directory
    - Create `docs/deprecated/renewable-typescript-attempt/` directory
    - Move `amplify/functions/agents/renewableEnergyAgent.ts` to deprecated
    - Move `amplify/functions/tools/renewableTerrainAnalysisTool.ts` to deprecated
    - Move `amplify/functions/tools/renewableLayoutOptimizationTool.ts` to deprecated
    - Move `amplify/functions/tools/renewableSimulationTool.ts` to deprecated
    - _Requirements: 3_
  
  - [x] 2.2 Update imports and references
    - Remove imports of deleted files from `agentRouter.ts`
    - Remove any references to renewable tools in existing code
    - Ensure TypeScript compilation passes
    - _Requirements: 3, 9_

- [x] 3. Create Integration Layer Foundation
  - [x] 3.1 Create directory structure
    - Create `src/services/renewable-integration/` directory
    - Create `src/services/renewable-integration/types.ts` for TypeScript types
    - Create `src/services/renewable-integration/config.ts` for configuration
    - _Requirements: 4, 7_
  
  - [x] 3.2 Implement configuration management
    - Define `RenewableConfig` interface in `config.ts`
    - Implement `getRenewableConfig()` function to read environment variables
    - Add environment variable validation
    - _Requirements: 7_
  
  - [x] 3.3 Define TypeScript types
    - Define `AgentCoreRequest` interface in `types.ts`
    - Define `AgentCoreResponse` interface in `types.ts`
    - Define `AgentCoreArtifact` interface in `types.ts`
    - Define EDI Platform artifact types (TerrainArtifact, LayoutArtifact, etc.)
    - _Requirements: 4_

- [x] 4. Implement RenewableClient
  - [x] 4.1 Create HTTP client class
    - Create `src/services/renewable-integration/renewableClient.ts`
    - Implement `RenewableClient` class with constructor
    - Add `agentCoreEndpoint` and `cognitoToken` properties
    - _Requirements: 4_
  
  - [x] 4.2 Implement invokeAgent method
    - Implement `invokeAgent(prompt: string)` method
    - Add HTTP POST request to AgentCore endpoint
    - Include Authorization header with Cognito token
    - Parse JSON response
    - _Requirements: 4, 8_
  
  - [x] 4.3 Add error handling
    - Catch network errors and throw `ConnectionError`
    - Catch 401/403 errors and throw `AuthenticationError`
    - Catch server errors and throw `AgentCoreError`
    - Add retry logic for transient failures
    - _Requirements: 4_
  
  - [ ]* 4.4 Add streaming support (optional)
    - Implement SSE (Server-Sent Events) handling for streaming responses
    - Add `invokeAgentStream()` method for streaming
    - Parse streaming events and yield partial results
    - _Requirements: 4_

- [x] 5. Implement ResponseTransformer
  - [x] 5.1 Create transformer class
    - Create `src/services/renewable-integration/responseTransformer.ts`
    - Implement `ResponseTransformer` class
    - _Requirements: 4_
  
  - [x] 5.2 Implement terrain artifact transformation
    - Implement `transformTerrainArtifact()` method
    - Extract Folium HTML from AgentCore response
    - Map to `TerrainArtifact` interface
    - Handle missing/malformed data gracefully
    - _Requirements: 4, 5_
  
  - [x] 5.3 Implement layout artifact transformation
    - Implement `transformLayoutArtifact()` method
    - Extract Folium HTML and GeoJSON from response
    - Map to `LayoutArtifact` interface
    - Handle missing/malformed data gracefully
    - _Requirements: 4, 5_
  
  - [x] 5.4 Implement simulation artifact transformation
    - Implement `transformSimulationArtifact()` method
    - Extract matplotlib chart images (base64) from response
    - Map to `SimulationArtifact` interface
    - Handle missing/malformed data gracefully
    - _Requirements: 4, 5_
  
  - [x] 5.5 Implement report artifact transformation
    - Implement `transformReportArtifact()` method
    - Extract report HTML from response
    - Map to `ReportArtifact` interface
    - Handle missing/malformed data gracefully
    - _Requirements: 4, 5_
  
  - [x] 5.6 Implement main transformation method
    - Implement `transformToEDIArtifact()` method
    - Route to appropriate transformation method based on artifact type
    - Return array of transformed artifacts
    - _Requirements: 4_

- [x] 6. Create Renewable Proxy Agent
  - [x] 6.1 Create proxy agent file
    - Create `amplify/functions/agents/renewableProxyAgent.ts`
    - Implement `RenewableProxyAgent` class
    - Add constructor that initializes `RenewableClient`
    - _Requirements: 4_
  
  - [x] 6.2 Implement processQuery method
    - Implement `processQuery(message: string)` method
    - Call `RenewableClient.invokeAgent()` with user message
    - Transform response using `ResponseTransformer`
    - Return `RouterResponse` in EDI Platform format
    - _Requirements: 4_
  
  - [x] 6.3 Add thought steps handling
    - Extract thought steps from AgentCore response
    - Map to EDI Platform thought step format
    - Include in `RouterResponse`
    - _Requirements: 4_
  
  - [x] 6.4 Add error handling
    - Catch errors from `RenewableClient`
    - Return error `RouterResponse` with user-friendly message
    - Log errors for debugging
    - _Requirements: 4_

- [x] 7. Update Agent Router
  - [x] 7.1 Add renewable pattern detection
    - Add `renewablePatterns` array to `agentRouter.ts`
    - Implement `isRenewableQuery()` function
    - Test pattern matching with sample queries
    - _Requirements: 6_
  
  - [x] 7.2 Add routing logic
    - Import `RenewableProxyAgent` in `agentRouter.ts`
    - Add renewable routing case in main routing logic
    - Ensure renewable queries route before petrophysical queries
    - _Requirements: 6_
  
  - [x] 7.3 Add configuration check
    - Check if renewable integration is enabled via config
    - If disabled, fall back to generic response
    - Add logging for routing decisions
    - _Requirements: 6, 7_

- [x] 8. Create UI Components for Renewable Artifacts
  - [x] 8.1 Create component directory
    - Create `src/components/renewable/` directory
    - Create `src/components/renewable/types.ts` for component types
    - _Requirements: 5_
  
  - [x] 8.2 Implement TerrainMapArtifact component
    - Create `src/components/renewable/TerrainMapArtifact.tsx`
    - Render Folium HTML in iframe
    - Display suitability score and exclusion zones summary
    - Add styling for map container
    - _Requirements: 5_
  
  - [x] 8.3 Implement LayoutMapArtifact component
    - Create `src/components/renewable/LayoutMapArtifact.tsx`
    - Render Folium HTML in iframe
    - Display turbine count and total capacity
    - Add styling for map container
    - _Requirements: 5_
  
  - [x] 8.4 Implement SimulationChartArtifact component
    - Create `src/components/renewable/SimulationChartArtifact.tsx`
    - Render matplotlib chart images (base64)
    - Display performance metrics (AEP, capacity factor, wake losses)
    - Add styling for charts
    - _Requirements: 5_
  
  - [x] 8.5 Implement ReportArtifact component
    - Create `src/components/renewable/ReportArtifact.tsx`
    - Render report HTML
    - Display executive summary and recommendations
    - Add styling for report
    - _Requirements: 5_

- [x] 9. Register Renewable Artifacts in Artifact Renderer
  - [x] 9.1 Update artifact registry
    - Import renewable artifact components in `ArtifactRenderer.tsx`
    - Add `wind_farm_terrain_analysis` to artifact type mapping
    - Add `wind_farm_layout` to artifact type mapping
    - Add `wind_farm_simulation` to artifact type mapping
    - Add `wind_farm_report` to artifact type mapping
    - _Requirements: 5_
  
  - [x] 9.2 Add artifact type guards
    - Implement type guards for renewable artifact types
    - Ensure type safety in artifact rendering
    - _Requirements: 5_

- [x] 10. Add Environment Variables and Configuration
  - [x] 10.1 Update .env.example
    - Add `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT` to `.env.example`
    - Add `NEXT_PUBLIC_RENEWABLE_ENABLED` to `.env.example`
    - Add `NEXT_PUBLIC_RENEWABLE_S3_BUCKET` to `.env.example`
    - Add documentation comments for each variable
    - _Requirements: 7_
  
  - [x] 10.2 Update Amplify environment configuration
    - Add renewable configuration to `amplify/backend.ts` if needed
    - Ensure environment variables are passed to Lambda functions
    - _Requirements: 7, 8_

- [ ]* 11. Write Unit Tests
  - [ ]* 11.1 Test RenewableClient
    - Write tests for successful AgentCore invocation
    - Write tests for error handling (network, auth, server errors)
    - Write tests for response parsing
    - _Requirements: 4_
  
  - [ ]* 11.2 Test ResponseTransformer
    - Write tests for terrain artifact transformation
    - Write tests for layout artifact transformation
    - Write tests for simulation artifact transformation
    - Write tests for report artifact transformation
    - Write tests for handling missing/malformed data
    - _Requirements: 4_
  
  - [ ]* 11.3 Test RenewableProxyAgent
    - Write tests for processQuery method
    - Write tests for error handling
    - Write tests for thought steps handling
    - _Requirements: 4_
  
  - [ ]* 11.4 Test Agent Router
    - Write tests for renewable pattern detection
    - Write tests for routing to renewable proxy
    - Write tests for fallback to other agents
    - _Requirements: 6_
  
  - [ ]* 11.5 Test UI Components
    - Write tests for TerrainMapArtifact rendering
    - Write tests for LayoutMapArtifact rendering
    - Write tests for SimulationChartArtifact rendering
    - Write tests for ReportArtifact rendering
    - _Requirements: 5_

- [x] 12. Integration Testing and Validation
  - [x] 12.1 Test end-to-end flow
    - Deploy frontend changes to sandbox environment
    - Test query: "Analyze terrain for wind farm at 35.067482, -101.395466"
    - Verify query is detected as renewable
    - Verify query is routed to renewable proxy
    - Verify AgentCore is invoked successfully
    - Verify response is transformed correctly
    - Verify terrain map displays correctly
    - _Requirements: 1, 2, 4, 5, 6_
  
  - [x] 12.2 Test layout workflow
    - Test query: "Create a 30MW wind farm layout at those coordinates"
    - Verify layout map displays correctly
    - Verify turbine positions are shown
    - Verify GeoJSON data is correct
    - _Requirements: 1, 2, 4, 5, 6_
  
  - [x] 12.3 Test simulation workflow
    - Test query: "Run wake simulation for the layout"
    - Verify simulation charts display correctly
    - Verify performance metrics are shown
    - Verify wake loss calculations are accurate
    - _Requirements: 1, 2, 4, 5, 6_
  
  - [x] 12.4 Test report generation
    - Test query: "Generate executive report"
    - Verify report displays correctly
    - Verify recommendations are shown
    - _Requirements: 1, 2, 4, 5, 6_
  
  - [x] 12.5 Test error scenarios
    - Test with invalid coordinates
    - Test with AgentCore unavailable
    - Test with authentication failure
    - Verify error messages are user-friendly
    - _Requirements: 4_
  
  - [x] 12.6 Test visualization quality
    - Verify Folium maps have correct tile layers (USGS Topo, USGS Satellite, Esri)
    - Verify maps are interactive (zoom, pan, layer switching)
    - Verify matplotlib charts are clear and readable
    - Verify colors and styling match demo
    - _Requirements: 5_

- [x] 13. Documentation
  - [x] 13.1 Create integration documentation
    - Create `docs/RENEWABLE_INTEGRATION.md`
    - Document architecture and component overview
    - Document data flow from user query to visualization
    - Include architecture diagrams
    - _Requirements: 10_
  
  - [x] 13.2 Document deployment process
    - Document AgentCore deployment steps
    - Document SSM parameter configuration
    - Document environment variable setup
    - Document Cognito integration
    - _Requirements: 8, 10_
  
  - [x] 13.3 Document sample queries
    - List example renewable queries
    - Document expected responses for each query
    - Include screenshots of visualizations
    - _Requirements: 10_
  
  - [x] 13.4 Document troubleshooting
    - Document common issues and solutions
    - Document error messages and their meanings
    - Document how to check AgentCore logs
    - Document how to verify configuration
    - _Requirements: 10_
  
  - [x] 13.5 Update main README
    - Add renewable energy integration section to main README
    - Link to detailed integration documentation
    - Add renewable features to feature list
    - _Requirements: 10_

- [ ] 15. Deploy Python Proxy Lambda for Real Data
  - [ ] 15.1 Register Python proxy in Amplify backend
    - Import renewableAgentCoreProxy in amplify/backend.ts
    - Add to defineBackend configuration
    - Add IAM permissions for bedrock-agentcore access
    - _Requirements: 4, 8_
  
  - [ ] 15.2 Deploy the Python proxy Lambda
    - Run npx ampx sandbox to deploy changes
    - Verify Lambda function is created
    - Check Lambda logs for successful initialization
    - _Requirements: 4, 8_
  
  - [ ] 15.3 Update TypeScript client to use deployed Lambda
    - Verify RENEWABLE_PROXY_FUNCTION_NAME environment variable
    - Test Lambda invocation from TypeScript client
    - Verify real data flows through the proxy
    - _Requirements: 4_
  
  - [ ] 15.4 Verify real data integration
    - Test renewable query in chat interface
    - Verify no "mock-project-123" in responses
    - Verify real coordinates appear in artifacts
    - Verify Python Lambda logs show AgentCore calls
    - _Requirements: 1, 2, 4, 5, 6_

- [ ] 14. Performance Optimization (Optional)
  - [ ]* 14.1 Implement response caching
    - Cache turbine specifications
    - Cache wind resource data
    - Implement cache invalidation strategy
    - _Requirements: 4_
  
  - [ ]* 14.2 Implement progressive rendering
    - Display thought steps as they arrive
    - Display artifacts as they're generated
    - Add loading indicators
    - _Requirements: 5_
  
  - [ ]* 14.3 Optimize visualization loading
    - Lazy load Folium maps
    - Optimize image sizes for matplotlib charts
    - Add placeholder while loading
    - _Requirements: 5_

## Task Execution Notes

### Prerequisites
- AgentCore endpoint must be deployed and accessible (Task 1)
- Environment variables must be configured (Task 10)
- Cognito authentication must be working

### Task Dependencies
- Tasks 2-10 can be worked on in parallel after Task 1
- Task 11 (tests) should be done alongside implementation tasks
- Task 12 (integration testing) requires Tasks 1-10 to be complete
- Task 13 (documentation) can be done alongside implementation
- Task 14 (optimization) is optional and can be done after Task 12

### Testing Strategy
- Unit tests marked with * are optional but recommended
- Integration tests (Task 12) are mandatory
- Manual testing should be done for all user-facing features

### Deployment Strategy
- Deploy backend first (Task 1)
- Deploy frontend changes incrementally
- Test in sandbox environment before production
- Have rollback plan ready

## Success Criteria

When all tasks are complete:
- [ ] Users can type renewable queries in chat
- [ ] Queries are automatically routed to renewable backend
- [ ] Folium maps display correctly with interactive features
- [ ] Matplotlib charts display correctly
- [ ] Thought steps are visible in UI
- [ ] Error messages are clear and actionable
- [ ] Zero modifications to demo code
- [ ] Integration layer is < 500 lines of code
- [ ] Response time is < 35 seconds
- [ ] Documentation is complete and accurate
