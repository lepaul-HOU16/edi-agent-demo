# Implementation Plan

## Overview

This implementation plan breaks down the Maintenance Agent integration into discrete, manageable tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate. The plan is organized into 6 major phases executed over 3 weeks.

## Task List

- [x] 1. Backend Infrastructure Setup
  - Create the foundational backend components for the Maintenance agent
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.1 Create Maintenance Agent Directory Structure
  - Create `amplify/functions/maintenanceAgent/` directory
  - Create subdirectories: `__tests__/`, `tools/`, `handlers/`
  - Create initial files: `handler.ts`, `maintenanceStrandsAgent.ts`, `resource.ts`, `package.json`, `tsconfig.json`
  - Copy configuration from `enhancedStrandsAgent` as template
  - _Requirements: 1.1, 6.1_

- [x] 1.2 Implement MaintenanceStrandsAgent Class Structure
  - Create `MaintenanceStrandsAgent` class in `maintenanceStrandsAgent.ts`
  - Implement constructor with modelId and s3Bucket parameters
  - Add private properties: modelId, s3Client, s3Bucket, maintenanceDataPath, availableEquipment
  - Add workflow tracking: maintenanceAuditTrail, methodologyDocumentation
  - Implement basic `processMessage()` method skeleton
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.3 Implement Maintenance Intent Detection
  - Create `intentDetection.ts` file
  - Implement `detectUserIntent()` method
  - Add pattern matching for maintenance query types: equipment_status, failure_prediction, maintenance_planning, inspection_schedule, maintenance_history, asset_health, preventive_maintenance
  - Add equipment ID extraction logic
  - Add method detection logic
  - Return MaintenanceIntent object with type, score, equipmentId, method
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 1.4 Write Intent Detection Unit Tests (REQUIRED)
  - Create `__tests__/intentDetection.test.ts`
  - Test equipment status query detection
  - Test failure prediction query detection
  - Test maintenance planning query detection
  - Test equipment ID extraction
  - Test ambiguous query handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 1.5 Create Maintenance Tools (MCP Pattern)
  - Create `tools/maintenanceTools.ts` file
  - Implement `equipmentStatusTool` with schema
  - Implement `failurePredictionTool` with schema
  - Implement `maintenancePlanningTool` with schema
  - Implement `inspectionScheduleTool` with schema
  - Implement `maintenanceHistoryTool` with schema
  - Export `maintenanceTools` array
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 1.6 Implement Handler Methods
  - Create `handlers/` directory with individual handler files
  - Implement `handleEquipmentStatus()` method
  - Implement `handleFailurePrediction()` method
  - Implement `handleMaintenancePlanning()` method
  - Implement `handleInspectionSchedule()` method
  - Implement `handleMaintenanceHistory()` method
  - Implement `handleAssetHealth()` method
  - Implement `handlePreventiveMaintenance()` method
  - Each handler should return MaintenanceResponse with success, message, artifacts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 1.7 Write Handler Unit Tests (REQUIRED)
  - Create test files for each handler in `__tests__/`
  - Test equipment status handler with valid equipment ID
  - Test failure prediction handler with mock data
  - Test maintenance planning handler with date ranges
  - Test error handling for missing equipment
  - Test error handling for invalid parameters
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.8 Create Lambda Handler
  - Implement `handler.ts` as Lambda entry point
  - Import MaintenanceStrandsAgent
  - Parse AppSync event
  - Extract userId, message, foundationModelId
  - Instantiate MaintenanceStrandsAgent
  - Call processMessage()
  - Return formatted response
  - Add error handling and logging
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.9 Create CDK Resource Definition
  - Create `resource.ts` with defineFunction
  - Configure function name: 'maintenanceAgent'
  - Set timeout: 300 seconds
  - Set memory: 1024 MB
  - Add environment variables: S3_BUCKET
  - Export maintenanceAgentFunction
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.10 Update Backend Configuration
  - Import maintenanceAgentFunction in `amplify/backend.ts`
  - Add to defineBackend() resources
  - Add S3 permissions for maintenance agent
  - Add Bedrock permissions for maintenance agent
  - Add CloudWatch logging permissions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.11 Update GraphQL Schema
  - Open `amplify/data/resource.ts`
  - Add `invokeMaintenanceAgent` query definition
  - Configure arguments: chatSessionId, message, foundationModelId
  - Set return type to match agent response format
  - Link to maintenanceAgentFunction handler
  - Add authentication requirement
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.12 Deploy and Test Backend
  - Run `npx ampx sandbox` to deploy changes
  - Verify maintenanceAgent Lambda is created
  - Check CloudWatch logs for initialization
  - Test invokeMaintenanceAgent mutation with simple query
  - Verify response format matches expected structure
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Agent Router Integration
  - Integrate the Maintenance agent into the routing system
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Update AgentRouter Class
  - Open `amplify/functions/agents/agentRouter.ts`
  - Import MaintenanceStrandsAgent
  - Add private property: `maintenanceAgent: MaintenanceStrandsAgent`
  - Initialize maintenanceAgent in constructor
  - Add logging for maintenance agent initialization
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Add Maintenance Intent Patterns
  - Update `determineAgentType()` method
  - Add maintenancePatterns array with regex patterns
  - Include patterns for: equipment failure, preventive maintenance, inspection schedule, equipment monitoring, maintenance planning, predictive maintenance, asset health
  - Test patterns against maintenance query examples
  - _Requirements: 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 2.3 Implement containsMaintenanceTerms() Method
  - Create private method `containsMaintenanceTerms(message: string): boolean`
  - Define maintenance term list: equipment, failure, maintenance, inspection, preventive, predictive, asset, health, monitoring, planning
  - Return true if any term is found in message
  - _Requirements: 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 2.4 Add Explicit Agent Selection Support
  - Update `routeQuery()` method signature to accept selectedAgent parameter
  - Add logic to check sessionContext.selectedAgent
  - If selectedAgent is 'maintenance', route directly to maintenance agent
  - If selectedAgent is set, skip automatic intent detection
  - Log explicit agent selection decisions
  - _Requirements: 2.3, 2.4, 3.4, 3.5_

