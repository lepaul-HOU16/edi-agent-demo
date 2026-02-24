# Bugfix Requirements Document

## Introduction

The OSDU Query Builder has three compounding bugs: (1) it is rendered inline inside the scrollable `messages-container` div in `CatalogChatBoxCloudscape.tsx`, causing it to scroll away when the user scrolls chat messages — while the toggle button remains fixed-position, creating a disconnect; (2) the query builder itself (`OSDUQueryBuilder.tsx`) is a ~2000-line bloated component with templates, analytics dashboards, query history, autocomplete, syntax highlighting, save-as-template modals, help modals, and excessive field/operator/value dropdown combinations that overwhelm users trying to do simple data discovery; and (3) the query builder uses a completely different API execution path (`executeOSDUQuery` via `osduQueryExecutor.ts` → `searchOSDU` from `src/lib/api/osdu.ts`) than the working NLP path (which uses `searchOSDU` from `src/lib/api/catalog.ts`), meaning the query builder bypasses the proven OSDU search pipeline that successfully handles natural language queries like "show me OSDU wells". The result is a query builder that is unusable (scrolls away), overcomplicated (too many dropdowns and features), and unreliable (uses the wrong API path).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user toggles the query builder open and then scrolls the chat messages THEN the query builder scrolls out of view because it is rendered inline inside the `messages-container` div which has `overflow-y: auto`, while the toggle button remains fixed-position at the bottom of the viewport

1.2 WHEN the user opens the query builder to perform data discovery THEN the system presents a ~2000-line component with templates, analytics dashboards, query history, autocomplete, syntax highlighting, save-as-template modals, help modals, and 3 dropdowns per filter criterion (field, operator, value) plus a data type dropdown, making simple schema variable selection unnecessarily complex

1.3 WHEN the user adds a filter criterion in the current query builder THEN the system requires selecting from 3 separate dropdowns (field, operator, value) per criterion row, creating excessive interaction overhead for basic data discovery queries

1.4 WHEN the user wants to search for data by schema type THEN the system forces navigation through an overwhelming number of field/operator combinations instead of providing a concise, focused interface for selecting schema variables to search and retrieve

1.5 WHEN the user executes a query from the query builder THEN the system calls `executeOSDUQuery` from `osduQueryExecutor.ts` which uses `searchOSDU` from `src/lib/api/osdu.ts` — a completely different API execution path than the NLP flow which uses `searchOSDU` from `src/lib/api/catalog.ts`, meaning the query builder bypasses the proven OSDU search pipeline and sends structured SQL-like query strings instead of natural language queries that the backend is designed to process

### Expected Behavior (Correct)

2.1 WHEN the user toggles the query builder open and scrolls the chat messages THEN the query builder SHALL remain in a fixed/sticky position that does not scroll away with the chat content, maintaining accessibility regardless of scroll position

2.2 WHEN the user opens the query builder to perform data discovery THEN the system SHALL present a drastically simplified drawer with minimal UI — focused on data type selection and field selection with smart defaults, removing all bloat (templates, analytics, history, autocomplete, syntax highlighting, modals)

2.3 WHEN the user adds a filter criterion THEN the system SHALL require as few dropdowns as possible — ideally just a field selector with smart operator/value defaults — to minimize interaction overhead for basic data discovery

2.4 WHEN the user wants to search for data by schema type THEN the system SHALL provide a concise drawer focused on selecting schema variables to search and retrieve, ensuring data discovery success in as compact a UI as possible

2.5 WHEN the user executes a query from the simplified query builder THEN the system SHALL construct a natural language query string from the user's dropdown selections (e.g., selecting data type "well" and field "operator" with value "Shell" produces "show me OSDU wells where operator is Shell") and pass it to the same `searchOSDU(query, maxResults)` function from `src/lib/api/catalog.ts` that the NLP path uses, ensuring identical backend processing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user executes a query from the simplified query builder THEN the system SHALL use the same `searchOSDU` from `src/lib/api/catalog.ts` and the same OSDU result handling pipeline (GeoJSON conversion, map display, table data, context saving) that the NLP OSDU path uses in CatalogPage — the query builder SHALL NOT use `executeOSDUQuery` from `osduQueryExecutor.ts` or `searchOSDU` from `src/lib/api/osdu.ts`

3.2 WHEN the user toggles the query builder via the IconButton in CatalogPage THEN the system SHALL CONTINUE TO use the existing `showQueryBuilder` state toggle mechanism and pass the state through to `CatalogChatBoxCloudscape`

3.3 WHEN query results are returned from the OSDU API THEN the system SHALL CONTINUE TO display results in the chat messages, update the map with well coordinates, and populate the OSDU search context for subsequent filtering — all existing result handling remains unchanged

3.4 WHEN the user closes the query builder (via close button or after execution) THEN the system SHALL CONTINUE TO set `showQueryBuilder` to false, collapsing the drawer without affecting chat messages or map state

3.5 WHEN the user types a natural language OSDU query in the chat (e.g., "show me OSDU wells") THEN the system SHALL CONTINUE TO use the existing NLP OSDU path (`searchOSDU` from `src/lib/api/catalog.ts`) with identical behavior — the query builder changes SHALL NOT alter the NLP flow in any way
