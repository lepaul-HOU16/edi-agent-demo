# Requirements Document

## Introduction

Complete the OSDU integration with real credentials and real data, and redesign the query builder to be compact, sticky, and user-friendly. The current query builder is too large (1971 lines) and doesn't stay visible when scrolling through chat results.

## Glossary

- **OSDU**: Open Subsurface Data Universe - industry standard for subsurface data
- **Query Builder**: UI component for constructing structured OSDU queries
- **Sticky**: UI element that remains fixed in viewport when scrolling
- **OAuth2**: Authentication protocol used by Amazon Federate
- **EDI Platform**: Energy Data Insights platform providing OSDU API access
- **z-index**: CSS property controlling stacking order of elements

## Requirements

### Requirement 1: Complete OSDU Integration

**User Story:** As a user, I want to search real OSDU data with proper authentication, so that I can access actual well data instead of demo data.

#### Acceptance Criteria

1. WHEN the OSDU Lambda is configured with Amazon Federate OAuth2 credentials THEN the system SHALL authenticate with the EDI Platform API
2. WHEN a user executes an OSDU query THEN the system SHALL call the real EDI Platform search API at `/api/search/v2/query/`
3. WHEN the API returns well data THEN the system SHALL display real wells with actual coordinates, depths, and metadata
4. WHEN authentication fails THEN the system SHALL display a clear error message with troubleshooting steps
5. WHEN the API is unavailable THEN the system SHALL handle errors gracefully and suggest retry

### Requirement 2: OAuth2 Token Management

**User Story:** As a system, I want to manage OAuth2 tokens efficiently, so that API calls are authenticated without manual intervention.

#### Acceptance Criteria

1. WHEN the Lambda starts THEN the system SHALL request an OAuth2 token from Amazon Federate token endpoint
2. WHEN the token expires THEN the system SHALL automatically refresh the token before making API calls
3. WHEN token refresh fails THEN the system SHALL log the error and return a clear authentication error
4. WHEN storing credentials THEN the system SHALL use AWS Secrets Manager for secure storage
5. WHEN retrieving credentials THEN the system SHALL cache tokens to minimize token endpoint calls

### Requirement 3: Real OSDU Query Execution

**User Story:** As a user, I want to execute structured OSDU queries, so that I can find specific wells using OSDU query syntax.

#### Acceptance Criteria

1. WHEN a user builds a query with the query builder THEN the system SHALL generate valid OSDU query syntax
2. WHEN the query is executed THEN the system SHALL POST to `/api/search/v2/query/` with proper headers
3. WHEN results are returned THEN the system SHALL parse and display wells on the map
4. WHEN no results are found THEN the system SHALL display "No wells found" message
5. WHEN the query has syntax errors THEN the system SHALL display validation errors before execution

### Requirement 4: Compact Query Builder Design

**User Story:** As a user, I want a compact query builder that doesn't take up the entire screen, so that I can see my search results while building queries.

#### Acceptance Criteria

1. WHEN the query builder is open THEN the system SHALL display it in a compact form with maximum height of 400px
2. WHEN the query builder has many criteria THEN the system SHALL make the criteria list scrollable
3. WHEN the user scrolls the chat THEN the query builder SHALL remain sticky at the top with high z-index
4. WHEN on mobile devices THEN the query builder SHALL collapse to an even more compact form
5. WHEN the user closes the query builder THEN the system SHALL smoothly animate it closed

### Requirement 5: Sticky Query Builder Positioning

**User Story:** As a user, I want the query builder to stay visible when I scroll, so that I don't have to scroll back up to modify my query.

#### Acceptance Criteria

1. WHEN the user scrolls down in the chat THEN the query builder SHALL remain fixed at the top of the viewport
2. WHEN the query builder is sticky THEN the system SHALL set z-index higher than chat messages
3. WHEN the query builder is sticky THEN the system SHALL add a subtle shadow to indicate elevation
4. WHEN the user scrolls back to top THEN the query builder SHALL transition smoothly to its natural position
5. WHEN the query builder is closed THEN the system SHALL remove the sticky positioning

### Requirement 6: Simplified Query Builder UI

**User Story:** As a user, I want a simpler query builder interface, so that I can quickly build queries without being overwhelmed.

#### Acceptance Criteria

1. WHEN the query builder opens THEN the system SHALL display only essential controls (data type, criteria, execute)
2. WHEN advanced options are needed THEN the system SHALL provide a collapsible "Advanced" section
3. WHEN displaying criteria THEN the system SHALL use compact inline forms instead of large form fields
4. WHEN showing field options THEN the system SHALL use autocomplete dropdowns with search
5. WHEN the user adds criteria THEN the system SHALL animate the new criterion smoothly

### Requirement 7: Query Builder Mock-up Page

**User Story:** As a developer, I want to see a mock-up of the new query builder design, so that I can review and approve the design before implementation.

#### Acceptance Criteria

1. WHEN viewing the mock-up page THEN the system SHALL display the compact query builder design
2. WHEN interacting with the mock-up THEN the system SHALL demonstrate sticky behavior on scroll
3. WHEN viewing on different screen sizes THEN the mock-up SHALL show responsive behavior
4. WHEN comparing designs THEN the mock-up SHALL show before/after comparison
5. WHEN reviewing the mock-up THEN the system SHALL include annotations explaining design decisions

### Requirement 8: Query Builder Performance

**User Story:** As a user, I want the query builder to be fast and responsive, so that building queries feels smooth.

#### Acceptance Criteria

1. WHEN adding a criterion THEN the system SHALL update the UI in less than 100ms
2. WHEN generating query preview THEN the system SHALL debounce updates to avoid excessive re-renders
3. WHEN opening the query builder THEN the system SHALL render in less than 200ms
4. WHEN the query builder has 10+ criteria THEN the system SHALL maintain smooth scrolling
5. WHEN typing in autocomplete fields THEN the system SHALL filter options in less than 50ms

### Requirement 9: Query Builder Accessibility

**User Story:** As a user with accessibility needs, I want the query builder to be keyboard-navigable and screen-reader friendly, so that I can build queries without a mouse.

#### Acceptance Criteria

1. WHEN using keyboard navigation THEN the system SHALL support Tab/Shift+Tab to move between fields
2. WHEN using a screen reader THEN the system SHALL announce field labels and validation errors
3. WHEN focused on a criterion THEN the system SHALL provide keyboard shortcuts to add/remove criteria
4. WHEN the query builder is sticky THEN the system SHALL maintain focus management
5. WHEN validation errors occur THEN the system SHALL announce them to screen readers

### Requirement 10: Integration with Existing Features

**User Story:** As a user, I want the new query builder to work seamlessly with existing features, so that my workflow isn't disrupted.

#### Acceptance Criteria

1. WHEN using conversational search THEN the system SHALL allow switching to query builder mode
2. WHEN query builder results are displayed THEN the system SHALL support conversational filtering
3. WHEN the map is visible THEN the query builder SHALL not obscure map controls
4. WHEN collections are enabled THEN the query builder results SHALL support collection creation
5. WHEN using the query builder THEN the system SHALL maintain chat history and context
