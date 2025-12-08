# Requirements Document

## Introduction

Fix three critical UI regressions in the Catalog page that were introduced in recent changes:
1. Oversized icon in segmented control (48x48 instead of 24x24)
2. Copy icon button has unwanted square border
3. OSDU wells search functionality is broken

## Glossary

- **Segmented Control**: The tab switcher UI component with Map/Analysis/Chain of Thought icons
- **OSDU**: Open Subsurface Data Universe - external data source for well information
- **Icon Button**: Material-UI IconButton component used for actions

## Requirements

### Requirement 1: Fix Oversized Segmented Control Icons

**User Story:** As a user, I want the segmented control icons to be properly sized, so that the UI looks professional and doesn't have giant icons.

#### Acceptance Criteria

1. WHEN the catalog page loads THEN the segmented control icons SHALL be 24x24 pixels
2. WHEN viewing the Data Analysis icon THEN the icon SHALL match the size of the Map icon
3. WHEN viewing the Chain of Thought icon THEN the icon SHALL match the size of the Map icon
4. WHEN the icons are displayed THEN they SHALL maintain consistent sizing across all three tabs

### Requirement 2: Remove Copy Icon Button Border

**User Story:** As a user, I want the copy icon button to have no visible border, so that it matches the design system and doesn't look broken.

#### Acceptance Criteria

1. WHEN viewing any copy icon button THEN the button SHALL have no square border
2. WHEN hovering over the copy icon button THEN the button SHALL show appropriate hover state without border
3. WHEN the button is in default state THEN the button SHALL have transparent background

### Requirement 3: Fix OSDU Wells Search

**User Story:** As a user, I want to search for OSDU wells, so that I can access external well data sources.

#### Acceptance Criteria

1. WHEN a user types "show me osdu wells" THEN the system SHALL execute an OSDU search
2. WHEN OSDU search completes THEN the system SHALL display results on the map
3. WHEN OSDU search completes THEN the system SHALL display results in the chat
4. WHEN OSDU search fails THEN the system SHALL display a clear error message
5. WHEN OSDU results are displayed THEN the system SHALL mark them with OSDU data source attribution
