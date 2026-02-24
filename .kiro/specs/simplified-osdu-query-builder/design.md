# Simplified OSDU Query Builder Bugfix Design

## Overview

Three compounding bugs make the OSDU Query Builder unusable: (1) it renders inline inside the scrollable `messages-container` div, so it scrolls away while the toggle button stays fixed; (2) the component is ~2000 lines of bloat with templates, analytics, history, autocomplete, syntax highlighting, modals, and 3 dropdowns per criterion — overwhelming for simple data discovery; (3) it uses `executeOSDUQuery` from `osduQueryExecutor.ts` → `searchOSDU` from `src/lib/api/osdu.ts`, a completely different API path than the working NLP flow which uses `searchOSDU` from `src/lib/api/catalog.ts`.

The fix replaces the bloated component with a minimal one, moves it out of the scrollable container, and routes execution through the same `searchOSDU(query, maxResults)` from `catalog.ts` that the NLP path uses.

## Glossary

- **Bug_Condition (C)**: The three conditions that make the query builder unusable — scroll-away positioning, bloated UI, wrong API path
- **Property (P)**: Query builder stays visible, presents minimal UI, and executes through the same API path as NLP queries
- **Preservation**: Existing NLP OSDU search flow, toggle state management, result handling pipeline (GeoJSON, map, table, context) must remain unchanged
- **`searchOSDU` (catalog.ts)**: The correct function at `src/lib/api/catalog.ts` — signature: `searchOSDU(query: string, maxResults: number)` → sends `{ query, maxResults }` to `/api/osdu/search`
- **`searchOSDU` (osdu.ts)**: The wrong function at `src/lib/api/osdu.ts` — signature: `searchOSDU(request: OSDUSearchRequest)` → sends `{ query, dataPartition, maxResults }` to `/api/osdu/search`
- **`executeOSDUQuery`**: The wrong executor at `src/utils/osduQueryExecutor.ts` that wraps `searchOSDU` from `osdu.ts` with analytics tracking
- **`handleChatSearch`**: The function in `CatalogPage.tsx` that handles NLP queries, detects OSDU intent, and calls `searchOSDU` from `catalog.ts`
- **`handleQueryBuilderExecution`**: The function in `CatalogPage.tsx` that currently handles query builder execution using the wrong `executeOSDUQuery` path
- **NLP OSDU path**: User types "show me OSDU wells" → `handleChatSearch` → detects `osdu` keyword → `searchOSDU(prompt, 1000)` from `catalog.ts` → GeoJSON conversion → map update → table in chat → context saving

## Bug Details

### Fault Condition

The bug manifests in three compounding ways: (1) when the user opens the query builder and scrolls chat, the builder scrolls out of view because it's rendered inside `messages-container` which has `overflow-y: auto`; (2) when the user tries to build a query, they face a ~2000-line component with templates, analytics dashboards, history, autocomplete, syntax highlighting, modals, and 3 dropdowns per criterion row; (3) when the user executes a query, it calls `executeOSDUQuery` which uses `searchOSDU` from `osdu.ts` instead of `searchOSDU` from `catalog.ts`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: 'scroll' | 'build_query' | 'execute_query', context: UIState }
  OUTPUT: boolean

  // Bug 1: Scroll positioning
  IF input.action == 'scroll' AND queryBuilderIsOpen(input.context)
    RETURN queryBuilderRenderedInsideScrollableContainer(input.context)

  // Bug 2: UI bloat
  IF input.action == 'build_query'
    RETURN componentHasTemplates(input.context)
           OR componentHasAnalytics(input.context)
           OR componentHasHistory(input.context)
           OR componentHasAutocomplete(input.context)
           OR componentHasSyntaxHighlighting(input.context)
           OR componentHasModals(input.context)
           OR criterionRowHasMoreThanTwoDropdowns(input.context)

  // Bug 3: Wrong API path
  IF input.action == 'execute_query'
    RETURN executionUsesOsduQueryExecutor(input.context)
           OR executionUsesSearchOSDUFromOsduTs(input.context)
           OR NOT executionUsesSearchOSDUFromCatalogTs(input.context)

  RETURN false
