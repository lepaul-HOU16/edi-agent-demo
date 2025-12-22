# Requirements Document

## Introduction

The Interactive Knowledge Graph Explorer provides users with a powerful visual tool to explore, analyze, and understand the relationships between data entities within a collection. Unlike the Data Catalog which focuses on search and retrieval, the Knowledge Graph Explorer enables deep traversal and investigation of collection datasets, including data quality assessment, lineage tracking, and relationship discovery. This feature transforms collections from static data containers into interactive exploration workspaces.

## Glossary

- **Knowledge Graph Explorer**: An interactive visualization tool that displays entities (wells, events, formations, equipment) and their relationships as a force-directed graph with geographic mapping
- **Collection**: A curated set of related data items (wells, documents, etc.) that share context and can be analyzed together
- **Canvas**: A workspace where users interact with agents and analyze data, linked to a specific collection
- **Data Catalog**: The search and retrieval interface for discovering and selecting data items
- **Entity Node**: A visual representation of a data item (well, event, formation, equipment) in the knowledge graph
- **Relationship Link**: A visual connection between entity nodes showing correlations, hierarchies, events, or duplicates
- **Data Lineage**: The transformation pipeline showing how data moved from source to current state
- **Data Quality Score**: A computed metric (0-100) indicating the reliability and completeness of an entity's data
- **Geographic Context**: The spatial representation of entities on an interactive map
- **System**: The EDI Platform web application

## Requirements

### Requirement 1

**User Story:** As a data analyst, I want to access the Knowledge Graph Explorer from a collection detail page, so that I can visually explore relationships between data items in my collection.

#### Acceptance Criteria

1. WHEN a user views a collection detail page THEN the System SHALL display a prominent "Knowledge Graph Explorer" call-to-action button
2. WHEN a user clicks the Knowledge Graph Explorer button THEN the System SHALL navigate to the Knowledge Graph Explorer view with the collection's data pre-loaded
3. WHEN the Knowledge Graph Explorer loads THEN the System SHALL display a breadcrumb showing "Collections > [Collection Name] > Knowledge Graph Explorer"
4. WHEN a user is in the Knowledge Graph Explorer THEN the System SHALL provide a clear way to return to the collection detail page
5. WHERE a collection has no data items THEN the System SHALL disable the Knowledge Graph Explorer button and display an explanatory message

### Requirement 2

**User Story:** As a data analyst, I want to see all entities from my collection visualized as an interactive force-directed graph, so that I can understand the relationships and structure of my data.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL render all collection entities as nodes in a force-directed graph using D3.js
2. WHEN rendering entity nodes THEN the System SHALL use distinct colors for different entity types (wells: blue, events: red, formations: green, equipment: orange)
3. WHEN rendering relationship links THEN the System SHALL use distinct visual styles for different relationship types (correlations: dashed blue, hierarchies: solid green, events: solid red, duplicates: dotted orange)
4. WHEN a user drags a node THEN the System SHALL update the node position and maintain the force simulation
5. WHEN a user clicks a node THEN the System SHALL highlight the node and display its detailed information in the details panel
6. WHEN the graph contains more than 50 nodes THEN the System SHALL provide zoom and pan controls for navigation
7. WHEN a user zooms or pans THEN the System SHALL maintain smooth 60fps performance using hardware acceleration

### Requirement 3

**User Story:** As a data analyst, I want to see entities displayed on a geographic map alongside the graph, so that I can understand the spatial distribution of my data.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL display a Leaflet map showing the geographic locations of all entities with coordinates
2. WHEN rendering map markers THEN the System SHALL use colors matching the graph node colors for consistency
3. WHEN a user clicks a map marker THEN the System SHALL select the corresponding node in the graph and display its details
4. WHEN a user clicks a graph node with coordinates THEN the System SHALL center the map on that location
5. WHEN a user toggles between marker view and heat map view THEN the System SHALL update the map visualization accordingly
6. WHERE an entity has no geographic coordinates THEN the System SHALL exclude it from the map but include it in the graph

### Requirement 4

**User Story:** As a data analyst, I want to view detailed information about selected entities, so that I can understand their properties, relationships, and data quality.

#### Acceptance Criteria

1. WHEN a user selects an entity node THEN the System SHALL display a details panel with tabs for Overview, Data Lineage, Source Docs, and Data Quality
2. WHEN viewing the Overview tab THEN the System SHALL display all entity properties, related items with relationship types, and data source information
3. WHEN viewing the Data Lineage tab THEN the System SHALL display the transformation pipeline showing how data moved from source to current state with timestamps
4. WHEN viewing the Source Docs tab THEN the System SHALL display all original source documents with metadata (type, date, size) and clickable links
5. WHEN viewing the Data Quality tab THEN the System SHALL display the overall quality score, individual quality metrics with pass/warning/fail status, identified issues, and confidence assessment
6. WHEN a user clicks a related item in the details panel THEN the System SHALL select that entity in the graph and update the details panel
7. WHEN a lineage step references a source document THEN the System SHALL provide a clickable link to jump to the Source Docs tab and highlight that document

### Requirement 5

