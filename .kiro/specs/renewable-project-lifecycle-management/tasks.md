# Implementation Plan

- [x] 1. Create ProximityDetector module
  - Implement Haversine distance calculation for coordinate proximity
  - Create method to find projects within specified radius
  - Add grouping logic for duplicate detection
  - _Requirements: 1.1, 1.2, 1.6, 4.1_

- [x] 2. Create ProjectLifecycleManager core class
  - Define TypeScript interfaces for all result types
  - Implement constructor with dependencies (ProjectStore, ProjectResolver, etc.)
  - Add error handling utilities and error message templates
  - _Requirements: All_

- [x] 3. Implement deduplication detection
  - Add checkForDuplicates method using ProximityDetector
  - Implement user prompt generation for duplicate scenarios
  - Add logic to handle user choice (continue/create_new/view_details)
  - Integrate with terrain analysis flow in orchestrator
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Implement single project deletion
  - Add deleteProject method with confirmation logic
  - Implement project existence validation
  - Add in-progress project check
  - Implement S3 deletion via ProjectStore
  - Update session context when active project deleted
  - Clear resolver cache after deletion
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

- [x] 5. Implement bulk project deletion
  - Add deleteBulk method with pattern matching
  - Implement confirmation with project list display
  - Add batch deletion with Promise.allSettled
  - Handle partial failures gracefully
  - _Requirements: 2.6, 4.1, 4.2, 4.5, 4.6_

- [x] 6. Implement project renaming
  - Add renameProject method with validation
  - Check old project exists and new name available
  - Implement S3 path update (save new, delete old)
  - Update session context active project
  - Update project history in session
  - Clear resolver cache after rename
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 7. Implement project search and filtering
  - Add searchProjects method with SearchCriteria interface
  - Implement location name filtering
  - Add date range filtering (created_at)
  - Implement incomplete project filtering
  - Add coordinate proximity filtering
  - Implement archived status filtering
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Implement duplicate finder
  - Add findDuplicates method using ProximityDetector
  - Group projects by location within 1km radius
  - Filter to only groups with 2+ projects
  - Format results for user display
  - _Requirements: 4.1, 4.2_

- [x] 9. Implement project merging
  - Add mergeProjects method with validation
  - Load both projects and validate existence
  - Implement data merge logic (keep most complete)
  - Save merged project and delete other
  - Clear resolver cache after merge
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 10. Implement archive/unarchive functionality
  - Add archiveProject method
  - Add unarchiveProject method
  - Update ProjectStore to handle archived flag
  - Filter archived projects from default listings
  - Clear active project when archiving
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 11. Implement export/import functionality
  - Add exportProject method to generate ExportData
  - Include project data and artifact S3 keys
  - Add importProject method with validation
  - Handle name conflicts during import
  - Validate export format version
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Add lifecycle intent patterns to orchestrator
  - Define regex patterns for delete, rename, merge, archive, export commands
  - Add intent detection logic in renewable orchestrator
  - Route lifecycle commands to ProjectLifecycleManager
  - Handle natural language variations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 13. Integrate deduplication into terrain analysis flow
  - Modify terrain handler to check for duplicates before creating project
  - Present duplicate options to user via chat interface
  - Handle user response and route accordingly
  - Update session context with chosen project
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 14. Create project dashboard artifact (optional UI enhancement)
  - Design dashboard artifact component
  - Display project list with status indicators
  - Add completion percentage calculation
  - Highlight duplicate projects
  - Show active project marker
  - Add quick action buttons
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 15. Add confirmation dialog handling in chat interface
  - Implement confirmation state management
  - Display confirmation prompts with options
  - Handle user confirmation responses
  - Route confirmed actions back to lifecycle manager
  - _Requirements: 2.1, 2.6, 4.2, 4.4_

- [x] 16. Update ProjectStore schema for new fields
  - Add archived boolean field
  - Add archived_at timestamp field
  - Add imported_at timestamp field
  - Add status field for in_progress tracking
  - Update save/load methods to handle new fields
  - _Requirements: 2.7, 8.1, 9.5_

- [x] 17. Add error message templates for lifecycle operations
  - Create error message constants
  - Implement user-friendly error formatting
  - Add context-specific error messages
  - Include suggested next actions in errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 18. Deploy and test deduplication flow
  - Deploy updated orchestrator and lifecycle manager
  - Test duplicate detection with same coordinates
  - Verify user prompt displays correctly
  - Test all three user choices (continue/create/view)
  - Verify session context updates correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 19. Deploy and test deletion operations
  - Test single project deletion with confirmation
  - Test bulk deletion with pattern matching
  - Verify S3 objects are removed
  - Test deletion of active project clears session
  - Verify in-progress projects cannot be deleted
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 20. Deploy and test rename operations
  - Test project rename with valid names
  - Test rename with existing name (should fail)
  - Verify S3 path updates correctly
  - Test session context updates
  - Verify project history updates
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 21. Deploy and test search functionality
  - Test location filtering
  - Test date range filtering
  - Test incomplete project filtering
  - Test coordinate proximity filtering
  - Test archived status filtering
  - Test combined filters
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 22. Deploy and test merge operations
  - Test merging two projects
  - Verify data combination logic
  - Test name selection
  - Verify one project deleted after merge
  - Test with projects having different completion levels
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 23. Deploy and test archive functionality
  - Test archiving a project
  - Verify archived projects hidden from default list
  - Test unarchiving a project
  - Verify active project cleared when archiving
  - Test listing archived projects explicitly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 24. Deploy and test export/import
  - Test exporting a project
  - Verify export includes all data and artifact keys
  - Test importing a project
  - Test import with name conflict
  - Verify imported project is functional
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 25. End-to-end user workflow testing
  - Test complete workflow: create duplicate → detect → delete old → rename new
  - Test search → find duplicates → merge workflow
  - Test natural language command variations
  - Verify all confirmation prompts work correctly
  - Test error scenarios and error messages
  - _Requirements: All_

