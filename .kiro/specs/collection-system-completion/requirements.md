# Requirements Document

## Introduction

This specification defines the completion and enhancement of the Data Collection System for Energy Data Insights (EDI). The collection system enables users to curate, organize, and manage datasets from the data catalog, with seamless integration into workspace canvases for AI-powered analysis. The system currently has basic functionality but requires fixes for pagination, data context inheritance, navigation integration, and modal responsiveness.

## Glossary

- **System**: The Energy Data Insights (EDI) platform
- **User**: A geoscientist, petrophysicist, or energy data analyst using EDI
- **Collection**: A curated set of data points (wells, datasets) saved by the user
- **Canvas**: A workspace chat session where users interact with AI agents
- **Data Catalog**: The map and table interface for discovering and filtering energy data
- **Collection Manager**: The interface for viewing and managing all collections
- **Modal**: The popup dialog for creating collections
- **Data Context**: The specific dataset that AI agents can access during analysis
- **OSDU**: Open Subsurface Data Universe standard for energy data schemas

## Requirements

### Requirement 1: Collection Creation from Data Catalog

**User Story:** As a geoscientist, I want to create a collection from filtered data in the catalog, so that I can save my curated dataset for future analysis.

#### Acceptance Criteria

1. WHEN the User filters data in the Data Catalog AND prompts "create a collection", THE System SHALL display a collection creation modal
2. WHEN the collection creation modal is displayed, THE System SHALL size the modal to 60% of browser width AND center it horizontally
3. WHEN the collection creation modal is displayed, THE System SHALL position the modal 100 pixels from the top viewport edge AND 100 pixels from the bottom viewport edge
4. WHEN the User enters a collection title and description in the modal, THE System SHALL allow the User to deselect individual data points before creation
5. WHEN the User confirms collection creation, THE System SHALL navigate the User directly to the created collection's detail page

### Requirement 2: Collection Manager Navigation Integration

**User Story:** As a user, I want to access collections and canvases from the top navigation, so that I can quickly navigate to my organized workspaces.

#### Acceptance Criteria

1. WHEN the User clicks "Data Catalog" in the top navigation, THE System SHALL display a "View All Collections" menu item
2. WHEN the User clicks "View All Collections", THE System SHALL navigate to the collection manager page showing all collections
3. WHEN the User clicks "Workspace" in the top navigation, THE System SHALL display a "View All Canvases" menu item
4. WHEN the User clicks "View All Canvases", THE System SHALL navigate to a page showing all canvases with a collection filter dropdown
5. WHEN the User selects a collection from the filter dropdown on the canvases page, THE System SHALL display only canvases linked to that collection

### Requirement 3: Collection Display and Pagination

**User Story:** As a user, I want to see all my collections with proper pagination, so that I can manage large numbers of collections effectively.

#### Acceptance Criteria

1. WHEN the User views the collection manager page, THE System SHALL display 10 collections per page
2. WHEN the User has more than 10 collections, THE System SHALL provide pagination controls to navigate between pages
3. WHEN the User creates a new collection, THE System SHALL add the collection to the list without removing existing collections
4. WHEN the User views a specific collection, THE System SHALL display 25 canvases per page linked to that collection
5. WHEN the User has more than 25 canvases in a collection, THE System SHALL provide pagination controls for canvases

### Requirement 4: Data Context Inheritance

**User Story:** As a user, I want canvases created from a collection to inherit the collection's data context, so that AI agents analyze only the relevant curated data.

#### Acceptance Criteria

1. WHEN the User creates a canvas from a collection, THE System SHALL link the canvas to the collection's data context
2. WHEN an AI agent processes a query in a collection-linked canvas, THE System SHALL limit the agent's data access to the collection's data only
3. WHEN an AI agent attempts to access data outside the collection context, THE System SHALL prompt the User to confirm whether to proceed with expanded data access
4. WHEN the User confirms expanded data access, THE System SHALL allow the agent to access additional data AND log the context expansion
5. WHEN the User views a canvas linked to a collection, THE System SHALL display the collection name and data scope in the canvas interface

### Requirement 5: Canvas Display and Styling

**User Story:** As a user, I want to see canvases displayed with consistent styling and proper organization, so that I can easily identify and access my workspaces.

#### Acceptance Criteria

1. WHEN the User views canvases on the "View All Canvases" page, THE System SHALL display canvas cards using the same styling as the /listChats page
2. WHEN the User views canvases within a collection, THE System SHALL display only canvases linked to that specific collection
3. WHEN the User views a canvas card, THE System SHALL display the canvas name, creation date, and linked collection name
4. WHEN the User clicks a canvas card, THE System SHALL navigate to that canvas's chat interface
5. WHEN the User creates a new canvas from a collection, THE System SHALL automatically link the canvas to the collection AND inherit the collection's data context

### Requirement 6: Backend Schema and Data Model

**User Story:** As a developer, I want a flexible data schema that supports OSDU compatibility while not being locked into OSDU-only data, so that the system can handle diverse energy data sources.

#### Acceptance Criteria

1. WHEN the System stores collection data, THE System SHALL use a schema that is compatible with OSDU data structures
2. WHEN the System stores collection data, THE System SHALL allow non-OSDU data fields to be included in the schema
3. WHEN the System links a canvas to a collection, THE System SHALL store the collection ID reference in the ChatSession model
4. WHEN the System retrieves collection data for a canvas, THE System SHALL include all data items, metadata, and geographic context
5. WHEN the System creates a collection, THE System SHALL store the data source type, preview metadata, and creation timestamp

### Requirement 7: Modal Responsiveness and User Experience

**User Story:** As a user viewing EDI in fullscreen, I want the collection creation modal to be properly sized and responsive, so that I can comfortably create collections without UI constraints.

#### Acceptance Criteria

1. WHEN the collection creation modal is displayed on a fullscreen browser, THE System SHALL size the modal to 60% of the viewport width
2. WHEN the collection creation modal is displayed, THE System SHALL maintain 100 pixels of spacing from the top viewport edge
3. WHEN the collection creation modal is displayed, THE System SHALL maintain 100 pixels of spacing from the bottom viewport edge
4. WHEN the User resizes the browser window, THE System SHALL maintain the modal's proportional sizing relative to the viewport
5. WHEN the User views the modal on a mobile device, THE System SHALL adjust the modal width to 90% of viewport width for better usability

### Requirement 8: Collection Manager Replacement of /listChats

**User Story:** As a user, I want the collection manager to eventually replace the /listChats page, so that I have a unified interface for managing all my workspaces and collections.

#### Acceptance Criteria

1. WHEN the System is fully deployed, THE System SHALL redirect /listChats requests to the collection manager page
2. WHEN the User accesses the collection manager, THE System SHALL provide a "View All Canvases" option that shows all canvases across collections
3. WHEN the User views all canvases, THE System SHALL provide a dropdown filter to show canvases by collection
4. WHEN the User selects "All Collections" in the filter dropdown, THE System SHALL display all canvases regardless of collection linkage
5. WHEN the User views unlinked canvases, THE System SHALL provide an option to link them to a collection