**User Story:** As a data analyst, I want to filter the knowledge graph by entity types, relationship types, and data quality, so that I can focus on specific aspects of my data.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL display a sidebar with filter controls for node types, relationship types, and data quality levels
2. WHEN a user toggles a node type filter THEN the System SHALL show or hide nodes of that type and update the node count badge
3. WHEN a user toggles a relationship type filter THEN the System SHALL show or hide links of that type and update the relationship count badge
4. WHEN a user toggles a data quality filter THEN the System SHALL show or hide nodes based on their quality score (high: 80-100, medium: 60-79, low: 0-59)
5. WHEN filters are applied THEN the System SHALL update the force simulation to reposition remaining nodes
6. WHEN a user searches in the search box THEN the System SHALL filter nodes by name and highlight matching results

### Requirement 6

**User Story:** As a data analyst, I want to create a new canvas directly from the Knowledge Graph Explorer, so that I can start analyzing specific entities I've identified.

#### Acceptance Criteria

1. WHEN a user is viewing the Knowledge Graph Explorer THEN the System SHALL provide a "Create Canvas from Selection" button
2. WHEN a user selects one or more nodes and clicks "Create Canvas from Selection" THEN the System SHALL create a new canvas linked to the collection with the selected entities pre-loaded as context
3. WHEN a user clicks "Create Canvas from Collection" THEN the System SHALL create a new canvas with all collection data loaded
4. WHEN a canvas is created THEN the System SHALL navigate to the new canvas and display a success message indicating which entities were loaded
5. WHERE no nodes are selected THEN the System SHALL disable the "Create Canvas from Selection" button

### Requirement 7

**User Story:** As a data analyst, I want the Knowledge Graph Explorer to adapt to my theme preference, so that I can work comfortably in light or dark mode.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL detect the user's current theme preference (light or dark)
2. WHEN a user toggles the theme THEN the System SHALL update all graph colors, map tiles, and UI elements to match the new theme
3. WHEN in dark mode THEN the System SHALL use dark map tiles and light text on dark backgrounds
4. WHEN in light mode THEN the System SHALL use light map tiles and dark text on light backgrounds
5. WHEN the theme changes THEN the System SHALL persist the preference for future sessions

### Requirement 8

**User Story:** As a data analyst, I want the Knowledge Graph Explorer to handle large datasets efficiently, so that I can explore collections with hundreds of entities without performance degradation.

#### Acceptance Criteria

1. WHEN a collection contains more than 100 entities THEN the System SHALL implement virtualization to render only visible nodes
2. WHEN the force simulation runs THEN the System SHALL limit iterations to maintain 60fps performance
3. WHEN a user interacts with the graph THEN the System SHALL respond within 100ms for all interactions (click, drag, zoom)
4. WHEN loading entity details THEN the System SHALL fetch data asynchronously and display a loading indicator
5. WHERE a collection contains more than 500 entities THEN the System SHALL display a warning and suggest using filters to reduce the visible set

### Requirement 9

**User Story:** As a data analyst, I want to identify duplicate and low-quality data in my collection, so that I can clean and improve my dataset.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL analyze all entities and identify potential duplicates based on name similarity and property matching
2. WHEN duplicates are found THEN the System SHALL connect them with orange dotted lines labeled "Possible Duplicate"
3. WHEN a user views an entity's Data Quality tab THEN the System SHALL display specific issues (missing fields, conflicting data, stale data, unverified entries)
4. WHEN data quality issues are present THEN the System SHALL provide actionable suggestions for resolution
5. WHEN a user filters by "Low Quality" THEN the System SHALL show only entities with quality scores below 60

### Requirement 10

**User Story:** As a data analyst, I want to understand the provenance of my data, so that I can trust the analysis results and trace data back to original sources.

#### Acceptance Criteria

1. WHEN a user views the Data Lineage tab THEN the System SHALL display each transformation step with source system, timestamp, and transformation description
2. WHEN a lineage step references a source document THEN the System SHALL provide a direct link to view that document
3. WHEN a user clicks a source document link in lineage THEN the System SHALL switch to the Source Docs tab and highlight the referenced document
4. WHEN viewing source documents THEN the System SHALL display document metadata (title, type, date, size) and provide download links
5. WHERE lineage data is unavailable THEN the System SHALL display a clear message indicating no lineage information exists

### Requirement 11

**User Story:** As a data analyst, I want to resize the graph and map panels, so that I can focus on the visualization that's most relevant to my current task.

#### Acceptance Criteria

1. WHEN the Knowledge Graph Explorer loads THEN the System SHALL display the graph and map in a split view with a draggable divider
2. WHEN a user drags the divider THEN the System SHALL resize both panels proportionally
3. WHEN resizing completes THEN the System SHALL trigger resize events to update the graph and map viewports
4. WHEN the graph panel is resized THEN the System SHALL maintain the current zoom level and center point
5. WHEN the map panel is resized THEN the System SHALL call map.invalidateSize() to prevent tile rendering issues

### Requirement 12

**User Story:** As a data analyst, I want to see quick statistics about my collection, so that I can understand the overall composition and quality of my data.

#### Acceptance Criteria

1. WHEN no entity is selected THEN the System SHALL display quick statistics in the details panel showing total nodes, total relationships, duplicates found, and data sources
2. WHEN filters are applied THEN the System SHALL update the statistics to reflect only visible entities
3. WHEN the collection data changes THEN the System SHALL recalculate and update statistics in real-time
4. WHEN viewing statistics THEN the System SHALL provide counts for each entity type and relationship type
