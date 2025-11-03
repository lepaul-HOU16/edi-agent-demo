# Implementation Plan

- [x] 1. Add dashboard detection method to ProjectListHandler
  - Create `isProjectDashboardQuery()` static method with dashboard-specific patterns
  - Test patterns match "show my project dashboard", "project dashboard", "dashboard"
  - Ensure patterns do NOT match "list my projects" or action queries
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement dashboard artifact generation
  - [x] 2.1 Create `generateDashboardArtifact()` method in ProjectListHandler
    - Load all projects from ProjectStore
    - Get active project from SessionContextManager
    - Calculate completion percentage for each project
    - Format location strings from coordinates
    - Determine project status labels
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.2 Implement duplicate detection algorithm
    - Create `detectDuplicates()` private method
    - Calculate distance between project coordinates using Haversine formula
    - Group projects within 1km radius
    - Return duplicate groups with location and project list
    - _Requirements: 2.3_

  - [x] 2.3 Create artifact structure
    - Build `project_dashboard` artifact with type and data
    - Include projects array with all required fields
    - Include duplicate groups array
    - Include active project marker
    - Return artifact in response
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update orchestrator to handle dashboard queries
  - Add dashboard query check before project list check in handler.ts
  - Call `ProjectListHandler.isProjectDashboardQuery()` to detect dashboard intent
  - Call `projectListHandler.generateDashboardArtifact()` when dashboard detected
  - Return response with artifacts array (not text-only)
  - Add thought steps for dashboard generation
  - _Requirements: 2.1, 2.5_

- [x] 4. Add frontend artifact rendering
  - Import ProjectDashboardArtifact component in ChatMessage.tsx
  - Add case for 'project_dashboard' artifact type in renderArtifact()
  - Pass artifact data to ProjectDashboardArtifact component
  - Implement onAction callback for dashboard actions (view, continue, rename, delete)
  - Handle action button clicks by sending appropriate queries
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Preserve backward compatibility
  - Ensure `isProjectListQuery()` still works for text-only responses
  - Verify "list my projects" returns text (not artifact)
  - Verify "show project {name}" returns text details
  - Test that action verbs don't trigger list or dashboard handlers
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Add helper methods for data formatting
  - Create `formatLocation()` method to format coordinates
  - Create `calculateCompletionPercentage()` method
  - Create `isProjectDuplicate()` method to check if project is in duplicate groups
  - Create `getProjectStatusLabel()` method
  - Create `calculateDistance()` method for Haversine formula
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Write unit tests for dashboard detection
  - Test `isProjectDashboardQuery()` with "show my project dashboard"
  - Test with "project dashboard", "dashboard", "view dashboard"
  - Test that "list my projects" returns false
  - Test that "analyze terrain" returns false
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Write unit tests for artifact generation
  - Test `generateDashboardArtifact()` with multiple projects
  - Test completion percentage calculation (0%, 25%, 50%, 75%, 100%)
  - Test duplicate detection with projects at same location
  - Test duplicate detection with projects 0.5km apart
  - Test duplicate detection with projects 2km apart
  - Test active project marking
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3_

- [x] 9. Write integration tests for end-to-end flow
  - Test sending "show my project dashboard" query
  - Verify artifact is generated (not text)
  - Verify artifact contains all projects
  - Test backward compatibility with "list my projects"
  - Verify text response for list query
  - _Requirements: 3.1, 4.1, 4.2_

- [x] 10. Write manual test scenarios
  - Create test script to populate 5+ projects with varying completion
  - Test dashboard display with all projects
  - Test sorting by name, date, location, completion
  - Test action buttons (view, continue, rename, delete)
  - Test duplicate detection with 2 projects at same coordinates
  - Test active project marker
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.5_

- [x] 11. Deploy and validate
  - Deploy backend changes to sandbox
  - Verify dashboard artifact generation in CloudWatch logs
  - Deploy frontend changes
  - Test in browser with real projects
  - Verify no console errors
  - Validate action buttons work correctly
  - _Requirements: All_
