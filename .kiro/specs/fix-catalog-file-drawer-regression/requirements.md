# Requirements Document

## Introduction

The catalog page file drawer (side panel) is experiencing a UI regression where the Material UI drawer is not displaying properly, making the 24 LAS files inaccessible through the UI. The data exists (confirmed via MCP petrophysical analysis server showing all 24 wells), but the drawer panel is broken and not visible to users.

## Glossary

- **File Drawer**: The Material UI side panel component that displays session files and the global folder containing 24 LAS files
- **LAS Files**: Log ASCII Standard files containing well log data (24 files: WELL-001 through WELL-024)
- **MCP Server**: Model Context Protocol server that provides access to petrophysical analysis data
- **Catalog Page**: The data catalog page where users search and analyze well data
- **Session Files**: Files associated with the current chat session
- **Global Folder**: Root-level folder containing shared LAS files accessible across all sessions

## Requirements

### Requirement 1

**User Story:** As a geoscientist, I want to access the file drawer on the catalog page, so that I can view and select LAS files for analysis.

#### Acceptance Criteria

1. WHEN a user clicks the folder icon button on the catalog page THEN the system SHALL display the file drawer sliding in from the right side
2. WHEN the file drawer is open THEN the system SHALL display the file explorer with navigation breadcrumbs and file list
3. WHEN the file drawer is displayed THEN the system SHALL be visible above all other page content without being obscured
4. WHEN the file drawer is open on desktop THEN the system SHALL use fixed positioning at 45% width on the right side
5. WHEN the file drawer is open on mobile THEN the system SHALL use full-width temporary drawer behavior

### Requirement 2

**User Story:** As a geoscientist, I want to see the global folder with 24 LAS files in the file drawer, so that I can access well log data for analysis.

#### Acceptance Criteria

1. WHEN the file drawer opens at the root level THEN the system SHALL display the global folder as a clickable folder item
2. WHEN a user clicks the global folder THEN the system SHALL navigate into the folder and display its contents
3. WHEN viewing the global folder contents THEN the system SHALL display all 24 LAS files (WELL-001 through WELL-024)
4. WHEN displaying LAS files THEN the system SHALL show file icons, names, and action buttons for each file
5. WHEN a user clicks a LAS file THEN the system SHALL display the file preview in the right panel

### Requirement 3

**User Story:** As a geoscientist, I want the file drawer to have proper z-index layering, so that it appears above page content and is not obscured by other UI elements.

#### Acceptance Criteria

1. WHEN the file drawer is open THEN the system SHALL render the drawer with a z-index higher than the catalog page content
2. WHEN the file drawer is open THEN the system SHALL render the drawer with a z-index higher than the map component
3. WHEN the file drawer is open THEN the system SHALL render the drawer below modal dialogs and dropdowns
4. WHEN the file drawer is open THEN the system SHALL render the drawer header, file list, and action buttons all visible and clickable
5. WHEN the file drawer is open THEN the system SHALL not be obscured by any fixed or absolute positioned elements on the page

### Requirement 4

**User Story:** As a geoscientist, I want the file drawer to have proper positioning and dimensions, so that it displays correctly on both desktop and mobile devices.

#### Acceptance Criteria

1. WHEN the file drawer opens on desktop THEN the system SHALL position the drawer fixed to the right edge with 45% width
2. WHEN the file drawer opens on desktop THEN the system SHALL extend the drawer from top to bottom of the viewport
3. WHEN the file drawer opens on mobile THEN the system SHALL display the drawer as a full-width temporary overlay
4. WHEN the file drawer is closed THEN the system SHALL translate the drawer off-screen to the right using transform
5. WHEN the file drawer animates THEN the system SHALL use smooth transitions for opening and closing

### Requirement 5

**User Story:** As a geoscientist, I want the file drawer to display file navigation controls, so that I can browse folders and return to parent directories.

#### Acceptance Criteria

1. WHEN viewing any folder in the file drawer THEN the system SHALL display breadcrumb navigation showing the current path
2. WHEN viewing a subfolder THEN the system SHALL display a back button to navigate to the parent folder
3. WHEN clicking a breadcrumb THEN the system SHALL navigate to that folder level
4. WHEN at the root level THEN the system SHALL disable the back button
5. WHEN navigating folders THEN the system SHALL update the breadcrumbs to reflect the current path