- [x] 2.5 Add Maintenance Routing Case
  - In `routeQuery()` switch statement, add 'maintenance' case
  - Call `this.maintenanceAgent.processMessage(message)`
  - Return result with agentUsed: 'maintenance'
  - Add error handling for maintenance agent failures
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 2.6 Write Agent Router Tests
  - Create `__tests__/agentRouter.test.ts`
  - Test maintenance query routing
  - Test explicit agent selection
  - Test fallback to automatic routing
  - Test priority when multiple patterns match
  - Test error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.7 Deploy and Test Routing
  - Deploy updated AgentRouter
  - Test maintenance query: "What is the status of equipment PUMP-001?"
  - Verify it routes to maintenance agent
  - Test petrophysics query to ensure no regression
  - Test renewable query to ensure no regression
  - Check CloudWatch logs for routing decisions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Agent Switcher UI Component
  - Create the frontend component for agent selection
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3.1 Create AgentSwitcher Component
  - Create `src/components/AgentSwitcher.tsx`
  - Define AgentSwitcherProps interface
  - Implement functional component with SegmentedControl
  - Add four options: Auto (gen-ai icon), Petrophysics (analytics icon), Maintenance (settings icon), Renewables (environment icon)
  - Handle onChange event to call onAgentChange prop
  - Add disabled state support
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.2 Add Agent Selection State to Chat Page
  - Open `src/app/chat/[chatSessionId]/page.tsx`
  - Add state: `const [selectedAgent, setSelectedAgent] = useState<'auto' | 'petrophysics' | 'maintenance' | 'renewable'>('auto')`
  - Add handler: `const handleAgentChange = (agent) => { setSelectedAgent(agent); }`
  - Store selection in sessionStorage for persistence
  - Restore selection on page load
  - _Requirements: 3.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3.3 Integrate AgentSwitcher into Chat Interface
  - Import AgentSwitcher component
  - Add AgentSwitcher above or near the ChatBox component
  - Pass selectedAgent and handleAgentChange props
  - Style to match existing UI design
  - Test responsive behavior on mobile
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.4 Update Message Sending Logic
  - Modify sendMessage function to include selectedAgent
  - Pass selectedAgent in GraphQL mutation variables
  - Update mutation to accept agentType parameter
  - Backend should use agentType to route explicitly
  - _Requirements: 3.4, 3.5_

