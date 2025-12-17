# Implementation Plan

- [x] 1. Create DynamoDB Sessions Table
  - Create CDK construct for Sessions table
  - Define schema: sessionId (PK), owner, name, linkedCollectionId, collectionContext, createdAt, updatedAt
  - Add GSI: owner-createdAt-index for listing user sessions
  - Configure TTL attribute for auto-cleanup (90 days)
  - _Requirements: 5.1, 5.3_

- [x] 2. Implement Sessions Lambda Handler
  - [x] 2.1 Create handler file and basic structure
    - Create `cdk/lambda-functions/sessions/handler.ts`
    - Define Session and request/response interfaces
    - Set up DynamoDB client
    - Implement error handling utilities
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.2 Implement POST /api/sessions/create endpoint
    - Parse request body (name, linkedCollectionId)
    - Generate unique sessionId
    - Create session record in DynamoDB
    - Return session data with success status
    - _Requirements: 1.1, 8.1_

  - [x] 2.3 Implement GET /api/sessions/{id} endpoint
    - Extract sessionId from path
    - Query DynamoDB for session
    - Return 404 if not found
    - Return session data with linkedCollectionId
    - _Requirements: 1.3, 5.4, 8.2_

  - [x] 2.4 Implement PUT /api/sessions/{id} endpoint
    - Extract sessionId from path
    - Parse update data (name, linkedCollectionId, collectionContext)
    - Update session in DynamoDB
    - Return updated session data
    - _Requirements: 8.3_

  - [x] 2.5 Implement DELETE /api/sessions/{id} endpoint
    - Extract sessionId from path
    - Delete session from DynamoDB
    - Return success message
    - _Requirements: 8.4_

  - [x] 2.6 Implement GET /api/sessions/list endpoint
    - Query DynamoDB using owner GSI
    - Filter by current user
    - Return array of sessions
    - _Requirements: 8.5_

  - [ ]* 2.7 Write property test for session persistence
    - **Property 1: Session-Collection Link Persistence**
    - **Validates: Requirements 1.1, 1.2, 1.3, 5.1, 5.2, 5.4**

- [x] 3. Configure API Gateway Routes
  - Add POST /api/sessions/create route
  - Add GET /api/sessions/{id} route
  - Add PUT /api/sessions/{id} route
  - Add DELETE /api/sessions/{id} route
  - Add GET /api/sessions/list route
  - Configure CORS for all routes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [-] 4. Implement Session API Client
  - [x] 4.1 Create sessions API client file
    - Create `src/lib/api/sessions.ts`
    - Define TypeScript interfaces matching backend
    - Import apiPost, apiGet, apiPut, apiDelete from client
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.2 Implement createSession function
    - Call POST /api/sessions/create
    - Handle response parsing
    - Return session data with sessionId
    - _Requirements: 1.1, 8.1_

  - [x] 4.3 Implement getSession function
    - Call GET /api/sessions/{id}
    - Handle 404 errors
    - Return session with linkedCollectionId
    - _Requirements: 1.3, 8.2_

  - [x] 4.4 Implement updateSession function
    - Call PUT /api/sessions/{id}
    - Handle partial updates
    - Return updated session
    - _Requirements: 8.3_

  - [x] 4.5 Implement deleteSession function
    - Call DELETE /api/sessions/{id}
    - Return success status
    - _Requirements: 8.4_

  - [x] 4.6 Implement listSessions function
    - Call GET /api/sessions/list
    - Return array of sessions
    - _Requirements: 8.5_

  - [ ]* 4.7 Write unit tests for API client
    - Test all API functions
    - Test error handling
    - Test request/response parsing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Update Collection Context Loader
  - [x] 5.1 Remove placeholder code
    - Remove all `console.warn()` statements
    - Remove `return null` placeholders
    - Implement actual session API calls
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Implement getChatSession using REST API
    - Call getSession() from sessions API
    - Return session with linkedCollectionId
    - Handle errors gracefully
    - _Requirements: 1.3, 5.4_

  - [x] 5.3 Implement loadCanvasContext
    - Accept chatSessionId and optional collectionId
    - Get session to find linkedCollectionId
    - Load collection data via getCollection()
    - Build and cache collection context
    - _Requirements: 2.1, 2.2, 4.1, 9.1_

  - [x] 5.4 Add error handling
    - Handle session not found
    - Handle collection not found
    - Handle API failures
    - Return null with clear error messages
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 5.5 Write property test for context completeness
    - **Property 2: Collection Context Completeness**
    - **Validates: Requirements 2.1, 2.2, 3.1, 3.2**

