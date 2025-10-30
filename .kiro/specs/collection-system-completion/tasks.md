# Implementation Plan

- [x] 1. Fix Collection Manager Pagination and Display
  - Fix the pagination bug where only 3 collections show at a time
  - Implement proper state management to prevent collections from being dropped
  - Add pagination controls with 10 items per page
  - Ensure new collections are added without removing existing ones
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.1 Update collection state management in collections page
  - Replace array splicing with full array replacement in loadCollections
  - Add proper pagination state (currentPage, totalCollections, ITEMS_PER_PAGE)
  - Implement pagination calculation (startIndex, endIndex, paginatedCollections)
  - Add page reset logic when collections are added or removed
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.2 Add Cloudscape Pagination component to collections page
  - Import and configure Pagination component
  - Connect pagination to state (currentPage, pagesCount)
  - Handle page change events
  - Display current page and total pages
  - _Requirements: 3.2_

- [x] 2. Enhance Collection Creation Modal Responsiveness
  - Update modal to use 60% viewport width (90% on mobile)
  - Center modal horizontally
  - Add 100px top and bottom margins from viewport
  - Implement responsive behavior for different screen sizes
  - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Create responsive modal styling
  - Add CSS for 60% width with centering
  - Implement calc(100vh - 200px) max height
  - Add mobile breakpoint for 90% width
  - Test on fullscreen and various viewport sizes
  - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.2 Update catalog page modal integration
  - Modify showCreateCollectionModal state handling
  - Pass proper props to modal component
  - Ensure modal opens on "create collection" prompt detection
  - Test modal behavior in catalog context
  - _Requirements: 1.1, 1.4_

- [x] 3. Implement Navigation Integration
  - Add "View All Collections" to Data Catalog menu
  - Add "View All Canvases" to Workspace menu
  - Update TopNavigation component in layout.tsx
  - Test navigation links work correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.1 Update TopNavigation Data Catalog menu
  - Add "View All Collections" menu item with folder icon
  - Set href to /collections
  - Position after "View All Data" item
  - Test menu item appears and navigates correctly
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Update TopNavigation Workspace menu
  - Add "View All Canvases" menu item with view-full icon
  - Set href to /canvases
  - Position at top of Workspace menu
  - Test menu item appears and navigates correctly
  - _Requirements: 2.3_

- [x] 4. Create Canvas List Page (View All Canvases)
  - Create new page at src/app/canvases/page.tsx
  - Implement canvas card display with /listChats styling
  - Add collection filter dropdown
  - Implement pagination with 25 items per page
  - _Requirements: 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Create canvases page component structure
  - Set up page component with auth protection
  - Add state for canvases, selectedCollection, currentPage
  - Implement canvas loading from ChatSession model
  - Add loading and error states
  - _Requirements: 2.3, 5.1_

- [x] 4.2 Implement collection filter dropdown
  - Add Select component with "All Collections" option
  - Load collections for dropdown options
  - Filter canvases by selected collection
  - Reset to page 1 when filter changes
  - _Requirements: 2.4, 2.5_

- [x] 4.3 Add canvas card display with pagination
  - Use Cards component with /listChats card definition
  - Display canvas name, creation date, linked collection
  - Implement pagination with 25 items per page
  - Add click handler to navigate to canvas
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5. Implement Collection Detail Page Navigation
  - Update collection creation to navigate to detail page
  - Modify handleCreateCollection to use router.push
  - Pass collection ID to detail page route
  - Test navigation after collection creation
  - _Requirements: 1.5_

- [x] 5.1 Update collection creation success handler
  - Import and use Next.js router
  - Extract collection ID from creation response
  - Navigate to /collections/[collectionId] on success
  - Handle navigation errors gracefully
  - _Requirements: 1.5_

- [x] 6. Enhance Collection Detail Page with Canvas Display
  - Update collection detail view to show linked canvases
  - Implement canvas pagination (25 per page) within collection
  - Use /listChats card styling for canvas cards
  - Add "Create New Canvas" button
  - _Requirements: 3.4, 3.5, 5.2, 5.5_

- [x] 6.1 Add canvas list section to collection detail page
  - Query ChatSession model filtered by linkedCollectionId
  - Display canvas cards with proper styling
  - Implement pagination for canvases
  - Show empty state when no canvases linked
  - _Requirements: 3.4, 3.5, 5.2_

- [x] 6.2 Add canvas creation from collection
  - Add "Create New Canvas" button to collection detail
  - Create new ChatSession with linkedCollectionId
  - Navigate to new canvas immediately
  - Ensure collection context is set
  - _Requirements: 5.5_

- [x] 7. Implement Data Context Inheritance
  - Enhance collectionContextLoader service
  - Add context loading for canvas creation
  - Implement context validation in agent handlers
  - Add context caching in ChatSession model
  - _Requirements: 4.1, 4.2, 4.4, 6.4_

- [x] 7.1 Enhance collectionContextLoader service
  - Add loadCanvasContext method
  - Implement validateDataAccess method
  - Add context caching with 30-minute TTL
  - Test context loading and validation
  - _Requirements: 4.1, 4.4, 6.4_