- [x] 3.5 Update GraphQL Mutation
  - Modify `invokeLightweightAgent` mutation (or create new unified mutation)
  - Add optional `agentType` parameter
  - Pass agentType to AgentRouter in sessionContext
  - AgentRouter uses agentType for explicit routing
  - _Requirements: 3.4, 3.5_

- [x] 3.6 Test Agent Switcher UI
  - Test switching between agents
  - Verify selection persists during session
  - Test auto mode falls back to routing
  - Test explicit selection overrides routing
  - Test UI on desktop and mobile
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Preloaded Maintenance Prompts
  - Add maintenance-specific workflow prompts to the UI
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.1 Design Maintenance Workflow Prompts
  - Create 5 maintenance workflow prompts:
    1. Equipment Health Assessment
    2. Failure Prediction Analysis
    3. Preventive Maintenance Planning
    4. Inspection Schedule Generation
    5. Asset Lifecycle Analysis
  - Write detailed prompt text for each
  - Define expected artifacts for each
  - _Requirements: 8.1, 8.4_

- [x] 4.2 Add Maintenance Prompts to Cards Component
  - Open `src/app/chat/[chatSessionId]/page.tsx`
  - Add maintenance prompts to the Cards items array
  - Include name, description, and prompt for each
  - Add agentType: 'maintenance' to each prompt object
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4.3 Implement Auto-Agent-Selection for Prompts
  - When a maintenance prompt is selected, automatically set selectedAgent to 'maintenance'
  - Update onSelectionChange handler to check prompt.agentType
  - Call setSelectedAgent(prompt.agentType) if present
  - _Requirements: 8.2, 8.3_

- [x] 4.4 Test Preloaded Prompts
  - Test each maintenance prompt
  - Verify agent is automatically set to maintenance
  - Verify prompt sends to maintenance agent
  - Verify expected artifacts are generated
  - Check for any errors in console
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5. Maintenance Artifacts and Visualizations
  - Create React components for rendering maintenance artifacts
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5.1 Create Maintenance Artifact Components Directory
  - Create `src/components/maintenance/` directory
  - Create placeholder files for each artifact type:
    - `EquipmentHealthArtifact.tsx`
    - `FailurePredictionArtifact.tsx`
    - `MaintenanceScheduleArtifact.tsx`
    - `InspectionReportArtifact.tsx`
    - `AssetLifecycleArtifact.tsx`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5.2 Implement EquipmentHealthArtifact Component
  - Create component to display equipment health scores
  - Use gauge chart or progress indicator
  - Show health score (0-100)
  - Display operational status
  - Show last maintenance date
  - Include expandable details section
  - _Requirements: 9.1_

- [x] 5.3 Implement FailurePredictionArtifact Component
  - Create component to display failure predictions
  - Use timeline chart showing risk over time
  - Display risk level (low, medium, high, critical)
  - Show time to failure estimate
  - List contributing factors with impact scores
  - Include recommendations section
  - _Requirements: 9.2_

- [x] 5.4 Implement MaintenanceScheduleArtifact Component
  - Create component to display maintenance schedules
  - Use Gantt-style chart for task timeline
  - Show task list with priorities
  - Display dependencies between tasks
  - Include cost and duration estimates
  - Add interactive task details on click
  - _Requirements: 9.3_

- [x] 5.5 Implement InspectionReportArtifact Component
  - Create component to display inspection data
  - Use trend charts for sensor readings
  - Highlight anomalies and outliers
  - Show inspection history
  - Display findings and recommendations
  - Include downloadable report option
  - _Requirements: 9.4_