END FUNCTION
```

### Examples

- User opens query builder, scrolls chat down 500px → query builder scrolls out of view, toggle button stays fixed at bottom → expected: query builder stays visible regardless of scroll position
- User opens query builder to find wells by operator → sees templates panel, analytics dashboard, history sidebar, autocomplete suggestions, syntax-highlighted preview, 3 dropdowns per row → expected: sees only data type dropdown + optional field/value filter
- User selects "Well" data type, adds filter "operator = Shell", clicks Search → system calls `executeOSDUQuery("data.WellName:* AND data.Operator:Shell")` via `osdu.ts` → expected: system constructs "show me OSDU wells where operator is Shell" and calls `searchOSDU("show me OSDU wells where operator is Shell", 1000)` from `catalog.ts`
- User selects "Well" data type with no filters, clicks Search → expected: system calls `searchOSDU("show me OSDU wells", 1000)` from `catalog.ts`, identical to typing "show me OSDU wells" in chat

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- NLP OSDU queries typed in chat (e.g., "show me OSDU wells") must continue to use `searchOSDU` from `catalog.ts` via `handleChatSearch` with identical behavior
- The `showQueryBuilder` state toggle in `CatalogPage.tsx` and its pass-through to `CatalogChatBoxCloudscape` must continue to work
- Query results must continue to display in chat messages, update the map with GeoJSON well coordinates, and populate the OSDU search context for subsequent filtering
- Closing the query builder must continue to set `showQueryBuilder` to false without affecting chat or map state
- Mouse clicks, other keyboard inputs, voice input, and all non-query-builder interactions must remain unchanged

**Scope:**
All inputs that do NOT involve the query builder component should be completely unaffected by this fix. This includes:
- NLP chat queries (both OSDU and catalog)
- Map interactions (pan, zoom, polygon drawing)
- File drawer operations
- Collection creation flow
- Voice transcription flow
- Weather layer controls

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Inline Rendering in Scrollable Container**: In `CatalogChatBoxCloudscape.tsx` (line ~400), the `OSDUQueryBuilder` is rendered inside the `messages-container` div which has `overflow-y: auto`. The query builder is a sibling of chat messages inside this scrollable div, so it scrolls with them. The fix is to move the query builder rendering OUTSIDE the `messages-container` div, positioning it as a fixed/sticky overlay or above the scrollable area.

2. **Bloated Component Architecture**: `OSDUQueryBuilder.tsx` grew to ~2000 lines by accumulating features (templates, analytics, history, autocomplete, syntax highlighting, modals, 3 dropdowns per criterion). The fix is to replace it entirely with a minimal component: one data type dropdown + optional field/value filter row.

3. **Wrong API Import Path**: `handleQueryBuilderExecution` in `CatalogPage.tsx` (line ~1260) calls `executeOSDUQuery` from `osduQueryExecutor.ts`, which imports `searchOSDU` from `src/lib/api/osdu.ts`. This function has signature `searchOSDU(request: OSDUSearchRequest)` sending `{ query, dataPartition, maxResults }`. The NLP path uses `searchOSDU(query: string, maxResults: number)` from `src/lib/api/catalog.ts` sending `{ query, maxResults }`. The fix is to have the query builder construct a natural language string and call `searchOSDU` from `catalog.ts` directly, or better yet, feed the constructed NL query through the existing `handleChatSearch` flow.

4. **Different Result Handling**: The current `handleQueryBuilderExecution` has its own result processing (using `convertOSDUToWellData` from `osduQueryExecutor.ts`, formatting as `osdu-search-response` code block). The NLP path in `handleChatSearch` has different result processing (direct GeoJSON conversion, `json-table-data` format, different context saving). The fix should use the same result handling as the NLP path.

## Correctness Properties

Property 1: Fault Condition - Query Builder Uses Correct API Path

_For any_ query builder execution where the user selects a data type and optional field/value filters, the simplified query builder SHALL construct a natural language query string (e.g., "show me OSDU wells where operator is Shell") and pass it to `searchOSDU(query, maxResults)` from `src/lib/api/catalog.ts` — the exact same function and signature the NLP path uses — NOT `executeOSDUQuery` from `osduQueryExecutor.ts` or `searchOSDU` from `src/lib/api/osdu.ts`.

**Validates: Requirements 2.5, 3.1**

Property 2: Preservation - NLP OSDU Path Unchanged

_For any_ natural language query typed in the chat input that contains the word "osdu" (e.g., "show me OSDU wells"), the `handleChatSearch` function SHALL continue to detect OSDU intent, call `searchOSDU(prompt, 1000)` from `src/lib/api/catalog.ts`, convert results to GeoJSON, update the map, display table data in chat, and save OSDU context — producing exactly the same behavior as before the fix.

**Validates: Requirements 3.3, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/SimplifiedOSDUQueryBuilder.tsx` (NEW)

**Purpose**: Replace the bloated `OSDUQueryBuilder.tsx` with a minimal component.

**Specific Changes**:
1. **Create minimal component**: Data type dropdown (Well, Wellbore, Log, Seismic) + optional single field/value filter row + Search button + Close button. No templates, no analytics, no history, no autocomplete, no syntax highlighting, no modals.
2. **Natural language query construction**: When user clicks Search, construct a string like `"show me OSDU wells"` or `"show me OSDU wells where operator is Shell"` from dropdown selections.
3. **Callback interface**: `onExecute(naturalLanguageQuery: string)` — passes the constructed NL query string back to the parent. No criteria array, no structured query.

