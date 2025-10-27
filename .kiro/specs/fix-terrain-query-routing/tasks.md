# Implementation Plan

## Overview
Fix the critical routing bug where terrain analysis queries are incorrectly matched by project listing patterns. The fix involves adding word boundaries to regex patterns and implementing safety checks.

## Tasks

- [x] 1. Fix ProjectListHandler pattern matching
  - Update `isProjectListQuery()` method with word boundaries
  - Add action verb safety check
  - Add enhanced logging for debugging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 4.1, 4.2, 4.3_

- [x] 1.1 Add word boundaries to project list patterns
  - Replace `/list.*my.*projects?/i` with `/\blist\b.*\bmy\b.*\bprojects?\b/i`
  - Replace `/show.*my.*projects?/i` with `/\bshow\b.*\bmy\b.*\bprojects?\b/i`
  - Apply word boundaries to all 7 patterns in `isProjectListQuery()`
  - _Requirements: 2.1, 2.2_

- [x] 1.2 Implement action verb safety check
  - Create array of action verbs: ['analyze', 'optimize', 'simulate', 'generate', 'create', 'run', 'perform']
  - Check if query contains any action verb before returning true
  - Return false if action verb is present
  - _Requirements: 1.5, 2.3_

- [x] 1.3 Add detailed logging to isProjectListQuery
  - Log the incoming query
  - Log each pattern test result
  - Log which pattern matched (if any)
  - Log action verb check result
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Fix ProjectDetailsQuery pattern matching
  - Update `isProjectDetailsQuery()` method with word boundaries
  - Add "project" keyword requirement check
  - Add enhanced logging
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [x] 2.1 Add word boundaries to project details patterns
  - Replace `/show.*project\s+([a-z0-9-]+)/i` with `/\bshow\b.*\bproject\b\s+([a-z0-9-]+)/i`
  - Apply word boundaries to all 6 patterns
  - _Requirements: 2.1_

- [x] 2.2 Add "project" keyword requirement
  - Check if query contains "project" keyword
  - Return false immediately if not present
  - _Requirements: 2.2_

- [x] 2.3 Add logging to isProjectDetailsQuery
  - Log the incoming query
  - Log pattern match results
  - Log extracted project name
  - _Requirements: 4.1, 4.2_

- [x] 3. Create unit tests for pattern matching
  - Test legitimate project list queries match correctly
  - Test terrain analysis queries do NOT match
  - Test other renewable queries do NOT match
  - Test project details queries with project names
  - _Requirements: 3.1, 3.2_

- [x] 3.1 Write unit tests for isProjectListQuery
  - Test valid queries: "list my projects", "show my renewable projects"
  - Test terrain queries: "Analyze terrain at coordinates X, Y"
  - Test other renewable queries: "optimize layout", "run simulation"
  - Verify action verb safety check works
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Write unit tests for isProjectDetailsQuery
  - Test valid queries: "show project claude-texas-wind-farm-10"
  - Test queries without "project" keyword
  - Test queries without project name
  - Verify project name extraction
  - _Requirements: 3.1, 3.2_

- [x] 4. Create integration tests for orchestrator routing
  - Test terrain analysis routes to terrain tool
  - Test project list routes to project list handler
  - Test project details routes correctly
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.1 Write integration test for terrain analysis routing
  - Create test event with terrain query
  - Invoke orchestrator handler
  - Verify routes to terrain tool (not project list)
  - Verify artifacts are terrain analysis type
  - _Requirements: 3.1_

- [x] 4.2 Write integration test for project list routing
  - Create test event with project list query
  - Invoke orchestrator handler
  - Verify routes to project list handler
  - Verify response contains project list
  - _Requirements: 3.2_

- [x] 5. Create E2E test through RenewableProxyAgent
  - Test full flow from proxy agent to orchestrator
  - Verify terrain analysis works end-to-end
  - Verify project listing works end-to-end
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.1 Write E2E test for terrain analysis
  - Create RenewableProxyAgent instance
  - Call processQuery with terrain analysis query
  - Verify response contains terrain artifacts
  - Verify response does NOT contain project list
  - _Requirements: 3.1_

- [x] 5.2 Write E2E test for project listing
  - Create RenewableProxyAgent instance
  - Call processQuery with project list query
  - Verify response contains project list
  - Verify response does NOT contain terrain artifacts
  - _Requirements: 3.2_

- [x] 6. Manual testing and validation
  - Test with exact problematic query from user
  - Test with various terrain analysis queries
  - Test with various project list queries
  - Verify CloudWatch logs show correct routing
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3_

- [x] 6.1 Test problematic query
  - Submit "Analyze terrain at coordinates 35.067482, -101.395466 in Texas"
  - Verify routes to terrain analysis (not project list)
  - Verify returns terrain artifacts
  - Check CloudWatch logs for routing decision
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6.2 Test legitimate project list queries
  - Submit "list my renewable projects"
  - Submit "show my projects"
  - Verify both route to project list handler
  - Verify return project lists
  - _Requirements: 1.3, 3.2_

- [x] 6.3 Verify no regressions
  - Test all renewable energy query types
  - Verify terrain, layout, simulation, report all work
  - Verify project management queries still work
  - Check for any unexpected routing
  - _Requirements: 3.3, 3.4_

- [x] 7. Deploy and monitor
  - Deploy to sandbox environment
  - Monitor CloudWatch logs for routing decisions
  - Test with real user queries
  - Verify success metrics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7.1 Deploy to sandbox
  - Run `npx ampx sandbox`
  - Wait for deployment to complete
  - Verify all Lambdas deployed successfully
  - _Requirements: 1.1_

- [x] 7.2 Monitor and validate
  - Submit test queries through UI
  - Check CloudWatch logs for pattern matching
  - Verify routing decisions are correct
  - Confirm no false positives or negatives
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

## Notes

- This is a critical bug fix that should be deployed immediately
- The fix is minimal and surgical - only pattern matching changes
- No architecture changes required
- All tests should pass before deployment
- Monitor CloudWatch logs closely after deployment
