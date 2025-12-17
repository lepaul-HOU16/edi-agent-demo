# Requirements Document

## Introduction

The Collection Data Inheritance system enables users to organize data from the catalog into reusable collections, then create canvas workspaces that automatically inherit all collection data and context. This eliminates repetitive data selection and ensures consistent data access across multiple analysis sessions.

## Glossary

- **Collection**: A curated set of wells, trajectories, or other data items saved from catalog searches
- **Canvas**: A chat workspace where users interact with AI agents to analyze data
- **Data Inheritance**: The automatic transfer of collection data and context to a canvas workspace
- **Collection Context**: Metadata about a collection including well count, data sources, geographic bounds, and file paths
- **Session**: The backend representation of a canvas workspace
- **FileDrawer**: The UI component that displays available data files in a canvas

## Requirements

### Requirement 1: Session-Collection Linking

**User Story:** As a user, I want to create a canvas from a collection, so that the canvas automatically has access to all collection data without manual file selection.

#### Acceptance Criteria

1. WHEN a user creates a canvas from a collection THEN the System SHALL store the collection ID as a linked reference in the session record
2. WHEN a session is created with a collection link THEN the System SHALL persist the collection ID across browser sessions
3. WHEN a user opens a canvas THEN the System SHALL retrieve the linked collection ID from the session record
4. WHEN a session has a linked collection THEN the System SHALL load the collection data and make it available to the canvas
5. WHEN a collection is deleted THEN the System SHALL maintain the canvas but mark the collection link as broken

### Requirement 2: Collection Context Loading

**User Story:** As a user, I want to see which collection my canvas is linked to, so that I know what data is available for analysis.

#### Acceptance Criteria

1. WHEN a canvas loads with a linked collection THEN the System SHALL display a collection context alert showing the collection name
2. WHEN the collection context alert is displayed THEN the System SHALL show the well count and data source types
3. WHEN a user clicks the collection name in the alert THEN the System SHALL navigate to the collection detail page
4. WHEN a collection has S3 data THEN the System SHALL inform the user that files are accessible in the FileDrawer
5. WHEN a collection has OSDU data THEN the System SHALL inform the user that OSDU records are available for queries

### Requirement 3: Data File Access

**User Story:** As a user, I want all collection well files to be accessible in the FileDrawer, so that I can reference specific files during analysis.

#### Acceptance Criteria

1. WHEN a canvas has a linked collection with S3 data THEN the System SHALL make all S3 file paths accessible in the FileDrawer
2. WHEN a user opens the FileDrawer in a collection-linked canvas THEN the System SHALL display all well files from the collection
3. WHEN a collection contains 24 numbered wells THEN the System SHALL make all files in global/well-data/ accessible
4. WHEN a user selects a file from the FileDrawer THEN the System SHALL load the file content for AI analysis
5. WHEN a collection is updated with new wells THEN the System SHALL reflect the changes in all linked canvases

### Requirement 4: AI Agent Context

**User Story:** As a user, I want AI agents to automatically know about my collection data, so that I don't have to repeatedly explain what data I'm working with.

#### Acceptance Criteria

1. WHEN a user sends a message in a collection-linked canvas THEN the System SHALL include collection context in the AI agent prompt
2. WHEN the AI agent receives a query THEN the System SHALL provide the list of available wells from the collection
3. WHEN a user asks about "my wells" THEN the System SHALL interpret this as the wells in the linked collection
4. WHEN a user requests analysis THEN the System SHALL default to using collection data unless otherwise specified
5. WHEN a collection has geographic bounds THEN the System SHALL include location context in AI prompts

### Requirement 5: Session Persistence

**User Story:** As a user, I want my canvas-collection link to persist, so that I can close and reopen my canvas without losing data access.

#### Acceptance Criteria

1. WHEN a user creates a canvas from a collection THEN the System SHALL store the session with the collection link in persistent storage
2. WHEN a user closes and reopens a canvas THEN the System SHALL restore the collection link from storage
3. WHEN a Lambda function cold starts THEN the System SHALL retrieve session data from persistent storage
4. WHEN a session is retrieved THEN the System SHALL include the linkedCollectionId field
5. WHEN storage fails THEN the System SHALL return a clear error message and maintain canvas functionality without collection context

### Requirement 6: Collection Breadcrumb Navigation

**User Story:** As a user, I want to see the collection name in the canvas header, so that I can easily navigate back to the collection.

#### Acceptance Criteria

1. WHEN a canvas has a linked collection THEN the System SHALL display a breadcrumb showing "Collection Name › Canvas Name"
2. WHEN a user clicks the collection name in the breadcrumb THEN the System SHALL navigate to the collection detail page
3. WHEN a canvas is not linked to a collection THEN the System SHALL display only the canvas name
4. WHEN a collection link is broken THEN the System SHALL display the collection name with a warning icon
5. WHEN the breadcrumb is displayed THEN the System SHALL truncate long names with ellipsis

### Requirement 7: Multiple Canvases from Collection

**User Story:** As a user, I want to create multiple canvases from the same collection, so that I can run different analyses on the same dataset.

#### Acceptance Criteria

1. WHEN a user creates multiple canvases from a collection THEN the System SHALL link all canvases to the same collection
2. WHEN a collection is viewed THEN the System SHALL display all linked canvases
3. WHEN a user clicks a canvas card in the collection detail page THEN the System SHALL navigate to that canvas
4. WHEN a collection has linked canvases THEN the System SHALL show the canvas count in the collection summary
5. WHEN a user deletes a canvas THEN the System SHALL remove it from the collection's linked canvas list

### Requirement 8: Session REST API

**User Story:** As a developer, I want a REST API for session management, so that the frontend can create and retrieve sessions with collection links.

#### Acceptance Criteria

1. WHEN the frontend calls POST /api/sessions/create THEN the System SHALL create a new session with optional linkedCollectionId
2. WHEN the frontend calls GET /api/sessions/{id} THEN the System SHALL return the session including linkedCollectionId
3. WHEN the frontend calls PUT /api/sessions/{id} THEN the System SHALL update the session including linkedCollectionId
4. WHEN the frontend calls DELETE /api/sessions/{id} THEN the System SHALL delete the session
5. WHEN the frontend calls GET /api/sessions/list THEN the System SHALL return all sessions for the current user

### Requirement 9: Collection Context Caching

**User Story:** As a user, I want collection context to load quickly, so that I can start working immediately without waiting.

#### Acceptance Criteria

1. WHEN a collection context is loaded THEN the System SHALL cache it for 30 minutes
2. WHEN a cached context is available THEN the System SHALL use it instead of fetching from the API
3. WHEN a collection is updated THEN the System SHALL invalidate the cache for that collection
4. WHEN cache expires THEN the System SHALL fetch fresh data from the collection API
5. WHEN cache retrieval fails THEN the System SHALL fall back to fetching from the API

### Requirement 10: Error Handling

**User Story:** As a user, I want clear error messages when collection data is unavailable, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a linked collection is deleted THEN the System SHALL display a warning that the collection no longer exists
2. WHEN collection data fails to load THEN the System SHALL display an error message with retry option
3. WHEN a session API call fails THEN the System SHALL log the error and display a user-friendly message
4. WHEN storage is unavailable THEN the System SHALL continue canvas functionality without collection context
5. WHEN a collection has no data items THEN the System SHALL display a message that the collection is empty
