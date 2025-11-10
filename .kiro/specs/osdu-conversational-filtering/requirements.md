# Requirements Document

## Introduction

This specification defines conversational filtering capabilities for OSDU search results in the Data Catalog. Users should be able to apply natural language filters to previously displayed OSDU well data without needing to repeat "OSDU" in every query. The system must maintain conversation context and intelligently apply filters to the current result set.

## Glossary

- **OSDU Search Context**: The state containing the most recent OSDU search query and results
- **Conversational Filter**: A natural language query that refines or filters existing OSDU results
- **Filter Intent**: User intent to narrow down, sort, or modify currently displayed data
- **Context Inheritance**: The ability to carry forward search context across multiple queries
- **CatalogChatBoxCloudscape**: The chat component that manages conversation state
- **OSDU Proxy Lambda**: Backend function that queries the OSDU API

## Requirements

### Requirement 1: Maintain OSDU Search Context

**User Story:** As a geoscientist, I want the system to remember my previous OSDU search results, so that I can apply filters without repeating the full query.

#### Acceptance Criteria

1. WHEN the System receives an OSDU search response, THE System SHALL store the query, results, and metadata in conversation context
2. WHEN the System stores OSDU context, THE System SHALL include the original query text, record count, and full record array
3. WHEN the System processes a new query, THE System SHALL check if OSDU context exists from previous queries
4. WHERE OSDU context exists, THE System SHALL make it available to intent detection and query processing
5. WHILE maintaining context, THE System SHALL preserve context for the duration of the chat session

### Requirement 2: Detect Filter Intent

**User Story:** As a geoscientist, I want to use natural language to filter my OSDU results, so that I can quickly narrow down to relevant wells.

#### Acceptance Criteria

1. WHEN the System receives a query with filter keywords, THE System SHALL detect filter intent
2. WHEN the System detects filter intent, THE System SHALL identify the filter type (operator, location, depth, type, status)
3. WHERE OSDU context exists, THE System SHALL prioritize filter intent over new search intent
4. WHEN the System detects ambiguous intent, THE System SHALL check for OSDU context before defaulting to new search
5. THE System SHALL recognize filter keywords including: "filter", "show only", "where", "with", "operator", "location", "depth", "type", "status"

### Requirement 3: Apply Client-Side Filters

**User Story:** As a geoscientist, I want filters applied instantly without making new API calls, so that I can iterate quickly through my data.

#### Acceptance Criteria

1. WHEN the System applies a filter, THE System SHALL filter the existing OSDU records array client-side
2. WHEN the System filters by operator, THE System SHALL match operator field case-insensitively
3. WHEN the System filters by location, THE System SHALL match location or country fields case-insensitively
4. WHEN the System filters by depth, THE System SHALL parse depth values and apply numeric comparisons
5. WHEN the System filters by type, THE System SHALL match type field case-insensitively
6. WHERE multiple filters are specified, THE System SHALL apply all filters using AND logic
7. WHILE filtering, THE System SHALL preserve the original unfiltered results for potential reset

### Requirement 4: Display Filtered Results

**User Story:** As a geoscientist, I want filtered results displayed in the same format as original results, so that I have a consistent experience.

#### Acceptance Criteria

1. WHEN the System displays filtered results, THE System SHALL use the existing OSDUSearchResponse component
2. WHEN the System shows filtered data, THE System SHALL update the record count to reflect filtered count
3. WHEN the System presents filtered results, THE System SHALL include a message indicating the filter applied
4. WHERE no records match the filter, THE System SHALL display a "no results" message with the filter criteria
5. WHILE showing filtered results, THE System SHALL provide a way to view the original unfiltered results

### Requirement 5: Support Multiple Filter Types

**User Story:** As a geoscientist, I want to filter by various well attributes, so that I can find exactly the data I need.

#### Acceptance Criteria