- [x] 6. Update Collection Inheritance Utils
  - [x] 6.1 Implement getCanvasCollectionContext
    - Call getSession() to get linkedCollectionId
    - Call getCollection() to load collection data
    - Transform to CollectionData format
    - Return collection data or null
    - _Requirements: 2.1, 2.2, 4.1_

  - [x] 6.2 Add error handling
    - Handle session not found
    - Handle collection deleted (broken link)
    - Log errors with context
    - Return null gracefully
    - _Requirements: 1.5, 10.1_

  - [ ]* 6.3 Write unit tests for inheritance utils
    - Test getCanvasCollectionContext with valid session
    - Test with invalid session
    - Test with broken collection link
    - Test getWellFilePaths
    - Test getCollectionSummary
    - _Requirements: 1.5, 2.1, 2.2, 3.4, 10.1_

- [x] 7. Update CreateNewChatPage
  - [x] 7.1 Accept collectionId query parameter
    - Use useSearchParams to get collectionId
    - Pass to session creation
    - _Requirements: 1.1_

  - [x] 7.2 Create session with linkedCollectionId
    - Call createSession() with linkedCollectionId
    - Handle creation errors
    - Navigate to new canvas
    - _Requirements: 1.1, 1.2_

  - [x] 7.3 Load and cache collection context
    - Call loadCanvasContext() after session creation
    - Cache context in session via updateSession()
    - Handle load failures gracefully
    - _Requirements: 2.1, 9.1_

  - [ ]* 7.4 Write integration test for canvas creation
    - Test creating canvas from collection
    - Verify session has linkedCollectionId
    - Verify context loads correctly
    - _Requirements: 1.1, 1.2, 2.1_

- [x] 8. Update ChatPage for Context Display
  - [x] 8.1 Load collection context on mount
    - Get session data including linkedCollectionId
    - Call getCanvasCollectionContext() if linked
    - Store in collectionContext state
    - Show loading state while fetching
    - _Requirements: 2.1, 4.1_

  - [x] 8.2 Display collection context alert
    - Show Alert component with collection name
    - Display well count and data sources
    - Add "View Collection" button
    - Show file access info for S3 collections
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.3 Add breadcrumb navigation
    - Display "Collection Name › Canvas Name"
    - Make collection name clickable
    - Handle long names with ellipsis
    - Show only canvas name if not linked
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 8.4 Handle broken collection links
    - Detect when collection is deleted
    - Display warning alert
    - Offer "Remove Link" button
    - Maintain canvas functionality
    - _Requirements: 1.5, 6.4, 10.1_

  - [x] 8.5 Pass context to AI agents
    - Include collection context in agent prompts
    - Provide well list to agents
    - Add geographic context if available
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.6 Write property test for file path accessibility
    - **Property 6: File Path Accessibility**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [-] 9. Update CollectionDetailPage
  - [x] 9.1 Load linked canvases
    - Call listSessions() to get all sessions
    - Filter by linkedCollectionId matching current collection
    - Display canvas cards
    - _Requirements: 7.2, 7.3_

  - [x] 9.2 Display canvas count in header
    - Show "X Linked Canvases" badge
    - Update when canvases are created/deleted
    - _Requirements: 7.4_

  - [x] 9.3 Handle canvas card clicks
    - Navigate to canvas on click
    - _Requirements: 7.3_

  - [ ]* 9.4 Write property test for multiple canvas independence
    - **Property 3: Multiple Canvas Independence**
    - **Validates: Requirements 7.1, 7.2**

- [x] 10. Checkpoint - Backend and API Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Update Collections Lambda for Persistence
  - [x] 11.1 Create DynamoDB Collections table
    - Define schema matching current in-memory structure
    - Add GSI for owner-based queries
    - Configure in CDK
    - _Requirements: 5.3_

  - [x] 11.2 Replace in-memory storage with DynamoDB
    - Update getCollections() to query DynamoDB
    - Update create/update/delete to use DynamoDB
    - Remove global.persistentCollections
    - _Requirements: 5.3_

  - [x] 11.3 Add cache invalidation
    - Invalidate collection context cache on update
    - Invalidate on delete
    - _Requirements: 9.3_

  - [ ]* 11.4 Write property test for cache invalidation
    - **Property 4: Cache Invalidation Consistency**
    - **Validates: Requirements 9.3, 9.4**

