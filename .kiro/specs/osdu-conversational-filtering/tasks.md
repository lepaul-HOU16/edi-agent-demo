# Implementation Tasks

## Task 1: Add NLP Query Parser to OSDU Lambda

Implement intelligent query parsing to extract filter criteria from natural language.

- [ ] 1.1 Create query parser utility in OSDU Lambda
  - Add `parseNaturalLanguageQuery()` function to extract location/operator/well name filters
  - Support location keywords: "north sea", "gulf of mexico", "south china sea", "persian gulf", "caspian"
  - Support operator keywords: "BP", "Shell", "Chevron", "ExxonMobil", "TotalEnergies"
  - Support well name prefixes: "USA", "NOR", "VIE", "UAE", "KAZ"
  - Return structured `FilterCriteria` object
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.2 Add demo data filtering logic
  - Implement `filterDemoData()` function that applies parsed criteria
  - Support location filtering (case-insensitive substring match)
  - Support operator filtering (exact match)
  - Support well name filtering (prefix match)
  - Combine multiple filters with AND logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.3 Integrate parser with OSDU handler
  - Parse query before returning demo data
  - Apply filters to demo records
  - Return filtered results with accurate count
  - Indicate "(Demo Data)" in response when using demo data
  - Indicate "(OSDU API)" when using real API data
  - _Requirements: 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

## Task 2: Implement Frontend Context Persistence

Restore conversation context for follow-up filtering queries.

- [ ] 2.1 Add osduContext state to CatalogPage
  - Create `OSDUSearchContext` interface with query, records, filteredRecords, activeFilters
  - Add `useState<OSDUSearchContext | null>` for context persistence
  - Store full result set when initial OSDU search completes
  - _Requirements: 2.1, 4.1, 4.2_

- [ ] 2.2 Implement client-side filtering for follow-up queries
  - Check if osduContext exists before making new API call
  - Parse follow-up query to extract additional filter criteria
  - Filter cached results instead of calling API again
  - Update filteredRecords in context
  - _Requirements: 2.2, 2.3, 4.3_

- [ ] 2.3 Add context reset logic
  - Clear osduContext when user starts new search
  - Clear osduContext when user says "show all" or "reset"
  - Clear osduContext when switching search types
  - Restore original unfiltered results when requested
  - _Requirements: 2.4, 2.5, 4.4, 4.5_

## Task 3: Implement Map Synchronization

Restore map-table synchronization for OSDU search results.

- [ ] 3.1 Update map markers when OSDU results change
  - Extract well coordinates from OSDU records
  - Create map markers for all wells with valid coordinates
  - Update map bounds to fit all markers
  - Display "No location data available" when no coordinates
  - _Requirements: 3.1, 3.5_

- [ ] 3.2 Filter map markers when results are filtered
  - Listen for changes to filteredRecords in osduContext
  - Remove markers for wells not in filtered results
  - Update map markers when conversational filtering occurs
  - Keep map synchronized with table at all times
  - _Requirements: 3.2_

- [ ] 3.3 Add map-table interaction
  - Highlight table row when map marker is clicked
  - Center map on marker when table row is clicked
  - Scroll table to show highlighted row
  - Provide visual feedback for selected well
  - _Requirements: 3.3, 3.4_

## Task 4: Fix First Prompt Border Radius

Fix the inconsistent border radius on the FIRST prompt input box only.

- [ ] 4.1 Identify CSS selector for first prompt
  - Inspect ExpandablePromptInput component
  - Find CSS class or selector that targets ONLY the first prompt
  - Use `:first-child` or `:first-of-type` pseudo-selector if needed
  - _Requirements: 6.1, 6.2_

- [ ] 4.2 Apply 8px border radius override
  - Add CSS rule targeting first prompt specifically
  - Set `border-radius: 8px !important` on all four corners
  - Remove any extra border-radius on top-right corner
  - Verify subsequent prompts remain unaffected
  - Test in browser DevTools
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Task 5: Test and Verify

Test all regression fixes on localhost.

- [ ] 5.1 Test conversational filtering
  - Query "show me osdu wells" → verify all wells returned
  - Query "show me wells in the north sea" → verify only North Sea wells
  - Query "show me BP wells" → verify only BP wells
  - Query "show me USA wells" → verify only USA-prefixed wells
  - Query with multiple criteria → verify AND logic works
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5.2 Test context persistence
  - Initial query → verify context stored
  - Follow-up filter → verify cached results filtered (no API call)
  - Query "show all" → verify original results restored
  - New search → verify context cleared
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.3 Test map synchronization
  - OSDU search → verify map markers appear
  - Filter results → verify map markers update
  - Click marker → verify table row highlights
  - Click table row → verify map centers on marker
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.4 Test border radius fix
  - Inspect first prompt in DevTools → verify 8px on all corners
  - Inspect subsequent prompts → verify they remain correct
  - Compare first and subsequent prompts → verify consistency
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.5 Test demo data vs real API
  - With OSDU API configured → verify real data used
  - Without OSDU API configured → verify demo data used
  - Demo data → verify "(Demo Data)" indicator shown
  - Real API data → verify "(OSDU API)" indicator shown
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Notes

- This is a REGRESSION FIX - restoring functionality that worked before
- Demo data (24 LAS files) for catalog search is PRESERVED
- Only OSDU demo data filtering is being fixed
- Map synchronization was working before and needs to be restored
- Context persistence was working before and needs to be restored
- First prompt border radius is a cosmetic fix
- Test on localhost first: `npm run dev`
- Deploy backend if needed: `cd cdk && npm run deploy`

