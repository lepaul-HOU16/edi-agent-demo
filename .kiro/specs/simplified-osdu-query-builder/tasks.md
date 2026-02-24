# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Wrong API Path and Bloated Component
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases:
    - Import `handleQueryBuilderExecution` or trace its call path — verify it calls `executeOSDUQuery` from `osduQueryExecutor.ts` (wrong path) instead of `searchOSDU` from `src/lib/api/catalog.ts` (correct path)
    - Verify `OSDUQueryBuilder` component renders templates, analytics, history, autocomplete, syntax highlighting, modals (bloat indicators)
    - Verify query builder is rendered INSIDE the `messages-container` div (scroll bug)
  - Test that for any data type selection (Well, Wellbore, Log, Seismic) with optional field/value filter, the query builder execution path uses `searchOSDU` from `catalog.ts` with a natural language query string — NOT `executeOSDUQuery` from `osduQueryExecutor.ts`
  - Test that the query builder component renders only: data type dropdown + optional field/value filter + Search/Close buttons (no templates, analytics, history, autocomplete, syntax highlighting, modals)
  - Run test on UNFIXED code - expect FAILURE (this confirms the bug exists)
  - Document counterexamples found (e.g., "handleQueryBuilderExecution calls executeOSDUQuery instead of searchOSDU from catalog.ts", "OSDUQueryBuilder renders 10+ UI sections instead of minimal interface")
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - NLP OSDU Path and Toggle State Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code**:
    - Observe: `handleChatSearch` with query containing "osdu" calls `searchOSDU` from `catalog.ts` with `(prompt, 1000)` signature
    - Observe: `showQueryBuilder` state toggle flows from `CatalogPage` → `CatalogChatBoxCloudscape` via props
    - Observe: OSDU results go through GeoJSON conversion → map update → `json-table-data` table in chat → context saving
    - Observe: Closing query builder sets `showQueryBuilder` to false without affecting chat or map state
  - Write property-based tests:
    - For all NLP queries containing "osdu" keyword, `handleChatSearch` continues to call `searchOSDU(prompt, 1000)` from `catalog.ts` — not affected by query builder changes
    - For all toggle interactions, `showQueryBuilder` state continues to propagate correctly through the component tree
    - For all OSDU search results, the result pipeline (GeoJSON, map, table, context) produces identical output
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for simplified OSDU query builder (scroll, bloat, wrong API path)

  - [x] 3.1 Create `SimplifiedOSDUQueryBuilder.tsx` minimal component
    - Create new file `src/components/SimplifiedOSDUQueryBuilder.tsx`
    - Data type dropdown: Well, Wellbore, Log, Seismic
    - Optional single field/value filter row (field name input + value input)
    - Search button and Close button
    - Construct natural language query string on Search: e.g., "show me OSDU wells" or "show me OSDU wells where operator is Shell"
    - Callback interface: `onExecute(naturalLanguageQuery: string)` and `onClose()`
    - NO templates, analytics, history, autocomplete, syntax highlighting, modals
    - _Bug_Condition: componentHasTemplates OR componentHasAnalytics OR componentHasHistory OR componentHasAutocomplete OR componentHasSyntaxHighlighting OR componentHasModals OR criterionRowHasMoreThanTwoDropdowns_
    - _Expected_Behavior: componentIsMinimal — only data type dropdown + optional field/value filter + Search/Close buttons_
    - _Preservation: Existing NLP flow, toggle state, result handling unchanged_
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 3.2 Update `CatalogChatBoxCloudscape.tsx` — move query builder outside scrollable container and swap import
    - Replace `OSDUQueryBuilder` import with `SimplifiedOSDUQueryBuilder`
    - Move query builder rendering OUTSIDE the `messages-container` div — render it ABOVE the scrollable container so it stays fixed/visible
    - Update callback from `onExecute(query, criteria)` to `onExecute(query: string)`
    - _Bug_Condition: queryBuilderRenderedInsideScrollableContainer — query builder is child of messages-container div with overflow-y: auto_
    - _Expected_Behavior: queryBuilderRemainsVisible — rendered outside scrollable container, stays visible regardless of scroll position_
    - _Preservation: Toggle state showQueryBuilder continues to work, close behavior unchanged_
    - _Requirements: 2.1, 3.2, 3.4_

  - [x] 3.3 Rewrite `handleQueryBuilderExecution` in `CatalogPage.tsx` to use correct API path
    - Change `handleQueryBuilderExecution` to accept `(query: string)` instead of `(query: string, criteria: QueryCriterion[])`
    - Call `searchOSDU(query, 1000)` from `src/lib/api/catalog.ts` (same as NLP path) instead of `executeOSDUQuery` from `osduQueryExecutor.ts`
    - Use same result handling as NLP OSDU block in `handleChatSearch`: GeoJSON conversion → map update → `json-table-data` table in chat → context saving
    - Remove import of `executeOSDUQuery` and `convertOSDUToWellData` from `osduQueryExecutor.ts`
    - _Bug_Condition: executionUsesOsduQueryExecutor OR executionUsesSearchOSDUFromOsduTs OR NOT executionUsesSearchOSDUFromCatalogTs_
    - _Expected_Behavior: usesSearchOSDUFromCatalogTs AND constructsNaturalLanguageQuery — identical API path as NLP flow_
    - _Preservation: NLP OSDU path in handleChatSearch completely unchanged, result pipeline identical_
    - _Requirements: 2.5, 3.1, 3.3, 3.5_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct API Path and Minimal Component
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied:
      - Query builder uses `searchOSDU` from `catalog.ts` (not `executeOSDUQuery`)
      - Component is minimal (no bloat features)
      - Query builder renders outside scrollable container
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - NLP OSDU Path and Toggle State Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm NLP OSDU path, toggle state, result pipeline, and close behavior all unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
