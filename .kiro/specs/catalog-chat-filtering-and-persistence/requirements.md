# Requirements Document

## Introduction

The Data Catalog chat interface currently has two critical issues that prevent users from effectively working with their data:

1. **Broken Filtering Context**: When users ask filtering questions like "wells with log curve data", the chat processes the query but fails to filter the table displayed above it. The table shows all wells instead of the filtered subset.

2. **Lost Conversation on Reload**: When users reload the browser, all chat messages and context are lost, forcing them to start over. This is frustrating for users who have built up valuable context through multiple queries.

These issues break the core user workflow of iterative data exploration through natural language queries.

## Glossary

- **Catalog Chat**: The conversational interface in the Data Catalog page that allows users to query well data using natural language
- **Session Context**: The persistent state that includes chat messages, search results, and filtering context
- **Table Component**: The data table displayed above the chat that shows well data with expandable rows
- **Filter Operation**: A query that refines existing search results rather than fetching new data from OSDU
- **Session ID**: A unique identifier used to track user sessions and persist data in S3 and localStorage
- **Message Persistence**: The ability to save and restore chat messages across browser sessions

## Requirements

### Requirement 1: Fix Table Filtering from Chat

**User Story:** As a geoscientist, I want to filter the displayed well data using natural language queries in the chat, so that I can quickly narrow down to wells that meet specific criteria.

#### Acceptance Criteria

1. WHEN the user types a filtering query like "wells with log curve data" in the chat, THE Catalog Chat SHALL filter the table above to show only wells matching the criteria
2. WHEN the user types a filtering query, THE Catalog Chat SHALL maintain the existing search results and apply the filter on top of them
3. WHEN a filter is applied, THE Catalog Chat SHALL update the table display to show the filtered count (e.g., "Showing 15 of 151 wells")
4. WHEN a filter is applied, THE Catalog Chat SHALL preserve the ability to expand rows and view wellbore/welllog details
5. WHEN the user switches between panels (Map, Data Analysis, Chain of Thought), THE Catalog Chat SHALL maintain the filtered state

### Requirement 2: Persist Chat Messages Across Browser Reloads

**User Story:** As a geoscientist, I want my chat conversation to persist when I reload the browser, so that I don't lose my analysis context and can continue where I left off.

#### Acceptance Criteria

1. WHEN the user reloads the browser, THE Catalog Chat SHALL restore all previous chat messages from the current session
2. WHEN the user reloads the browser, THE Catalog Chat SHALL restore the table data and filtering state
3. WHEN the user reloads the browser, THE Catalog Chat SHALL restore the map state including well markers and bounds
4. WHEN the user reloads the browser, THE Catalog Chat SHALL restore the chain of thought steps
5. WHEN the user explicitly resets the session (using /reset or "New Chat" button), THE Catalog Chat SHALL clear all persisted messages and start fresh

### Requirement 3: Maintain Context Between Chat and Table

**User Story:** As a geoscientist, I want the chat and table to stay synchronized, so that I can see the results of my queries immediately reflected in the table.

#### Acceptance Criteria

1. WHEN the chat receives a response with table data, THE Catalog Chat SHALL update the table component with the new data
2. WHEN the chat receives a filtering response, THE Catalog Chat SHALL pass the filtered data to the table component
3. WHEN the table is updated, THE Catalog Chat SHALL preserve the user's current scroll position in the chat
4. WHEN the table is updated, THE Catalog Chat SHALL maintain any expanded rows if the same wells are still present
5. WHEN switching between panels, THE Catalog Chat SHALL ensure the table data remains consistent

### Requirement 4: Improve Filter Detection and Processing

**User Story:** As a geoscientist, I want the system to correctly identify when I'm filtering existing data versus requesting new data, so that my queries are processed efficiently.

#### Acceptance Criteria

1. WHEN the user types a query containing filter keywords (e.g., "with", "having", "show wells with"), THE Catalog Chat SHALL detect it as a filter operation
2. WHEN a filter operation is detected, THE Catalog Chat SHALL send the existing context to the backend
3. WHEN the backend processes a filter, THE Catalog Chat SHALL receive only the filtered subset of wells
4. WHEN the backend processes a filter, THE Catalog Chat SHALL receive metadata indicating this was a filter operation
5. WHEN displaying filtered results, THE Catalog Chat SHALL show both the filtered count and the total count (e.g., "15 of 151 wells")

### Requirement 5: Session State Management

**User Story:** As a geoscientist, I want my session state to be reliably saved and restored, so that I can work across multiple browser sessions without losing my work.

#### Acceptance Criteria

1. WHEN the user performs any chat query, THE Catalog Chat SHALL save the session state to localStorage
2. WHEN the user reloads the browser, THE Catalog Chat SHALL check localStorage for an existing session
3. WHEN an existing session is found, THE Catalog Chat SHALL restore the session ID and load all associated data from S3
4. WHEN the user explicitly resets the session, THE Catalog Chat SHALL clear localStorage and S3 session data
5. WHEN session restoration fails, THE Catalog Chat SHALL log the error and start a fresh session without blocking the user
