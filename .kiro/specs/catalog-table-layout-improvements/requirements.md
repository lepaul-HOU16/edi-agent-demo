# Requirements Document

## Introduction

This specification addresses UI/UX improvements for the catalog data table in the CatalogChatBoxCloudscape component. The current table layout has excessive row height and a redundant "Details" column that wastes horizontal space. Users need a more compact, efficient table layout that maximizes data visibility while maintaining clear affordances for expandable rows.

## Glossary

- **Catalog Table**: The Cloudscape Table component displaying well data with expandable rows in the CatalogChatBoxCloudscape component
- **Expandable Row**: A table row that can be expanded to show additional detailed information
- **Details Column**: The current fourth column showing "Click to expand →" text
- **Row Height**: The vertical space occupied by each table row
- **Column Width**: The horizontal space allocated to each table column
- **Affordance**: A visual indicator that suggests how an element can be interacted with (e.g., dropdown icon for expandable rows)

## Requirements

### Requirement 1: Remove Redundant Details Column

**User Story:** As a user viewing the catalog table, I want the table to use horizontal space efficiently, so that I can see more data without horizontal scrolling.

#### Acceptance Criteria

1. WHEN the catalog table is rendered, THE Catalog Table SHALL NOT display a "Details" column
2. WHEN the table columns are defined, THE Catalog Table SHALL include only three columns: "Facility Name", "Wellbores", and "Welllog Curves"
3. WHEN the table is displayed, THE Catalog Table SHALL utilize the full available width for the three data columns
4. WHEN users view the table, THE Catalog Table SHALL provide the dropdown icon as the primary affordance for expandable rows

### Requirement 2: Optimize Column Width Distribution

**User Story:** As a user viewing well data, I want the table columns to use space efficiently, so that I can see complete facility names and data without truncation.

#### Acceptance Criteria

1. WHEN the table is rendered with three columns, THE Catalog Table SHALL allocate column widths to maximize data visibility
2. WHEN the "Facility Name" column is displayed, THE Catalog Table SHALL allocate sufficient width to display facility names without excessive truncation
3. WHEN the "Wellbores" and "Welllog Curves" columns are displayed, THE Catalog Table SHALL allocate appropriate width for numeric data display
4. WHERE the table width allows, THE Catalog Table SHALL distribute remaining space proportionally across columns

### Requirement 3: Reduce Row Height

**User Story:** As a user browsing through well data, I want compact table rows, so that I can see more wells on screen at once without scrolling.

#### Acceptance Criteria

1. WHEN the table is rendered, THE Catalog Table SHALL use compact row height to maximize visible rows
2. WHEN the "Details" column is removed, THE Catalog Table SHALL reduce vertical padding to minimize row height
3. WHEN text content is displayed in cells, THE Catalog Table SHALL prevent unnecessary text wrapping that increases row height
4. WHEN the table is displayed, THE Catalog Table SHALL maintain readability while minimizing vertical space per row

### Requirement 4: Maintain Expandable Row Functionality

**User Story:** As a user interacting with the table, I want to expand rows to see detailed information, so that I can access additional well data when needed.

#### Acceptance Criteria

1. WHEN a user clicks on a table row, THE Catalog Table SHALL expand the row to display detailed information
2. WHEN the dropdown icon is clicked, THE Catalog Table SHALL toggle the row expansion state
3. WHEN a row is expanded, THE Catalog Table SHALL display the full expandable content below the row
4. WHEN the "Details" column is removed, THE Catalog Table SHALL maintain all existing expandable row functionality
5. WHEN users interact with expandable rows, THE Catalog Table SHALL provide clear visual feedback for the expanded state

### Requirement 5: Preserve Data Integrity and Display

**User Story:** As a user viewing well data, I want all data to remain visible and accessible, so that I can make informed decisions based on complete information.

#### Acceptance Criteria

1. WHEN the table layout is modified, THE Catalog Table SHALL display all existing data fields without loss
2. WHEN the "Details" column is removed, THE Catalog Table SHALL preserve all expandable content in the expanded row view
3. WHEN column widths are adjusted, THE Catalog Table SHALL maintain data accuracy and completeness
4. WHEN the table is rendered, THE Catalog Table SHALL display facility names, wellbore counts, and curve counts accurately
5. WHEN rows are expanded, THE Catalog Table SHALL display all detailed information including Well ID, Name Aliases, Wellbores, and Additional Information
