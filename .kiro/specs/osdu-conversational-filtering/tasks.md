# Implementation Plan

- [x] 1.1 Create shared NLP parser module
  - Extract to `cdk/lambda-functions/shared/nlpParser.ts`
  - Support location keywords: "north sea", "brunei", "malaysia", "gulf of mexico", "offshore"
  - Support operator keywords: "BP", "Shell", "My Company", "Chevron", "ExxonMobil"
  - Support well name prefixes: "USA", "NOR", "WELL", "VIE", "UAE", "KAZ"
  - Support depth filters: "deeper than Xm", "depth > Xm", "wells with depth > X"
  - Return structured `ParsedQuery` object with confidence score
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 1.2 Add depth parsing logic to shared parser
  - Merge depth parsing into shared parser
  - Parse "deeper than 3000m" → minDepth: 3000, unit: 'm'
  - Parse "depth > 5000 feet" → minDepth: 5000, unit: 'ft'
  - Parse "wells with depth greater than 2500" → minDepth: 2500
  - Support both meters and feet
  - Handle various phrasings (deeper, greater than, >, above)
  - _Requirements: 6.3, 7.2_

- [x] 1.3 Add comprehensive location keywords
  - Add "Brunei" → location filter
  - Add "Malaysia" → location filter
  - Add "Offshore" → location filter
  - Add "Offshore Brunei" → location filter
  - Add "Offshore Malaysia" → location filter
  - Keep existing OSDU location keywords (North Sea, Gulf of Mexico, etc.)
  - _Requirements: 6.2, 7.1_

- [x] 2.1 Import shared NLP parser in Catalog Lambda
  - Add import: `import { parseNaturalLanguageQuery } from '../shared/nlpParser';`
  - Replace inline parsing with shared parser for filter criteria
  - Ensure consistent behavior with OSDU Lambda
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 2.2 Implement catalog data filtering function
  - Create `filterCatalogData()` function that works on 24 LAS files
  - Filter by location (Brunei, Malaysia, Offshore, etc.)
  - Filter by depth (parse depth from properties, compare to minDepth)
  - Filter by operator (My Company, etc.)
  - Filter by well name prefix (WELL, etc.)
  - Combine multiple filters with AND logic
  - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_

- [x] 2.3 Integrate filtering with catalog handler
  - Parse query using shared NLP parser
  - Apply filters to 24 LAS files before returning
  - Return filtered results with accurate count
  - Indicate "(Filtered)" in response when filters applied
  - Log filtering operations for debugging
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.1 Replace OSDU inline parser with shared parser
  - Remove inline `parseNaturalLanguageQuery()` from OSDU handler
  - Import shared parser: `import { parseNaturalLanguageQuery } from '../shared/nlpParser';`
  - Update `filterDemoData()` to use shared parser interface
  - Verify existing OSDU filtering still works
  - _Requirements: 8.2, 8.3_

- [x] 3.2 Test OSDU filtering with shared parser
  - Test location filtering still works (North Sea, Gulf of Mexico)
  - Test operator filtering still works (BP, Shell, Chevron)
  - Test well name filtering still works (USA, NOR, VIE)
  - Test depth filtering (new feature from shared parser)
  - Verify no regressions in OSDU functionality
  - _Requirements: 1.1, 1.2, 1.3, 8.2_

- [x] 4.1 Add catalogContext state to CatalogPage
  - Create `CatalogSearchContext` interface (similar to OSDUSearchContext)
  - Add `catalogContext` state alongside existing `osduContext`
  - Store full result set when catalog search completes
  - Maintain separate contexts for OSDU and catalog
  - _Requirements: 6.1, 7.5_

- [x] 4.2 Implement unified filter detection
  - Create `detectFilterIntent()` function that works for both contexts
  - Detect filter keywords: "just", "only", "near", "deeper", "filter"
  - Determine which context to filter (OSDU or catalog)
  - Return filter intent with context type
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4.3 Implement unified context filtering
  - Create `applyContextFilter()` that works for both contexts
  - Use shared NLP parser logic (client-side version or duplicate logic)
  - Filter cached results without API call
  - Update appropriate context (OSDU or catalog)
  - Update map markers to match filtered results
  - _Requirements: 2.2, 2.3, 6.2, 6.3, 7.1, 7.2_

- [x] 4.4 Add context reset logic
  - Clear catalogContext when user starts new search
  - Clear catalogContext when user says "show all" or "reset"
  - Clear appropriate context when switching search types
  - Restore original unfiltered results when requested
  - _Requirements: 2.5, 6.5, 7.4_

- [x] 5.1 Update map markers when catalog results change
  - Extract well coordinates from catalog records (24 LAS files)
  - Create map markers for all wells with valid coordinates
  - Update map bounds to fit all markers
  - Display "No location data available" when no coordinates
  - _Requirements: 3.1, 3.5_

- [x] 5.2 Filter map markers when catalog results are filtered
  - Listen for changes to filteredRecords in catalogContext
  - Remove markers for wells not in filtered results
  - Update map markers when conversational filtering occurs
  - Keep map synchronized with table at all times
  - _Requirements: 3.2_

- [x] 5.3 Ensure map works for both OSDU and catalog contexts
  - Map updates correctly for OSDU filtered results (needs testing)
  - Map updates correctly for catalog filtered results (new)
  - Switching between contexts updates map appropriately
  - No interference between OSDU and catalog map states
  - _Requirements: 3.1, 3.2, 7.5_

- [x] 6.1 Deploy backend Lambda changes
  - Deploy shared NLP parser utility
  - Deploy enhanced Catalog Lambda with filtering
  - Deploy updated OSDU Lambda with shared parser
  - Run: `cd cdk && npm run deploy`
  - Verify deployment succeeds
  - Check CloudWatch logs for any errors
  - _Requirements: All backend requirements_

- [ ] 6.2 Test OSDU conversational filtering on localhost
  - **Test file created:** `test-osdu-catalog-conversational-filtering.html`
  - Open http://localhost:3000/catalog and follow test cases
  - Start localhost: `npm run dev`
  - Query "show me osdu wells" → verify all wells returned
  - Query "show me wells in the north sea" → verify only North Sea wells
  - Query "show me BP wells" → verify only BP wells
  - Query "show me USA wells" → verify only USA-prefixed wells
  - Query with multiple criteria → verify AND logic works
  - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3_

- [ ] 6.3 Test catalog conversational filtering on localhost
  - Query "show me my wells" → verify all 24 LAS files returned
  - Query "just the ones near Brunei" → verify only Brunei wells
  - Query "only wells deeper than 3000m" → verify depth filtering works
  - Query "show me wells in Malaysia" → verify Malaysia wells
  - Query "show all wells again" → verify original 24 files restored
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.4 Test context persistence for both search types
  - OSDU: Initial query → follow-up filter → verify no API call
  - Catalog: Initial query → follow-up filter → verify no API call
  - Switch between OSDU and catalog → verify separate contexts
  - Query "show all" → verify appropriate context restored
  - New search → verify appropriate context cleared
  - _Requirements: 2.2, 2.3, 4.2, 4.3, 7.4, 7.5_

- [ ] 6.5 Test map synchronization for both search types
  - OSDU search → verify map markers appear
  - OSDU filter → verify map markers update
  - Catalog search → verify map markers appear
  - Catalog filter → verify map markers update
  - Switch between contexts → verify map updates correctly
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 6.6 Test consistency across search types
  - Same filter command works for OSDU and catalog
  - "just the ones near X" works for both
  - "only wells deeper than X" works for both
  - "show all" works for both
  - Verify consistent UX across all search types
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
