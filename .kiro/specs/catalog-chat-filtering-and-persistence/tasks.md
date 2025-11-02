# Implementation Plan

- [x] 1. Add message persistence to localStorage
  - Implement localStorage save/load hooks for messages
  - Add message restoration on component mount
  - Add automatic save on messages state change
  - Test message persistence across browser reloads
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3_

- [x] 1.1 Create message persistence hooks in catalog/page.tsx
  - Add useEffect to load messages from localStorage on mount
  - Add useEffect to save messages to localStorage on change
  - Use sessionId-specific localStorage key: `catalog_messages_{sessionId}`
  - Add error handling for JSON parse failures
  - _Requirements: 2.1, 5.1, 5.2_

- [x] 1.2 Test message restoration on page reload
  - Verify messages load correctly after browser reload
  - Verify messages are associated with correct sessionId
  - Verify error handling when localStorage data is corrupted
  - Verify messages clear when session is reset
  - _Requirements: 2.1, 2.2, 5.3, 5.5_

- [x] 2. Add filtered data state management
  - Add filteredData state to track filtered subset
  - Add filterStats state to track filter statistics
  - Update handleChatSearch to populate filtered data
  - Ensure original analysisData remains unchanged during filtering
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 2.1 Add new state variables in catalog/page.tsx
  - Add `const [filteredData, setFilteredData] = useState<any>(null)`
  - Add `const [filterStats, setFilterStats] = useState<FilterStats | null>(null)`
  - Define FilterStats interface with filteredCount, totalCount, isFiltered
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Update handleChatSearch to handle filtered responses
  - Check if backend response indicates filter operation
  - If filter operation, update filteredData and filterStats
  - If fresh search, update analysisData and clear filteredData
  - Log filter statistics for debugging
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.3_

- [x] 3. Enhance filter detection logic
  - Expand filter keyword list to include "with", "having", "log curve", etc.
  - Improve isLikelyFilter detection in handleChatSearch
  - Add logging for filter detection decisions
  - Test with various filter query patterns
  - _Requirements: 4.1, 4.2_

- [x] 3.1 Update filter keyword detection in handleChatSearch
  - Add comprehensive filter keyword array
  - Include: 'with', 'having', 'show wells with', 'wells with', 'that have', 'containing', 'log curve', 'curve'
  - Update isLikelyFilter logic to check all keywords
  - Add console logging for filter detection
  - _Requirements: 4.1_

- [x] 3.2 Update existingContext preparation for backend
  - Add isFilterOperation flag to context
  - Add hasExistingData flag to context
  - Include wellCount and queryType in context
  - Ensure context is only sent when analysisData exists
  - _Requirements: 4.2, 4.3_

- [x] 4. Update table component to display filtered data
  - Pass filteredData and filterStats to CatalogChatBoxCloudscape
  - Update ProfessionalGeoscientistDisplay to use filtered data
  - Update table header to show filter statistics
  - Maintain expandable rows functionality with filtered data
  - _Requirements: 1.1, 1.3, 1.4, 3.3, 4.5_

- [x] 4.1 Update CatalogChatBoxCloudscape props
  - Add filteredData prop to component interface
  - Add filterStats prop to component interface
  - Pass props from catalog/page.tsx
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Update CustomAIMessage to use filtered data
  - Check if filteredData exists, use it instead of tableData
  - Pass filterStats to ProfessionalGeoscientistDisplay
  - Ensure hierarchical data structure is preserved
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 4.3 Update ProfessionalGeoscientistDisplay header
  - Add filterStats prop to component interface
  - Update header counter to show "X of Y total" when filtered
  - Update description to indicate filtered results
  - Maintain existing functionality when not filtered
  - _Requirements: 1.3, 4.5_

- [x] 5. Update backend response to include filter metadata
  - Modify catalogSearch handler to return isFilterOperation flag
  - Add totalWells count to stats when filtering
  - Add filterCriteria description to response
  - Ensure backward compatibility with existing responses
  - _Requirements: 4.3, 4.4_

- [x] 5.1 Update handler.py to detect filter operations
  - Check if existing_context indicates filter operation
  - Set isFilterOperation flag in response
  - Include original well count in stats as totalWells
  - _Requirements: 4.3, 4.4_

- [x] 5.2 Update strands_agent_processor.py to return filter metadata
  - When filtering existing data, track original count
  - Add totalWells to stats in response
  - Add isFilterOperation flag to result
  - _Requirements: 4.3, 4.4_

