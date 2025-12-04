# Requirements Document

## Introduction

The Data Catalog page has two critical UX issues that need to be addressed:
1. The map container extends too far below the input controls, creating excessive whitespace
2. OSDU search functionality is broken, showing "OSDU search not implemented" error

This feature will fix both layout and functionality issues to provide a professional, working data catalog experience.

## Glossary

- **Data Catalog**: The page at `/catalog` that provides geographic visualization and search capabilities for well data
- **Map Container**: The div element that contains the Leaflet map component showing well locations
- **Input Controls**: The chat input box and associated controls at the bottom of the right panel
- **OSDU**: Open Subsurface Data Universe - an external data source for oil & gas well data
- **Landing Page Pattern**: The consistent layout pattern used across agent landing pages where panels extend only to the bottom of input controls

## Requirements

### Requirement 1

**User Story:** As a user viewing the data catalog, I want the map panel to extend only to the bottom of the input controls, so that the layout matches other landing pages and eliminates excessive whitespace.

#### Acceptance Criteria

1. WHEN a user views the catalog page THEN the map container SHALL extend to the same height as the chat panel on the right
2. WHEN a user views the catalog page THEN the map container SHALL NOT extend beyond the bottom of the input controls
3. WHEN a user switches between panels (Map, Data Analysis, Chain of Thought) THEN all panels SHALL maintain consistent height matching the chat panel
4. WHEN a user resizes the browser window THEN the map container SHALL maintain proper height relative to the input controls
5. WHEN compared to other agent landing pages THEN the catalog page SHALL follow the same height calculation pattern

### Requirement 2

**User Story:** As a user searching for OSDU data, I want the OSDU search to execute successfully, so that I can access external well data sources.

#### Acceptance Criteria

1. WHEN a user enters a query containing "osdu" THEN the system SHALL execute an OSDU search via the REST API
2. WHEN the OSDU search executes THEN the system SHALL NOT display "OSDU search not implemented" error
3. WHEN the OSDU search returns results THEN the system SHALL display the results in the chat panel
4. WHEN the OSDU search returns results THEN the system SHALL update the map with well locations
5. WHEN the OSDU search fails THEN the system SHALL display a meaningful error message explaining the failure

### Requirement 3

**User Story:** As a user, I want the catalog page to have a professional appearance, so that it matches the quality of other pages in the application.

#### Acceptance Criteria

1. WHEN a user views the catalog page THEN the layout SHALL appear polished and professional
2. WHEN a user compares the catalog page to other agent landing pages THEN the visual consistency SHALL be maintained
3. WHEN a user interacts with the catalog page THEN there SHALL be no visual glitches or layout shifts
4. WHEN a user performs searches THEN the UI SHALL remain stable and responsive
5. WHEN a user switches between panels THEN transitions SHALL be smooth without layout jumps