- [x] 12. Implement Error Handling UI
  - [x] 12.1 Add broken link warning alert
    - Display when collection is deleted
    - Show collection name with warning icon
    - Offer "Remove Link" action
    - _Requirements: 1.5, 6.4, 10.1_

  - [x] 12.2 Add context load failure alert
    - Display when context fails to load
    - Show "Retry" button
    - Maintain canvas functionality
    - _Requirements: 10.2, 10.4_

  - [x] 12.3 Add empty collection message
    - Display when collection has no data items
    - Suggest adding data
    - _Requirements: 10.5_

  - [ ]* 12.4 Write property test for error recovery
    - **Property 7: API Error Recovery**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 13. Add FileDrawer Integration
  - [x] 13.1 Pass collection context to FileDrawer
    - Extract S3 keys from collection data items
    - Make files accessible in FileDrawer
    - _Requirements: 3.1, 3.2_

  - [x] 13.2 Display collection files
    - Show all well files from collection
    - Group by data source
    - Enable file selection
    - _Requirements: 3.2, 3.3_

  - [x] 13.3 Handle file selection
    - Load file content on selection
    - Pass to AI agent for analysis
    - _Requirements: 3.4_

  - [ ]* 13.4 Write integration test for file access
    - Create collection with S3 files
    - Create canvas from collection
    - Verify files appear in FileDrawer
    - Verify file selection works
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 14. Implement Context Persistence
  - [x] 14.1 Test session persistence across browser sessions
    - Create canvas with collection link
    - Close browser
    - Reopen canvas
    - Verify collection context loads
    - _Requirements: 5.1, 5.2_

  - [x] 14.2 Test Lambda cold start recovery
    - Force Lambda cold start
    - Load canvas
    - Verify session retrieved from DynamoDB
    - Verify collection context loads
    - _Requirements: 5.3, 5.4_

  - [ ]* 14.3 Write property test for context loading idempotency
    - **Property 9: Context Loading Idempotency**
    - **Validates: Requirements 9.1, 9.2, 9.5**

- [x] 15. Add Monitoring and Logging
  - [x] 15.1 Add CloudWatch metrics
    - Session creation rate
    - Session retrieval latency
    - Collection context load time
    - Cache hit/miss ratio
    - API error rate
    - _Requirements: All_

  - [x] 15.2 Add structured logging
    - Log session API requests/responses
    - Log collection context loading
    - Log cache operations
    - Log errors with stack traces
    - _Requirements: All_

  - [x] 15.3 Configure CloudWatch alarms
    - High API error rate (> 5%)
    - High latency (> 1 second)
    - DynamoDB throttling
    - Lambda errors
    - _Requirements: All_

- [x] 16. Final Checkpoint - End-to-End Testing
  - [x] 16.1 Test complete flow
    - Create collection from catalog
    - Create canvas from collection
    - Verify context displays
    - Verify files accessible
    - Send message to AI
    - Close and reopen canvas
    - Verify context persists
    - _Requirements: All_

  - [x] 16.2 Test multiple canvas flow
    - Create collection
    - Create Canvas A
    - Create Canvas B
    - Verify both show context
    - Update collection
    - Verify both reflect update
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 16.3 Test broken link flow
    - Create collection
    - Create canvas
    - Delete collection
    - Open canvas
    - Verify warning displayed
    - Verify canvas functional
    - _Requirements: 1.5, 10.1_

  - [ ]* 16.4 Write property test for breadcrumb consistency
    - **Property 10: Breadcrumb Navigation Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 16.5 Write property test for session list filtering
    - **Property 8: Session List Filtering**
    - **Validates: Requirements 8.5**

- [x] 17. Deploy to Production
  - Deploy DynamoDB tables
  - Deploy Sessions Lambda
  - Deploy Collections Lambda updates
  - Deploy frontend changes
  - Run smoke tests
  - Monitor logs and metrics
  - _Requirements: All_

- [x] 18. Documentation
  - Update API documentation
  - Add user guide for collections
  - Document troubleshooting steps
  - Add architecture diagrams
  - _Requirements: All_