1. THE System SHALL support filtering by operator name
2. THE System SHALL support filtering by location or country
3. THE System SHALL support filtering by depth range (greater than, less than, between)
4. THE System SHALL support filtering by well type
5. THE System SHALL support filtering by status
6. WHERE the System encounters an unsupported filter, THE System SHALL display a helpful message listing supported filters

### Requirement 6: Handle Filter Errors Gracefully

**User Story:** As a geoscientist, I want clear feedback when filters cannot be applied, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN the System cannot parse a filter query, THE System SHALL display an error message with examples
2. WHERE no OSDU context exists, THE System SHALL inform the user to perform an OSDU search first
3. WHEN a filter returns zero results, THE System SHALL suggest broadening the filter criteria
4. IF the System encounters invalid filter values, THE System SHALL explain the expected format
5. WHILE processing filters, THE System SHALL log filter operations for debugging

### Requirement 7: Preserve Original Search Context

**User Story:** As a geoscientist, I want to reset filters and return to original results, so that I can start over if needed.

#### Acceptance Criteria

1. THE System SHALL maintain both filtered and original OSDU results in context
2. WHEN the System applies a filter, THE System SHALL not modify the original results array
3. WHERE the user requests "show all" or "reset", THE System SHALL display the original unfiltered results
4. WHEN the System resets filters, THE System SHALL clear any active filter state
5. WHILE maintaining context, THE System SHALL preserve original results until a new OSDU search is performed

### Requirement 8: Support Conversational Follow-ups

**User Story:** As a geoscientist, I want to apply multiple filters in sequence, so that I can progressively narrow down my results.

#### Acceptance Criteria

1. WHEN the System applies a filter, THE System SHALL update the context with filtered results
2. WHERE a second filter is applied, THE System SHALL filter the already-filtered results
3. WHEN the System processes sequential filters, THE System SHALL maintain a filter history
4. IF the user requests "undo" or "previous", THE System SHALL revert to the previous filter state
5. WHILE applying sequential filters, THE System SHALL display the cumulative filter criteria

### Requirement 9: Integrate with Existing Chat UI

**User Story:** As a geoscientist, I want filter operations to feel natural in the chat interface, so that the experience is seamless.

#### Acceptance Criteria

1. WHEN the System processes a filter, THE System SHALL add user and AI messages to the chat
2. WHEN the System displays filtered results, THE System SHALL use the existing message components
3. WHERE filters are applied, THE System SHALL maintain auto-scroll and interaction behaviors
4. WHEN the System shows filter results, THE System SHALL include filter badges or indicators
5. WHILE filtering, THE System SHALL provide loading indicators for consistency

### Requirement 10: Provide Filter Examples and Help

**User Story:** As a geoscientist, I want examples of filter queries, so that I know how to use the feature effectively.

#### Acceptance Criteria

1. THE System SHALL provide filter examples in error messages when filters fail
2. WHERE the user asks for help, THE System SHALL list supported filter types and syntax
3. WHEN the System displays OSDU results, THE System SHALL include a hint about filtering capabilities
4. IF the user enters an ambiguous filter, THE System SHALL suggest clarifications
5. WHILE showing filter help, THE System SHALL include real examples based on current data

### Requirement 11: Support Result Pagination

**User Story:** As a geoscientist, I want to navigate through large result sets using pagination, so that I can view all records without overwhelming the interface.

#### Acceptance Criteria

1. WHEN the System displays OSDU results with more than 10 records, THE System SHALL show pagination controls
2. WHEN the System paginates results, THE System SHALL display 10 records per page by default
3. WHERE the user navigates to a different page, THE System SHALL update the displayed records accordingly
4. WHEN the System applies filters, THE System SHALL reset pagination to page 1
5. WHILE paginating, THE System SHALL preserve the current page when applying additional filters
6. THE System SHALL display the current page number and total page count
7. WHERE pagination controls are shown, THE System SHALL include previous and next page buttons
8. WHEN the System is on the first page, THE System SHALL disable the previous page button
9. WHEN the System is on the last page, THE System SHALL disable the next page button
10. WHILE displaying paginated results, THE System SHALL show "Showing X-Y of Z records" indicator

