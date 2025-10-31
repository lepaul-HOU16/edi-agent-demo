# EDIcraft Demo Enhancements - Requirements

## Introduction

This specification defines enhancements to the EDIcraft Minecraft visualization system to improve the demo experience, add visual polish, and streamline workflows for showcasing subsurface data visualization capabilities.

## Glossary

- **EDIcraft Agent**: AI agent that visualizes subsurface data (wellbores, horizons) in Minecraft
- **Minecraft World**: 3D environment where visualizations are rendered
- **RCON**: Remote Console protocol for sending commands to Minecraft server
- **Wellbore Trajectory**: 3D path of a drilled well visualized as blocks in Minecraft
- **Canvas**: Chat session that can be linked to a data collection
- **Collection**: Curated set of data items (e.g., 24 wells from S3)
- **Collection Context**: Data scope that limits AI queries to specific collection items
- **OSDU Platform**: Open Subsurface Data Universe - data storage system
- **Rig**: Above-ground drilling equipment structure

## Requirements

### Requirement 1: Minecraft Environment Management

**User Story:** As a demo presenter, I want to clear the Minecraft environment of existing wells via a button or option, so that I can quickly start fresh demonstrations without visual clutter when testing the same well repeatedly.

#### Acceptance Criteria

1. THE Chat Interface SHALL display a "Clear Minecraft Environment" button when EDIcraft agent is active
2. WHEN the user clicks the clear button, THE System SHALL send a clear command to the EDIcraft Agent
3. WHEN the user requests to clear the environment, THE EDIcraft Agent SHALL remove all wellbore visualizations from the Minecraft world
4. WHEN clearing the environment, THE EDIcraft Agent SHALL preserve the terrain and base structures
5. WHEN the clear operation completes, THE EDIcraft Agent SHALL confirm the number of blocks removed
6. WHERE the user specifies a specific area, THE EDIcraft Agent SHALL clear only that region
7. WHEN clearing fails, THE EDIcraft Agent SHALL provide a clear error message with recovery options
8. THE Clear Button SHALL be easily accessible and visible during demo sessions

### Requirement 2: Enhanced Above-Ground Visualization

**User Story:** As a demo presenter, I want fancy above-ground visualizations including drilling rigs, so that the Minecraft world looks more realistic and impressive.

#### Acceptance Criteria

1. WHEN a wellbore is built, THE EDIcraft Agent SHALL place a drilling rig structure at the wellhead location
2. THE Drilling Rig Structure SHALL include recognizable components (derrick, platform, equipment)
3. THE Drilling Rig Structure SHALL use appropriate Minecraft blocks for visual appeal
4. WHEN multiple wellbores exist, THE EDIcraft Agent SHALL place a rig at each wellhead
5. WHERE space is limited, THE EDIcraft Agent SHALL scale or adjust rig placement to avoid overlap

### Requirement 3: Minecraft World Time Lock

**User Story:** As a demo presenter, I want to lock the Minecraft world in daytime, so that visualizations are always clearly visible during demonstrations.

#### Acceptance Criteria

1. WHEN the EDIcraft Agent initializes, THE Minecraft World SHALL be set to daytime
2. THE Minecraft World SHALL remain locked at daytime throughout the session
3. WHEN time lock is enabled, THE Minecraft World SHALL not progress to night
4. THE EDIcraft Agent SHALL provide a command to toggle time lock on/off
5. WHEN time lock is disabled, THE Minecraft World SHALL resume normal day/night cycle

### Requirement 4: Improved OSDU Name Display

**User Story:** As a demo presenter, I want user-friendly well names instead of long OSDU identifiers, so that demonstrations are easier to follow and understand.

#### Acceptance Criteria

1. WHEN displaying well information, THE EDIcraft Agent SHALL show simplified names (e.g., "WELL-007" instead of full OSDU ID)
2. WHEN building wellbores, THE EDIcraft Agent SHALL use short names in Minecraft signs and markers
3. THE EDIcraft Agent SHALL maintain mapping between short names and full OSDU IDs
4. WHEN the user requests details, THE EDIcraft Agent SHALL provide the full OSDU ID
5. WHERE multiple wells have similar names, THE EDIcraft Agent SHALL add distinguishing suffixes

### Requirement 5: Collection-Based Visualization

**User Story:** As a demo presenter, I want to visualize wells from a collection (e.g., 24 wells from S3), so that I can demonstrate analysis of curated datasets.

#### Acceptance Criteria

