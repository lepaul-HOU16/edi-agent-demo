# Implementation Plan

- [x] 1. Create ProjectContext infrastructure
  - Create `src/contexts/ProjectContext.tsx` with ProjectContextProvider, useProjectContext hook, and ProjectInfo interface
  - Implement activeProject state management with setActiveProject function
  - Implement projectHistory state (max 10 items, most recent first)
  - Implement getProjectById helper function
  - Add sessionStorage persistence for activeProject
  - Add sessionStorage restoration on mount
  - Add comprehensive console logging for all context operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 2.5_

- [ ]* 1.1 Write property test for project history uniqueness
  - **Property 5: Project History Uniqueness**
  - **Validates: Requirements 2.4**

- [x] 2. Integrate ProjectContextProvider into ChatPage
  - Import ProjectContextProvider in `src/pages/ChatPage.tsx`
  - Wrap the chat interface components with ProjectContextProvider
  - Verify provider is accessible to all child components
  - Test that context is available in browser dev tools
  - _Requirements: 5.1_

- [ ]* 2.1 Write property test for context update propagation
  - **Property 4: Context Update Propagation**
  - **Validates: Requirements 5.2**

- [x] 3. Update artifact components to extract and set project context
  - [x] 3.1 Update TerrainMapArtifact
    - Import useProjectContext hook
    - Extract project info from data prop (projectId, projectName, location, coordinates)
    - Call setActiveProject in useEffect when data changes
    - Add console logging for context updates
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Update LayoutMapArtifact
    - Import useProjectContext hook
    - Extract project info from data prop
    - Call setActiveProject in useEffect when data changes
    - Add console logging for context updates
    - _Requirements: 1.1, 2.1_

  - [x] 3.3 Update WakeAnalysisArtifact
    - Import useProjectContext hook
    - Extract project info from data prop
    - Call setActiveProject in useEffect when data changes
    - Add console logging for context updates
    - _Requirements: 1.1, 2.1_

  - [x] 3.4 Update WindRoseArtifact
    - Import useProjectContext hook
    - Extract project info from data prop
    - Call setActiveProject in useEffect when data changes
    - Add console logging for context updates
    - _Requirements: 1.1, 2.1_

  - [x] 3.5 Update FinancialAnalysisArtifact
    - Import useProjectContext hook
    - Extract project info from data prop
    - Call setActiveProject in useEffect when data changes
    - Add console logging for context updates
    - _Requirements: 1.1, 2.1_

- [ ]* 3.6 Write property test for project context extraction
  - **Property 1: Project Context Extraction**
  - **Validates: Requirements 1.1, 2.1**

- [x] 4. Update WorkflowCTAButtons to use project context
  - Import useProjectContext hook
  - Read activeProject from context
  - Display active project name above buttons
  - Replace {project_id} placeholder with activeProject.projectId in button actions
  - Replace {project_name} placeholder with activeProject.projectName in button actions
  - Disable buttons when activeProject is null
  - Add tooltip showing full action with project name
  - Add console logging for button clicks with project context
  - Show Alert when no active project is set
  - _Requirements: 1.3, 2.2, 3.1, 3.2, 3.3_

- [ ]* 4.1 Write property test for button query generation
  - **Property 2: Button Query Generation**
  - **Validates: Requirements 1.3, 2.2**

- [x] 5. Update ProjectDashboardArtifact to set active project
  - Import useProjectContext hook
  - In handleAction function, extract project info when action is 'continue' or 'view'
  - Call setActiveProject with extracted project info
  - Add console logging for project context updates
  - Update "Continue" button to show it will set the project as active
  - _Requirements: 1.2, 2.3, 2.4_

- [x] 6. Add prerequisite validation to workflow buttons
  - Create helper function to check if prerequisites are met for each workflow step
  - Check for terrain data before allowing layout generation
  - Check for layout data before allowing wake simulation
  - Check for simulation data before allowing wind rose generation
  - Disable buttons when prerequisites are missing
  - Show tooltip explaining missing prerequisites
  - Add console logging for prerequisite checks
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Add visual feedback and error handling
  - Add Alert component when no active project is set
  - Add Badge showing active project in workflow button area
  - Add error boundary around ProjectContext consumers
  - Add try-catch around sessionStorage operations
  - Add fallback behavior when sessionStorage is unavailable
  - Add console warnings for malformed project data
  - Add user-friendly error messages for common issues
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 7.1 Write unit tests for error handling
  - Test missing project context scenario
  - Test invalid project data scenario
  - Test sessionStorage failure scenario
  - _Requirements: Error Handling section_

- [x] 8. Add comprehensive logging and debugging support
  - Add emoji-prefixed console logs for all project context operations
  - Add logging for setActiveProject calls
  - Add logging for button clicks with project context
  - Add logging for artifact project extraction
  - Add logging for prerequisite validation
  - Add logging for sessionStorage operations
  - Create debug helper function to dump current project context state
  - _Requirements: 5.5_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Write integration tests
  - Write end-to-end workflow test (terrain → layout → simulation)
  - Write multi-project switching test
  - Write session persistence test
  - _Requirements: Testing Strategy section_

- [ ]* 10.1 Write property test for context persistence
  - **Property 3: Context Persistence**
  - **Validates: Requirements 2.5**

- [x] 11. Final verification and cleanup
  - Test complete workflow with multiple projects
  - Verify buttons execute on correct project
  - Verify project context persists across page reloads
  - Verify visual feedback is clear and helpful
  - Remove any debug code or temporary logging
  - Update documentation with new ProjectContext usage
  - _Requirements: All_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Update backend Lambda functions to accept projectContext
  - [x] 13.1 Update chat handler to extract projectContext from request body
    - Extract projectContext from body in handler.ts
    - Pass projectContext to convertToAppSyncEvent function
    - Add projectContext to AppSync event arguments
    - _Requirements: 1.3, 2.2_
  
  - [x] 13.2 Update agent handler to receive and use projectContext
    - Extract projectContext from event.arguments
    - Add projectContext to sessionContext passed to router.routeQuery
    - Add logging for projectContext in agent handler
    - _Requirements: 1.3, 2.2_
  
  - [x] 13.3 Deploy backend changes
    - Run `cd cdk && npm run deploy`
    - Verify Lambda functions updated successfully
    - Test end-to-end workflow with projectContext
    - _Requirements: All_

- [x] 14. Final deployment and verification
  - Deploy frontend with `./deploy-frontend.sh`
  - Test complete workflow in production
  - Verify projectContext flows from frontend to backend
  - Verify workflow buttons work with correct project context
  - _Requirements: All_