- [x] 7.2 Update canvas creation to set collection context
  - Modify create-new-chat to accept collectionId parameter
  - Set linkedCollectionId when creating from collection
  - Load and cache collection context in ChatSession
  - Test context is properly set on creation
  - _Requirements: 4.1, 5.5_

- [x] 7.3 Integrate context validation in agent handlers
  - Update agent handler to check linkedCollectionId
  - Load collection context before processing query
  - Pass data context to agent configuration
  - Test agent respects data context limits
  - _Requirements: 4.2_

- [x] 8. Implement Data Access Approval Flow
  - Add data access violation detection
  - Create approval prompt message
  - Implement user approval handling
  - Log approved expansions
  - _Requirements: 4.3, 4.4_

- [x] 8.1 Add data access violation detection
  - Implement onDataAccessViolation handler in agent config
  - Detect when agent requests out-of-scope data
  - Create approval request message
  - Send message to chat interface
  - _Requirements: 4.3_

- [x] 8.2 Implement approval handling in chat interface
  - Detect "approve" keyword in user responses
  - Process approval and allow expanded access
  - Log approval in ChatSession dataAccessLog
  - Display confirmation message
  - _Requirements: 4.3, 4.4_

- [x] 9. Update GraphQL Schema for Collection Features
  - Add dataAccessLog field to ChatSession model
  - Ensure linkedCollectionId and collectionContext are properly defined
  - Update collection mutations to support new features
  - Test schema changes deploy correctly
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 9.1 Update ChatSession model in data/resource.ts
  - Add dataAccessLog as json array field
  - Verify linkedCollectionId and collectionContext fields
  - Add authorization rules
  - Test model updates
  - _Requirements: 6.3, 6.4_

- [x] 9.2 Enhance collection service backend
  - Update collectionManagement mutation to handle new operations
  - Add getCollectionById operation
  - Add linkCanvasToCollection operation
  - Test backend operations
  - _Requirements: 6.5_

- [x] 10. Implement Collection Context Display in Canvas
  - Add collection badge/indicator to canvas interface
  - Display collection name and data scope
  - Show data context limits to user
  - Add link to view collection details
  - _Requirements: 4.5_

- [x] 10.1 Add collection context indicator to chat interface
  - Create CollectionContextBadge component
  - Display collection name and item count
  - Add icon and styling
  - Position in chat header
  - _Requirements: 4.5_

- [x] 10.2 Add collection details link
  - Make badge clickable to view collection
  - Navigate to collection detail page
  - Show tooltip with data scope info
  - Test navigation works correctly
  - _Requirements: 4.5_

- [x] 11. Prepare for /listChats Replacement
  - Add redirect from /listChats to /canvases
  - Update internal links to use /canvases
  - Add migration notice for users
  - Test redirect works correctly
  - _Requirements: 8.1, 8.2_

- [x] 11.1 Add redirect in listChats page
  - Import Next.js redirect
  - Add redirect to /canvases at page load
  - Keep page as fallback for now
  - Test redirect works
  - _Requirements: 8.1_

- [x] 11.2 Update internal navigation links
  - Find all references to /listChats
  - Update to /canvases
  - Update documentation
  - Test all links work
  - _Requirements: 8.2_

- [x] 12. Add comprehensive testing
  - Write unit tests for pagination logic
  - Write integration tests for collection creation flow
  - Write E2E tests for complete user workflow
  - Test responsive behavior on multiple devices
  - _Requirements: All_

- [x] 12.1 Write unit tests for pagination
  - Test page calculation with various item counts
  - Test boundary conditions
  - Test page reset on filter change
  - Test state preservation
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 12.2 Write integration tests for collection flow
  - Test collection creation from catalog
  - Test navigation to collection detail
  - Test canvas creation from collection
  - Test data context inheritance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 5.5_

- [x] 12.3 Write E2E tests for complete workflow
  - Test catalog search → collection creation → canvas creation → AI query
  - Test data context limits and approval flow
  - Test pagination across all views
  - Test responsive behavior
  - _Requirements: All_

- [x] 13. Deploy and Validate
  - Deploy all changes to sandbox environment
  - Test all features end-to-end
  - Verify no regressions in existing functionality
  - Get user validation
  - _Requirements: All_

- [x] 13.1 Deploy to sandbox
  - Run npx ampx sandbox
  - Wait for deployment completion
  - Verify all Lambda functions deployed
  - Check CloudWatch logs for errors
  - _Requirements: All_

- [x] 13.2 End-to-end validation
  - Test collection creation from catalog
  - Test pagination in collection manager
  - Test canvas creation and linking
  - Test data context enforcement
  - Test navigation integration
  - _Requirements: All_

- [x] 13.3 User acceptance testing
  - Have user test complete workflow
  - Verify modal responsiveness in fullscreen
  - Verify pagination shows all collections
  - Verify data context limits work
  - Get user sign-off
  - _Requirements: All_