- [x] 5.6 Implement AssetLifecycleArtifact Component
  - Create component to display asset lifecycle
  - Use timeline showing install date, maintenance events, current status
  - Display total cost of ownership
  - Show maintenance frequency trends
  - Include predictive end-of-life estimate
  - _Requirements: 9.5_

- [x] 5.7 Update ChatMessage Component
  - Open `src/components/ChatMessage.tsx`
  - Add imports for maintenance artifact components
  - Add switch cases for maintenance artifact types
  - Map messageContentType to appropriate component
  - Test artifact rendering
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5.8 Test Artifact Rendering
  - Test each artifact component with mock data
  - Verify charts render correctly
  - Test interactive features (expand, click, download)
  - Test responsive behavior
  - Check for console errors
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Error Handling and Edge Cases
  - Implement comprehensive error handling
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 6.1 Implement Error Categorization
  - Create `errorHandling.ts` utility file
  - Implement `categorizeError()` function
  - Define error categories: data_unavailable, calculation_failed, integration_error, unknown
  - Return error category based on error message patterns
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 6.2 Implement Error Message Generation
  - Create `generateErrorMessage()` function
  - Generate user-friendly messages for each error category
  - Include context-specific details
  - Avoid technical jargon
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 6.3 Implement Error Suggestions
  - Create `generateSuggestions()` function
  - Provide actionable suggestions for each error type
  - Suggest alternative queries or actions
  - Include links to documentation if applicable
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 6.4 Add Error Handling to Agent
  - Update MaintenanceStrandsAgent with try-catch blocks
  - Call error handling utilities on exceptions
  - Return properly formatted error responses
  - Log errors with sufficient context
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 6.5 Test Error Scenarios
  - Test missing equipment error
  - Test invalid parameter error
  - Test external service timeout
  - Test calculation failure
  - Verify error messages are clear
  - Verify suggestions are helpful
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 7. Documentation and Deployment
  - Create comprehensive documentation and deploy
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 7.1 Write Inline Code Documentation
  - Add JSDoc comments to all public methods
  - Document parameters and return types
  - Include usage examples
  - Document error conditions
  - _Requirements: 12.1_

- [ ] 7.2 Create Tool Documentation
  - Document each maintenance tool
  - Include purpose, parameters, return types
  - Provide usage examples
  - Document error conditions
  - _Requirements: 12.2_

- [ ] 7.3 Create Deployment Documentation
  - Write deployment guide in `docs/MAINTENANCE_AGENT_DEPLOYMENT.md`
  - Include prerequisites
  - Document deployment steps
  - Include verification steps
  - Document rollback procedure
  - _Requirements: 12.3_

- [ ] 7.4 Create Troubleshooting Guide
  - Write troubleshooting guide in `docs/MAINTENANCE_AGENT_TROUBLESHOOTING.md`
  - Document common issues and solutions
  - Include CloudWatch log analysis tips
  - Document debugging procedures
  - _Requirements: 12.4_

- [ ] 7.5 Create Extension Guide
  - Write extension guide in `docs/MAINTENANCE_AGENT_EXTENSION.md`
  - Document how to add new tools
  - Document how to add new handlers
  - Document how to add new artifact types
  - Include code examples
  - _Requirements: 12.5_

- [ ] 7.6 Final Deployment and Testing
  - Deploy complete system to production
  - Run full test suite
  - Verify all features work end-to-end
  - Monitor CloudWatch logs for errors
  - Conduct user acceptance testing
  - _Requirements: All_

- [ ] 7.7 Create User Guide
  - Write user guide for maintenance features
  - Include screenshots of agent switcher
  - Document preloaded prompts
  - Provide query examples
  - Include FAQ section
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## Notes

- All tasks including testing tasks are required for completion
- Each task should be completed and tested before moving to the next
- Deploy and test after completing each major phase
- Monitor CloudWatch logs throughout implementation
- Keep the existing Petrophysics and Renewable agents working during integration
- Follow the same patterns and conventions as the existing agents
- Prioritize code quality and maintainability over speed
- Testing is mandatory to ensure reliability and prevent regressions
