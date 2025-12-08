# Requirements Document

## Introduction

**This is a REGRESSION FIX** - restoring OSDU conversational search functionality that worked before but is now broken.

The OSDU conversational search has multiple critical regressions:
1. Returns the same 50 hardcoded demo records regardless of query content
2. Does not filter results based on natural language queries
3. Does not maintain conversation context for follow-up filtering
4. Map does not synchronize with search results table
5. Prompt input has inconsistent border radius (4px instead of 8px)

**Important**: If OSDU API has real data, use it. If not, keep demo data BUT make it filterable via NLP.

This feature will restore conversational filtering, map synchronization, context persistence, and fix styling issues.

## Glossary

- **OSDU**: Open Subsurface Data Universe - an external data platform for oil & gas well data
- **Demo Data**: The 50 sample OSDU records returned when real OSDU API credentials are not configured
- **Conversational Filtering**: The ability to refine search results through natural language follow-up queries
- **Query Parsing**: Extracting filter criteria (location, operator, well name) from natural language queries
- **Prompt Input**: The expandable text input component used for entering search queries
- **Border Radius**: The CSS property controlling the roundness of element corners

## Requirements

### Requirement 1

**User Story:** As a user searching OSDU data, I want my conversational queries to filter results intelligently, so that I can find specific wells by location, operator, or name.

#### Acceptance Criteria

1. WHEN a user queries "show me wells in the north sea" THEN the system SHALL return only wells where location contains "North Sea"
2. WHEN a user queries "show me BP wells" THEN the system SHALL return only wells where operator equals "BP"
3. WHEN a user queries "show me USA wells" THEN the system SHALL return only wells where name starts with "USA"
4. WHEN the OSDU API is configured AND has data THEN the system SHALL use real OSDU API data
5. WHEN the OSDU API is NOT configured OR has no data THEN the system SHALL use filterable demo data

### Requirement 2

**User Story:** As a user, I want to refine my search results through follow-up conversational queries, so that I can progressively filter to exactly what I need.

#### Acceptance Criteria

1. WHEN a user queries "show me osdu wells" THEN the system SHALL store the full result set in conversation context
2. WHEN a user follows up with "show me only wells in the north sea" THEN the system SHALL filter the previous results by location
3. WHEN a user follows up with "show me only BP wells" THEN the system SHALL further filter by operator
4. WHEN a user starts a new search THEN the system SHALL clear previous context and start fresh
5. WHEN a user asks "show me all wells again" THEN the system SHALL restore the original unfiltered results

### Requirement 3

**User Story:** As a user, I want the map to automatically update when I search or filter OSDU wells, so that I can see the geographic distribution of my results.

#### Acceptance Criteria

1. WHEN a user searches for OSDU wells THEN the map SHALL display markers for all returned wells with coordinates
2. WHEN a user filters results conversationally THEN the map SHALL update to show only the filtered wells
3. WHEN a user clicks a well marker on the map THEN the corresponding row in the table SHALL be highlighted
4. WHEN a user clicks a well row in the table THEN the map SHALL center on that well's marker
5. WHEN search results have no coordinates THEN the map SHALL display a message indicating "No location data available"

### Requirement 4

**User Story:** As a user, I want the system to maintain my search context across multiple queries, so that I can progressively refine my results without repeating myself.

#### Acceptance Criteria

1. WHEN a user performs an OSDU search THEN the system SHALL store the full result set in osduContext state
2. WHEN a user performs a follow-up query THEN the system SHALL check if osduContext exists before making a new API call
3. WHEN osduContext exists THEN the system SHALL filter the cached results instead of calling the API again
4. WHEN a user explicitly requests "all wells" or "reset" THEN the system SHALL clear osduContext and show original results
5. WHEN a user switches to a different search type THEN the system SHALL clear osduContext

### Requirement 5

**User Story:** As a user, I want the system to handle both real OSDU API data and demo data intelligently, so that I can test functionality even without API access.

#### Acceptance Criteria

1. WHEN OSDU_API_URL and OSDU_API_KEY are configured AND API returns data THEN the system SHALL use real OSDU data
2. WHEN OSDU_API_URL and OSDU_API_KEY are NOT configured THEN the system SHALL use filterable demo data
3. WHEN OSDU API is configured BUT returns no data THEN the system SHALL fall back to filterable demo data
4. WHEN using demo data THEN the system SHALL clearly indicate "(Demo Data)" in the response
5. WHEN using real OSDU data THEN the system SHALL indicate "(OSDU API)" in the response

### Requirement 6

**User Story:** As a user, I want the FIRST prompt input box in the conversation to have consistent 8px border radius, so that the UI appears polished and professional.

#### Acceptance Criteria

1. WHEN a user views the catalog page THEN the FIRST prompt input box SHALL have 8px border radius on all four corners
2. WHEN a user views the catalog page THEN the FIRST prompt SHALL NOT have extra/inconsistent border radius on the top-right corner
3. WHEN a user views subsequent prompts THEN they SHALL maintain correct 8px border radius (already working)
4. WHEN a user compares the FIRST prompt to subsequent prompts THEN the border radius SHALL be visually consistent
5. WHEN a user inspects the CSS THEN the FIRST prompt SHALL have border-radius: 8px on all corners

