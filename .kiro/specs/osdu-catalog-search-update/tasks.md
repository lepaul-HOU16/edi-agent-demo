# Implementation Plan

- [x] 1. Set up backend infrastructure and S3 session storage
  - Create S3 bucket for catalog sessions with lifecycle policies
  - Configure IAM permissions for Lambda to access S3
  - Set up CloudWatch logging for debugging
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2. Implement S3 Session Manager module
  - [x] 2.1 Create S3SessionManager class with file storage methods
    - Implement storeMetadata() for all_well_metadata.json and filtered versions
    - Implement storeGeoJSON() for all_well_geojson.json and filtered versions
    - Implement storeHistory() for session_history.json
    - Add versioning logic for filtered files (001, 002, etc.)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Implement file retrieval and signed URL generation
    - Create getMetadata() to load metadata from S3
    - Create getGeoJSON() to load GeoJSON from S3
    - Create getHistory() to load session history
    - Implement getSignedUrl() with 15-minute expiration
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Implement session cleanup and reset functionality
    - Create resetSession() to delete filtered files
    - Preserve all_well_* files during reset
    - Clear session_history.json on reset
    - Implement getNextVersion() for file versioning
    - _Requirements: 2.3, 3.6_

  - [ ]* 2.4 Write unit tests for S3SessionManager
    - Test file storage with correct filenames
    - Test versioned filename generation
    - Test signed URL generation
    - Test session reset logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Implement OSDU Data Transformer module
  - [x] 3.1 Create OSDUDataTransformer class
    - Implement transformWellData() to parse OSDU API responses
    - Build WellMetadata structure from OSDU format
    - Extract spatial coordinates from OSDU location data
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 3.2 Implement hierarchical data structure builder
    - Create buildHierarchy() method
    - Structure wells → wellbores → welllogs hierarchy
    - Match example_well_metadata_hierarchy.json format
    - Include FacilityName, NameAliases, and Curves data
    - _Requirements: 11.1, 11.4_

  - [x] 3.3 Implement GeoJSON conversion
    - Create toGeoJSON() method
    - Convert OSDU spatial data to GeoJSON Point features
    - Add well properties (name, depth, operator, type)
    - Include wellbore and welllog counts in properties
    - _Requirements: 5.5, 9.1_

  - [ ]* 3.4 Write unit tests for OSDUDataTransformer
    - Test OSDU response transformation
    - Test hierarchical structure building
    - Test GeoJSON conversion
    - Verify coordinate transformation accuracy
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 4. Implement Command Router module
  - [x] 4.1 Create CommandRouter class with command detection
    - Implement isCommand() to detect /getdata and /reset
    - Create getCommandType() to parse command type
    - Add command validation logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Implement /getdata command handler
    - Fetch all wells from OSDU API using provided auth token
    - Transform OSDU response to WellMetadata format
    - Generate all_well_metadata.json
    - Generate all_well_geojson.json
    - Store files in S3 with session_id
    - Return S3 signed URLs and statistics
    - _Requirements: 2.1, 8.1, 8.2, 8.3, 8.4_

  - [x] 4.3 Implement /reset command handler
    - Delete all filtered_well_metadata_*.json files
    - Delete all filtered_well_geojson_*.json files
    - Clear session_history.json
    - Preserve all_well_metadata.json and all_well_geojson.json
    - Return success confirmation
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 4.4 Write unit tests for CommandRouter
    - Test command detection for /getdata and /reset
    - Test non-command queries return false
    - Test /getdata execution flow
    - Test /reset cleanup logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Integrate Strands Agent for natural language processing
  - [x] 5.1 Set up Strands Agent with OSDU tools
    - Initialize Strands Agent with Claude 4.5 Sonnet model
    - Configure OSDU API client with lambda env variables
    - Create OSDU search tools for agent
    - Set up streaming response handler
    - _Requirements: 1.2, 5.1, 5.2, 5.3, 7.1_

  - [x] 5.2 Implement query processing with context awareness
    - Load existing all_well_metadata.json from S3
    - determine which level of hierachy needs to be filtered: well, wellbore or welllog curve
    - Process natural language filter queries
    - Generate thought steps during processing for realtime streaming back to frontend
    - _Requirements: 5.4, 6.1, 6.2_

  - [ ] 5.3 Implement data filtering and transformation
    - Apply user filters to existing well data
    - Transform filtered results to WellMetadata format
    - Generate filtered GeoJSON
    - Create versioned filtered files
    - Store in S3 with incremented version number
    - _Requirements: 5.4, 5.5_

  - [ ] 5.4 Implement streaming response with thought steps
    - Stream thought steps as agent processes query
    - Include step title, summary, status, and timestamp
    - Stream final results with file URLs
    - Include well/wellbore/welllog counts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.5 Write integration tests for Strands Agent
    - Test agent initialization with OSDU config
    - Test query processing with mock OSDU data
    - Test filtering logic
    - Test thought step generation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