1. WHEN a canvas is created from a collection, THE EDIcraft Agent SHALL have access to all wells in that collection
2. WHEN the user requests to visualize collection wells, THE EDIcraft Agent SHALL build all wellbores in Minecraft
3. THE EDIcraft Agent SHALL display progress while building multiple wellbores
4. WHEN visualization completes, THE EDIcraft Agent SHALL provide a summary of wells built
5. WHERE collection data is unavailable, THE EDIcraft Agent SHALL provide clear error messages

### Requirement 6: Collection Context Retention

**User Story:** As a demo presenter, I want the "Create New Chat" button to retain collection context, so that I can quickly create multiple canvases within the same collection scope.

#### Acceptance Criteria

1. WHEN the user clicks "Create New Chat" from a collection-scoped canvas, THE System SHALL create a new canvas with the same collection context
2. THE New Canvas SHALL inherit the collection ID from the current canvas
3. THE New Canvas SHALL load collection context automatically
4. THE Collection Context Badge SHALL display immediately in the new canvas
5. WHEN no collection context exists, THE System SHALL create a standard canvas without collection scope

### Requirement 7: Batch Wellbore Visualization

**User Story:** As a demo presenter, I want to visualize multiple wellbores at once from a collection, so that I can efficiently demonstrate large datasets.

#### Acceptance Criteria

1. WHEN the user requests batch visualization, THE EDIcraft Agent SHALL process all wells in the collection
2. THE EDIcraft Agent SHALL display real-time progress (e.g., "Building well 5 of 24...")
3. WHEN a well fails to build, THE EDIcraft Agent SHALL continue with remaining wells
4. THE EDIcraft Agent SHALL provide a summary report of successful and failed builds
5. THE EDIcraft Agent SHALL optimize Minecraft commands to minimize build time

### Requirement 8: Visual Polish and Aesthetics

**User Story:** As a demo presenter, I want visually appealing wellbore visualizations with color coding and markers, so that demonstrations are engaging and professional.

#### Acceptance Criteria

1. WHEN building wellbores, THE EDIcraft Agent SHALL use color-coded blocks based on well properties
2. THE EDIcraft Agent SHALL place depth markers at regular intervals
3. THE EDIcraft Agent SHALL add labels or signs with well names at wellheads
4. WHEN multiple wellbores are visible, THE EDIcraft Agent SHALL use distinct colors for easy identification
5. THE Visualization SHALL include ground-level markers showing well locations on the surface

### Requirement 9: Demo Reset Functionality

**User Story:** As a demo presenter, I want a single command to reset the entire demo environment, so that I can quickly prepare for the next demonstration.

#### Acceptance Criteria

1. WHEN the user requests a demo reset, THE EDIcraft Agent SHALL clear all wellbores from Minecraft
2. THE EDIcraft Agent SHALL remove all drilling rigs and markers
3. THE EDIcraft Agent SHALL reset the Minecraft world to daytime
4. THE EDIcraft Agent SHALL confirm the reset operation before executing
5. WHEN reset completes, THE EDIcraft Agent SHALL provide a "ready for demo" confirmation

### Requirement 10: Collection Data Integration

**User Story:** As a demo presenter, I want to use the 24 wells from S3 in my collection-based canvases, so that I can demonstrate real data analysis workflows.

#### Acceptance Criteria

1. WHEN a collection contains S3 well data, THE EDIcraft Agent SHALL access trajectory data from S3
2. THE EDIcraft Agent SHALL parse LAS files and trajectory data from S3 buckets
3. WHEN S3 data is unavailable, THE EDIcraft Agent SHALL provide fallback options
4. THE EDIcraft Agent SHALL cache S3 data to improve performance
5. THE System SHALL validate S3 permissions before attempting data access

### Requirement 11: Templated Cloudscape Response Layouts

**User Story:** As a demo presenter, I want consistent, professional response layouts using Cloudscape components, so that all EDIcraft responses look polished and match the application design system.

#### Acceptance Criteria

1. THE EDIcraft Agent SHALL use templated response layouts for all responses
2. THE Response Templates SHALL use only AWS Cloudscape Design System components
3. WHEN displaying wellbore build results, THE EDIcraft Agent SHALL use a structured template with sections for status, details, and location
4. WHEN displaying errors, THE EDIcraft Agent SHALL use Cloudscape alert components with appropriate severity levels
5. THE Response Templates SHALL include visual indicators (✅, ❌, 💡) for status and tips
6. WHEN displaying lists or tables, THE EDIcraft Agent SHALL use Cloudscape table or list components
7. THE Response Templates SHALL maintain consistent formatting across all EDIcraft operations
8. WHEN displaying progress updates, THE EDIcraft Agent SHALL use Cloudscape progress indicators
9. THE Response Templates SHALL be reusable across different EDIcraft workflows (wellbore, horizon, batch operations)
10. THE Response Layout SHALL be optimized for readability with proper spacing and hierarchy