**File**: `src/components/CatalogChatBoxCloudscape.tsx`

**Function**: `CatalogChatBoxCloudscape`

**Specific Changes**:
4. **Move query builder outside scrollable container**: Render the query builder ABOVE the `messages-container` div (not inside it). When `showQueryBuilder` is true, the builder appears as a fixed panel above the chat messages. When false, it collapses and messages take full height.
5. **Import new component**: Replace `OSDUQueryBuilder` import with `SimplifiedOSDUQueryBuilder`.
6. **Simplify callback**: Pass `onExecute(query: string)` instead of `onExecute(query, criteria)`.

**File**: `src/pages/CatalogPage.tsx`

**Function**: `handleQueryBuilderExecution`

**Specific Changes**:
7. **Rewrite to use correct API path**: Instead of calling `executeOSDUQuery`, the handler should call `searchOSDU(query, 1000)` from `src/lib/api/catalog.ts` with the natural language query string constructed by the simplified component.
8. **Use same result handling as NLP path**: Copy the result handling from the NLP OSDU block in `handleChatSearch` (lines 1730-1890) — same GeoJSON conversion, same map update, same `json-table-data` table format, same context saving. Or better: extract the NLP OSDU result handling into a shared helper and call it from both paths.
9. **Remove `executeOSDUQuery` import**: Stop importing from `osduQueryExecutor.ts`.
10. **Update callback signature**: Change from `(query: string, criteria: QueryCriterion[])` to `(query: string)`.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Inspect the DOM structure and API call paths in the unfixed code to confirm the three bugs exist.

**Test Cases**:
1. **Scroll Position Test**: Open query builder, scroll chat → verify query builder scrolls out of view (confirms Bug 1 — inline rendering)
2. **Component Bloat Test**: Render `OSDUQueryBuilder` → verify it contains templates, analytics, history, autocomplete, syntax highlighting, modals (confirms Bug 2 — bloat)
3. **API Path Test**: Execute a query from the builder → verify it calls `executeOSDUQuery` which calls `searchOSDU` from `osdu.ts` instead of `catalog.ts` (confirms Bug 3 — wrong path)
4. **Payload Comparison Test**: Compare the request payload sent by query builder vs NLP path → verify they differ (confirms Bug 3 — different payloads)

**Expected Counterexamples**:
- Query builder DOM element is a child of `messages-container` div
- `OSDUQueryBuilder` component renders >10 distinct UI sections
- Network request from query builder sends `{ query, dataPartition, maxResults }` instead of `{ query, maxResults }`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedComponent(input)
  IF input.action == 'scroll'
    ASSERT queryBuilderRemainsVisible(result)
  IF input.action == 'build_query'
    ASSERT componentIsMinimal(result)
  IF input.action == 'execute_query'
    ASSERT usesSearchOSDUFromCatalogTs(result)
    ASSERT constructsNaturalLanguageQuery(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleChatSearch_original(input) = handleChatSearch_fixed(input)
  ASSERT toggleBehavior_original(input) = toggleBehavior_fixed(input)
  ASSERT resultHandling_original(input) = resultHandling_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for NLP queries and toggle interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **NLP Query Preservation**: Verify typing "show me OSDU wells" in chat continues to call `searchOSDU` from `catalog.ts` with identical behavior after fix
2. **Toggle State Preservation**: Verify `showQueryBuilder` state toggle continues to work through `CatalogPage` → `CatalogChatBoxCloudscape` prop chain
3. **Result Pipeline Preservation**: Verify OSDU results continue to produce GeoJSON map data, table data in chat, and OSDU context saving
4. **Close Behavior Preservation**: Verify closing query builder sets `showQueryBuilder` to false without affecting chat or map

### Unit Tests

- Test `SimplifiedOSDUQueryBuilder` renders only data type dropdown + optional field/value filter + Search/Close buttons
- Test natural language query construction: data type "Well" → "show me OSDU wells"; data type "Well" + field "operator" + value "Shell" → "show me OSDU wells where operator is Shell"
- Test query builder renders OUTSIDE the `messages-container` div
- Test `handleQueryBuilderExecution` calls `searchOSDU` from `catalog.ts` (not `executeOSDUQuery`)

### Property-Based Tests

- Generate random data type + field/value combinations → verify constructed NL query always contains "OSDU" keyword and data type name
- Generate random NLP chat queries containing "osdu" → verify `handleChatSearch` produces identical results before and after fix
- Generate random scroll positions → verify query builder visibility is independent of scroll state

### Integration Tests

- Test full flow: open query builder → select "Well" → click Search → verify `searchOSDU` from `catalog.ts` is called → verify results appear in chat + map + context
- Test flow parity: compare results of query builder "show me OSDU wells" vs typing "show me OSDU wells" in chat → verify identical API calls and result handling
- Test toggle lifecycle: open → use → execute → auto-close → verify state consistency
