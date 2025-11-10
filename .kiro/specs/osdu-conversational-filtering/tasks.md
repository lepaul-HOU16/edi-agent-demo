# Implementation Plan

- [x] 1. Add OSDU search context state management
  - Add OSDUSearchContext interface to `src/app/catalog/page.tsx`
  - Add FilterCriteria interface for tracking applied filters
  - Add osduContext state variable using useState hook
  - Add setOsduContext function for updating context
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Store OSDU context after successful searches
  - Update handleChatSearch to store context after OSDU API response
  - Extract query, timestamp, recordCount, and records from response
  - Initialize filteredRecords and activeFilters as empty
  - Add console logging for context storage debugging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement filter intent detection function
  - Create detectFilterIntent function in `src/app/catalog/page.tsx`
  - Check for OSDU context existence before detecting filters
  - Detect filter keywords (filter, show only, where, with)
  - Parse operator filters with regex pattern matching
  - Parse location/country filters with regex pattern matching
  - Parse depth filters with numeric operators (>, <, =)
  - Parse type and status filters with regex pattern matching
  - Return filter intent object with type, value, and operator
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement client-side filter application function
  - Create applyOsduFilter function in `src/app/catalog/page.tsx`
  - Implement operator filtering with case-insensitive matching
  - Implement location/country filtering with case-insensitive matching
  - Implement depth filtering with numeric comparisons
  - Implement type filtering with case-insensitive matching
  - Implement status filtering with case-insensitive matching
  - Add console logging for filter operations
  - Return filtered records array
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Integrate filter detection into query handling
  - Update handleChatSearch to check for filter intent when OSDU context exists
  - Call detectFilterIntent before checking for new search intent
  - Route to filter application if filter intent detected
  - Continue to new search if no filter intent detected
  - Add early return after filter processing to prevent new search
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3_

- [x] 6. Implement filter result display
  - Apply filter to existing OSDU records using applyOsduFilter
  - Update osduContext with filtered results and new filter criteria
  - Create AI message with filtered results using osdu-search-response format
  - Include filter description in message (type, operator, value)
  - Display filtered record count vs total record count
  - Use existing OSDUSearchResponse component for display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Handle zero results from filters
  - Check if filtered results array is empty
  - Create helpful error message with filter criteria
  - Suggest alternative actions (try different value, show all, refine)
  - Display suggestions in chat using existing message components
  - _Requirements: 4.4, 6.3_

- [x] 8. Implement filter reset functionality
  - Detect "show all" or "reset" keywords in query
  - Clear filteredRecords and activeFilters from context
  - Display original unfiltered results
  - Create message indicating filters were reset
  - Show original record count
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Add sequential filter support
  - Apply new filters to already-filtered results (filteredRecords || records)
  - Append new filter criteria to activeFilters array
  - Update context with cumulative filtered results
  - Display cumulative filter criteria in message
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 10. Implement filter help command
  - Create comprehensive filter help message with examples
  - Detect "help" or "how to filter" keywords in query
  - Display filter help message in chat
  - Include examples for operator, location, depth, type, status filters
  - Include reset filter instructions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Add error handling for missing context
  - Check if osduContext exists before processing filter
  - Display error message if filter attempted without OSDU context
  - Suggest performing OSDU search first
  - Provide example OSDU search queries
  - _Requirements: 6.2_

- [x] 12. Add error handling for invalid filters
  - Check if filter type and value were successfully parsed
  - Display error message if filter parsing failed
  - Show filter help with examples
  - Log parsing errors for debugging
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 13. Add filter hints to OSDU results
  - OSDU search result messages already include filtering hints in answer text
  - Context information shows available filter capabilities
  - Help command suggestion included in error messages
  - _Requirements: 10.3_

- [ ]* 14. Create unit tests for filter functions
  - Test detectFilterIntent with various filter queries
  - Test detectFilterIntent without OSDU context
  - Test applyOsduFilter for operator filtering
  - Test applyOsduFilter for location filtering
  - Test applyOsduFilter for depth filtering with >, <, = operators
  - Test applyOsduFilter for type and status filtering
  - Test sequential filter application
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 15. Create integration tests for filter workflow
  - Test end-to-end: OSDU search → store context → apply filter → display results
  - Test sequential filtering: apply multiple filters in sequence
  - Test filter reset: apply filter → reset → verify original results
  - Test error cases: filter without context, invalid filter syntax
  - Test zero results: filter that matches no records
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 16. Add filter operation logging
  - Filter intent detection already logs results
  - Filter application already logs before/after counts
  - Context updates already logged (stored, filtered, reset)
  - Error conditions already logged for debugging
  - _Requirements: 6.5_

- [x] 17. Add pagination to OSDUSearchResponse component
  - Import Pagination component from @cloudscape-design/components
  - Add currentPageIndex state variable with useState (default: 1)
  - Define pageSize constant (10 records per page)
  - Calculate startIndex and endIndex based on currentPageIndex
  - Create paginatedRecords by slicing records array
  - Calculate totalPages using Math.ceil(records.length / pageSize)
  - Update items prop to use paginatedRecords instead of records.slice(0, 10)
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 18. Add pagination controls to table
  - Add pagination prop to Table component
  - Conditionally render Pagination only if records.length > pageSize
  - Pass currentPageIndex to Pagination component
  - Implement onChange handler to update currentPageIndex
  - Pass pagesCount (totalPages) to Pagination component
  - Add accessibility labels for previous, next, and page buttons
  - _Requirements: 11.6, 11.7, 11.8, 11.9_

- [x] 19. Update table header with pagination info
  - Calculate showingStart (startIndex + 1 or 0 if no records)
  - Calculate showingEnd (startIndex + displayCount)
  - Update Table header counter to show "X-Y of Z" format
  - Display current page range in header description
  - _Requirements: 11.10_

- [x] 20. Handle pagination reset on filter changes
  - Reset currentPageIndex to 1 when new records array received
  - Use useEffect to detect records array changes
  - Preserve page number when records array reference doesn't change
  - Add console logging for pagination reset events
  - _Requirements: 11.4, 11.5_

- [x] 21. Test pagination functionality
  - Test pagination with 50+ records (multiple pages)
  - Test pagination with < 10 records (no pagination shown)
  - Test page navigation (next, previous buttons)
  - Test boundary conditions (first page, last page)
  - Test pagination reset after filter application
  - Test "Showing X-Y of Z" counter accuracy
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