- [x] 6. Enhance session reset to clear persisted messages
  - Update handleCreateNewChat to clear localStorage messages
  - Clear messages for old sessionId before generating new one
  - Ensure new session starts with empty messages
  - Test reset functionality
  - _Requirements: 2.5, 5.4_

- [x] 6.1 Update handleCreateNewChat in catalog/page.tsx
  - Get old sessionId from localStorage before reset
  - Remove `catalog_messages_{oldSessionId}` from localStorage
  - Generate new sessionId and save to localStorage
  - Clear all state including filteredData and filterStats
  - _Requirements: 2.5, 5.4_

- [x] 7. Add data restoration on page reload
  - Load table data from S3 when messages are restored
  - Restore map state from saved mapState
  - Restore chain of thought steps
  - Handle errors gracefully if restoration fails
  - _Requirements: 2.2, 2.3, 2.4, 5.5_

- [x] 7.1 Add data restoration logic in catalog/page.tsx
  - After loading messages, check if last message has files.metadata
  - Fetch metadata from S3 using signed URL
  - Restore analysisData with fetched metadata
  - Restore mapState if available
  - _Requirements: 2.2, 2.3_

- [x] 7.2 Add chain of thought restoration
  - Extract thoughtSteps from restored messages
  - Update chainOfThoughtMessageCount
  - Ensure chain of thought panel displays restored steps
  - _Requirements: 2.4_

- [x] 7.3 Add error handling for restoration failures
  - Wrap restoration logic in try-catch
  - Log errors but don't block user
  - Show warning message if restoration fails
  - Allow user to continue with fresh session
  - _Requirements: 5.5_

- [x] 8. Maintain filter state across panel switches
  - Ensure filteredData persists when switching panels
  - Ensure table shows filtered data in all panels
  - Ensure map shows filtered wells when switching back
  - Test panel switching with filtered data
  - _Requirements: 1.5, 3.5_

- [x] 8.1 Verify state persistence across panel switches
  - Test switching from Chat to Map panel with filtered data
  - Test switching from Chat to Data Analysis panel
  - Verify filteredData state is not cleared on panel switch
  - Verify table component receives correct data in all panels
  - _Requirements: 1.5, 3.5_

- [x] 9. Add comprehensive error handling
  - Handle localStorage quota exceeded errors
  - Handle S3 signed URL expiration
  - Handle JSON parse errors for corrupted data
  - Handle backend filter operation failures
  - _Requirements: 5.5_

- [x] 9.1 Add localStorage error handling
  - Wrap localStorage operations in try-catch
  - Handle QuotaExceededError gracefully
  - Log errors and continue without persistence
  - Show user-friendly error message if needed
  - _Requirements: 5.5_

- [x] 9.2 Add S3 data loading error handling
  - Handle fetch failures for metadata/geojson
  - Handle expired signed URLs
  - Show warning message to user
  - Allow user to run fresh search
  - _Requirements: 5.5_

- [x] 9.3 Add filter operation error handling
  - Catch errors in handleChatSearch filter logic
  - Keep original unfiltered data visible on error
  - Show error message in chat
  - Log error details for debugging
  - _Requirements: 5.5_

- [x] 10. End-to-end testing and validation
  - Test complete filter workflow with real queries
  - Test message persistence across multiple reloads
  - Test session reset clearing all state
  - Test error scenarios and recovery
  - _Requirements: All_

- [x] 10.1 Test filtering workflow
  - Run initial search: "/getdata" or "show all wells"
  - Run filter query: "wells with log curve data"
  - Verify table updates to show filtered results
  - Verify header shows "X of Y total"
  - Verify expandable rows still work
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 10.2 Test message persistence workflow
  - Run several queries to build up conversation
  - Reload browser
  - Verify all messages restored
  - Verify table data restored
  - Verify map state restored
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10.3 Test session reset workflow
  - Build up conversation with multiple queries
  - Click "New Chat" button
  - Verify all messages cleared
  - Verify new sessionId generated
  - Verify localStorage cleared for old session
  - Verify fresh session starts correctly
  - _Requirements: 2.5, 5.4_

- [x] 10.4 Test error scenarios
  - Test with corrupted localStorage data
  - Test with expired S3 signed URLs
  - Test with backend filter errors
  - Verify graceful degradation in all cases
  - _Requirements: 5.5_

- [x] 10.5 Test panel switching with filtered data
  - Apply filter in Chat panel
  - Switch to Map panel - verify filtered wells shown
  - Switch to Data Analysis panel - verify filtered data shown
  - Switch back to Chat panel - verify filter state maintained
  - _Requirements: 1.5, 3.5_