- [ ] 6. Implement main Catalog Search Lambda handler
  - [x] 6.1 Create Lambda handler entry point
    - Set up AppSync GraphQL streaming handler
    - Parse incoming request (prompt, sessionId, osduInstance, authToken)
    - Initialize logging and error handling
    - _Requirements: 1.1, 1.5_

  - [x] 6.2 Implement request routing logic
    - Route to CommandRouter for /getdata and /reset
    - Route to Strands Agent for natural language queries
    - Handle OSDU authentication delegation
    - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 6.3 Implement streaming response handler
    - Stream thought steps from Strands Agent
    - Stream final results with S3 signed URLs
    - Handle errors and timeouts gracefully
    - Update session history in S3
    - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4_

  - [x] 6.4 Add error handling and logging
    - Handle OSDU API errors (401, 404, 500)
    - Handle S3 storage errors
    - Handle Strands Agent errors
    - Log all operations to CloudWatch
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 6.5 Write integration tests for Lambda handler
    - Test /getdata command end-to-end
    - Test /reset command end-to-end
    - Test natural language query flow
    - Test error handling scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7. Update AppSync GraphQL schema and resolvers
  - Add catalogSearch mutation to schema
  - Configure streaming response type
  - Set up Lambda resolver for catalogSearch
  - Configure authentication (Cognito + IAM)
  - _Requirements: 1.1, 1.4_

- [ ] 8. Update frontend page.tsx for new backend
  - [x] 8.1 Add sessionId state management
    - Initialize sessionId with uuidv4() on component mount
    - Persist sessionId across page refreshes (localStorage)
    - Reset sessionId on /reset command
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Update handleChatSearch to use new Lambda
    - Pass sessionId to catalogSearch mutation
    - Pass OSDU instance configuration
    - Pass authentication token
    - Handle streaming responses
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

  - [x] 8.3 Implement /getdata command handling
    - Detect /getdata in user input
    - Call catalogSearch with /getdata prompt
    - Fetch metadata and GeoJSON from S3 signed URLs
    - Update map with GeoJSON data
    - Store hierarchical metadata for table display
    - _Requirements: 2.1, 8.1, 8.2, 8.3, 8.4_

  - [x] 8.4 Implement /reset command handling
    - Detect /reset in user input
    - Call catalogSearch with /reset prompt
    - Clear all local state (messages, map data, table data)
    - Reset sessionId
    - Clear map visualization
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 8.5 Update message display for streaming responses
    - Display thought steps in Chain of Thought panel
    - Show well/wellbore/welllog counts in messages
    - Handle file URLs from backend
    - Update existing auto-scroll logic for thought steps
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 8.6 Write component tests for page.tsx updates
    - Test sessionId initialization and persistence
    - Test /getdata command flow
    - Test /reset command flow
    - Test streaming response handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9. Create Hierarchical Table component
  - [ ] 9.1 Create HierarchicalTable component with Cloudscape Table
    - Set up expandable table structure
    - Configure wells as top-level rows
    - Configure wellbores as nested rows
    - Configure welllogs as deepest nested rows
    - _Requirements: 11.1, 11.4, 11.5_

  - [ ] 9.2 Implement data rendering for each hierarchy level
    - Display well data (FacilityName, location, depth, operator)
    - Display wellbore data (FacilityName, NameAliases)
    - Display welllog data (Name, Curves with Mnemonics)
    - Add expand/collapse icons
    - _Requirements: 11.1, 11.4, 11.5_

  - [ ] 9.3 Add table visibility toggle
    - Create toggle button in UI
    - Show/hide table based on toggle state
    - Overlay table on map when visible
    - Maintain table state during panel switches
    - _Requirements: 11.2, 11.3_

  - [ ] 9.4 Integrate table with page.tsx
    - Pass hierarchical data from page.tsx to table
    - Update table when new search results arrive
    - Clear table on /reset command
    - Handle empty state when no data available
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 9.5 Write component tests for HierarchicalTable
    - Test rendering of wells at top level
    - Test expansion to show wellbores
    - Test expansion to show welllogs
    - Test toggle visibility
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 10. Deploy and test end-to-end
  - [x] 10.1 Deploy backend to AWS
    - Deploy Lambda function with correct configuration
    - Verify S3 bucket creation and permissions
    - Verify AppSync schema update
    - Check CloudWatch logs for errors
    - _Requirements: All backend requirements_

  - [ ] 10.2 Deploy frontend updates
    - Build and deploy Next.js application
    - Verify Amplify configuration
    - Test in deployed environment
    - _Requirements: All frontend requirements_

  - [-] 10.3 Perform end-to-end testing
    - Test /getdata command loads all wells
    - Test natural language filtering works
    - Test /reset clears filtered data
    - Test hierarchical table displays correctly
    - Test map visualization updates
    - Test thought steps display in Chain of Thought panel
    - _Requirements: All requirements_

  - [ ] 10.4 Performance and load testing
    - Test with large datasets (1000+ wells)
    - Measure Lambda execution time
    - Verify S3 signed URL expiration
    - Test concurrent user sessions
    - _Requirements: All requirements_

  - [ ]* 10.5 User acceptance testing
    - Provide test environment to stakeholders
    - Gather feedback on UX and functionality
    - Document any issues or enhancement requests
    - _Requirements: All requirements_
