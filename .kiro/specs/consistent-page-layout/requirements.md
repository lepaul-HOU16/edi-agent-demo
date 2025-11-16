# Requirements Document

## Introduction

Apply the consistent Cloudscape-based layout structure from the Data Catalog page to the Canvas Workspace chat sessions so that all agent interactions follow the same session-based template.

## Glossary

- **System**: The Energy Data Insights web application
- **Catalog Layout**: The reference layout structure implemented in CatalogPage.tsx
- **Canvas Workspace**: The workspace area where users interact with AI agents in chat sessions
- **Session-Based Template**: A consistent layout pattern for agent chat interfaces with panels and controls
- **Cloudscape**: AWS Cloudscape Design System components

## Requirements

### Requirement 1: Apply Catalog Header Structure to Chat Sessions

**User Story:** As a user, I want consistent headers in chat sessions so that navigation matches the catalog experience

#### Acceptance Criteria

1. WHEN viewing a chat session, THE System SHALL display a header grid with title on the left and breadcrumbs/controls on the right
2. WHEN the header renders, THE System SHALL use Grid component with gridDefinition [{ colspan: 5 }, { colspan: 7 }]
3. WHEN displaying the session title, THE System SHALL use Cloudscape Header component with variant="h1"
4. WHEN showing breadcrumbs, THE System SHALL display them as: Workspace › Canvas Name with proper styling

### Requirement 2: Implement Segmented Control for Chat Views

**User Story:** As a user, I want to switch between chat, analysis, and chain-of-thought views in chat sessions

#### Acceptance Criteria

1. WHEN in a chat session, THE System SHALL display a SegmentedControl component with three options: Chat View, Data Analysis, Chain of Thought
2. WHEN rendering segmented controls, THE System SHALL use icon-based options matching the catalog pattern (map icon, dashboard icon, settings icon)
3. WHEN a user clicks a segment, THE System SHALL update the selectedId state and display the corresponding panel
4. WHEN switching panels, THE System SHALL preserve chat history, analysis data, and thought process state

### Requirement 3: Standardize Chat Session Action Buttons

**User Story:** As a user, I want consistent action buttons in chat sessions so that I can reset, access files, and manage sessions

#### Acceptance Criteria

1. WHEN displaying action buttons, THE System SHALL place them in the right section of the header grid
2. WHEN rendering action buttons, THE System SHALL include: Reset Session, File Drawer Toggle, and any agent-specific controls
3. WHEN buttons are active, THE System SHALL apply bgcolor: 'rgba(25, 118, 210, 0.08)' to indicate active state
4. WHEN displaying multiple buttons, THE System SHALL wrap them in a div with className='toggles'

### Requirement 4: Apply Catalog Content Layout to Chat Sessions

**User Story:** As a user, I want chat sessions to use the same two-column layout as the catalog

#### Acceptance Criteria

1. WHEN rendering chat session content, THE System SHALL use a div with className='content-area'
2. WHEN displaying content panels, THE System SHALL use Grid component with gridDefinition [{ colspan: 5 }, { colspan: 7 }]
3. WHEN showing the main panel (chat/analysis/thought), THE System SHALL render it in a div with className='panel' in the left column
4. WHEN showing the conversation area, THE System SHALL render it in a div with className='convo' in the right column

### Requirement 5: Standardize Chat Panel Rendering

**User Story:** As a user, I want consistent panel appearance across catalog and chat sessions

#### Acceptance Criteria

1. WHEN rendering analysis panels in chat, THE System SHALL use Cloudscape Container component with header and footer props
2. WHEN displaying panel headers, THE System SHALL use SpaceBetween with CloudscapeBox variant="h2"
3. WHEN showing scrollable content, THE System SHALL apply maxHeight: 'calc(100vh - 300px)' and overflowY: 'auto'
4. WHEN rendering empty states, THE System SHALL use Container with centered SpaceBetween and Icon components

### Requirement 6: Use CatalogChatBoxCloudscape for All Agents

**User Story:** As a user, I want all agent chat interfaces to use the same chat component

#### Acceptance Criteria

1. WHEN rendering any agent chat interface, THE System SHALL use the CatalogChatBoxCloudscape component
2. WHEN displaying chat messages, THE System SHALL apply paddingBottom: '160px' to the wrapper div
3. WHEN integrating with agents, THE System SHALL pass onSendMessage, messages, and setMessages props consistently
4. WHEN file drawer is available, THE System SHALL integrate FileDrawer component with proper z-index and positioning

### Requirement 7: Preserve Agent-Specific Functionality

**User Story:** As a developer, I want to maintain agent-specific features while applying the consistent layout

#### Acceptance Criteria

1. WHEN applying the layout template, THE System SHALL preserve all agent-specific state management (petrophysics data, renewable energy data, etc.)
2. WHEN migrating chat pages, THE System SHALL maintain all existing agent handlers and tool integrations
3. WHEN updating components, THE System SHALL keep all existing artifact rendering and visualization logic
4. WHEN refactoring, THE System SHALL preserve all agent-specific feature flags and conditional rendering

### Requirement 8: Implement Consistent Mobile Behavior for Chat

**User Story:** As a mobile user, I want chat sessions to work consistently on mobile devices

#### Acceptance Criteria

1. WHEN viewing chat on mobile, THE System SHALL use useMediaQuery(theme.breakpoints.down('md')) to detect mobile
2. WHEN on mobile with drawer closed, THE System SHALL display a floating action button for file drawer access
3. WHEN rendering mobile FAB, THE System SHALL position it at bottom: '16px', right: '16px' with z-index: 1100
4. WHEN drawer opens on mobile, THE System SHALL hide the FAB
