# Requirements Document

## Introduction

This specification addresses a critical regression in the renewable energy workflow where call-to-action buttons execute workflows on incorrect projects and locations. When users click "Continue" or workflow action buttons (e.g., "Run Wake Simulation", "Generate Wind Rose"), the system fails to maintain proper project context, causing operations to be executed on the wrong project or location. This was previously fixed but has regressed, likely due to changes in how project context is passed between components.

## Glossary

- **Workflow Button**: Interactive UI element that triggers the next step in the renewable energy analysis workflow (e.g., "Generate Turbine Layout", "Run Wake Simulation")
- **Project Context**: The specific project identifier and location data that must be maintained across workflow steps
- **Call-to-Action (CTA)**: User interface elements that guide users to take the next logical action in their workflow
- **Artifact**: A data visualization or result component rendered in the chat interface (e.g., terrain map, layout visualization, wind rose)
- **Project Dashboard**: A comprehensive view showing all renewable energy projects with their status and available actions
- **Active Project**: The project currently being worked on in the conversation context
- **Session Context**: The conversation-level state that tracks which project is active

## Requirements

### Requirement 1

**User Story:** As a renewable energy analyst, I want workflow buttons to execute actions on the correct project, so that I don't accidentally run simulations or analyses on the wrong location.

#### Acceptance Criteria

1. WHEN a user clicks a workflow button from any artifact THEN the system SHALL extract the project identifier from that artifact's data
2. WHEN a user clicks "Continue" on a project in the dashboard THEN the system SHALL set that project as the active project for subsequent workflow actions
3. WHEN a workflow action is triggered THEN the system SHALL include the project identifier in the query sent to the backend
4. WHEN multiple projects exist in the conversation history THEN the system SHALL use the most recently interacted project as the active context
5. WHEN a user explicitly specifies a project name in their query THEN the system SHALL override the active project context with the specified project

### Requirement 2

**User Story:** As a renewable energy analyst, I want the system to remember which project I'm working on, so that I can continue my workflow without repeatedly specifying the project name.

#### Acceptance Criteria

1. WHEN a user receives an artifact for a specific project THEN the system SHALL store that project as the active project in session state
2. WHEN a user clicks a workflow button without specifying a project THEN the system SHALL use the active project from session state
3. WHEN a user starts a new project analysis THEN the system SHALL update the active project in session state
4. WHEN a user switches between projects THEN the system SHALL update the active project context accordingly
5. WHEN the active project is set THEN the system SHALL persist it for the duration of the chat session

### Requirement 3

**User Story:** As a renewable energy analyst, I want workflow buttons to display the project they will operate on, so that I can verify I'm about to execute the correct action before clicking.

#### Acceptance Criteria

1. WHEN workflow buttons are rendered THEN the system SHALL display the target project name in the button label or tooltip
2. WHEN no active project is set THEN the system SHALL disable workflow buttons or show a warning message
3. WHEN a user hovers over a workflow button THEN the system SHALL display a tooltip showing the full action including project name
4. WHEN multiple projects are available THEN the system SHALL provide a way to select which project to operate on
5. WHEN a workflow button is clicked THEN the system SHALL log the project context for debugging purposes

### Requirement 4

**User Story:** As a renewable energy analyst, I want the system to validate that required data exists before executing workflow steps, so that I don't waste time running operations that will fail.

#### Acceptance Criteria

1. WHEN a user clicks "Run Wake Simulation" THEN the system SHALL verify that a turbine layout exists for the active project
2. WHEN a user clicks "Generate Wind Rose" THEN the system SHALL verify that simulation data exists for the active project
3. WHEN required prerequisite data is missing THEN the system SHALL display an error message explaining what is needed
4. WHEN a workflow button is rendered THEN the system SHALL check if prerequisites are met and disable the button if not
5. WHEN prerequisites are missing THEN the system SHALL suggest the correct action to take first

### Requirement 5

**User Story:** As a developer, I want a centralized mechanism for managing project context, so that all components consistently access the same project state.

#### Acceptance Criteria

1. WHEN any component needs the active project THEN the system SHALL provide a React context or hook to access it
2. WHEN the active project changes THEN the system SHALL notify all subscribed components
3. WHEN project context is updated THEN the system SHALL validate the project identifier format
4. WHEN multiple artifacts reference different projects THEN the system SHALL maintain a history of recent projects
5. WHEN debugging context issues THEN the system SHALL provide console logging of all project context changes
