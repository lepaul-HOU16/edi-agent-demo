# Requirements Document

## Introduction

The "show my project dashboard" query currently returns a text-only response instead of rendering the interactive ProjectDashboardArtifact UI component. Users expect to see a rich, interactive dashboard with sortable tables, action buttons, and visual indicators, but instead receive plain markdown text.

## Glossary

- **ProjectDashboardArtifact**: React component that renders an interactive table-based dashboard with project cards, status indicators, and action buttons
- **Orchestrator**: Lambda function that routes renewable energy queries to appropriate handlers
- **Intent Classifier**: Component that determines user intent from natural language queries
- **Artifact**: Structured data object that tells the frontend which UI component to render
- **ProjectListHandler**: Current handler that returns text-only responses for project listing queries

## Requirements

### Requirement 1: Dashboard Intent Detection

**User Story:** As a user, when I ask to "show my project dashboard", the system should recognize this as a dashboard request, not a simple list request

#### Acceptance Criteria

1. WHEN the user query contains "dashboard" or "project dashboard", THE Intent Classifier SHALL classify the intent as "project_dashboard"
2. WHEN the user query is "show my project dashboard", THE Intent Classifier SHALL return confidence score greater than 80%
3. WHEN the user query is "show my projects" without "dashboard", THE Intent Classifier SHALL classify as "project_list" (text response)
4. WHEN the user query contains both "dashboard" and "projects", THE Intent Classifier SHALL prioritize "project_dashboard" intent

### Requirement 2: Dashboard Artifact Generation

**User Story:** As a user, when I request the project dashboard, I want to see an interactive UI component with sortable tables and action buttons, not plain text

#### Acceptance Criteria

1. WHEN the intent is classified as "project_dashboard", THE Orchestrator SHALL generate a "project_dashboard" artifact
2. WHEN generating the dashboard artifact, THE Orchestrator SHALL include all project data with status, completion percentage, location, and timestamps
3. WHEN generating the dashboard artifact, THE Orchestrator SHALL identify duplicate projects within 1km radius
4. WHEN generating the dashboard artifact, THE Orchestrator SHALL mark the active project from session context
5. WHEN the dashboard artifact is created, THE Orchestrator SHALL NOT return text-only response

### Requirement 3: Frontend Artifact Rendering

**User Story:** As a user, when the dashboard artifact is received, I want to see the ProjectDashboardArtifact component rendered in the chat interface

#### Acceptance Criteria

1. WHEN the frontend receives an artifact with type "project_dashboard", THE ChatMessage component SHALL render the ProjectDashboardArtifact component
2. WHEN the ProjectDashboardArtifact is rendered, THE component SHALL display all projects in a sortable table
3. WHEN the ProjectDashboardArtifact is rendered, THE component SHALL show completion percentage with progress bars
4. WHEN the ProjectDashboardArtifact is rendered, THE component SHALL provide action buttons for each project (view, continue, rename, delete)
5. WHEN the ProjectDashboardArtifact is rendered, THE component SHALL highlight duplicate projects with warning badges

### Requirement 4: Backward Compatibility

**User Story:** As a user, when I use simple list queries like "list my projects", I still want to receive text responses for quick reference

#### Acceptance Criteria

1. WHEN the user query is "list my projects" without "dashboard", THE system SHALL return text-only response
2. WHEN the user query is "show project {name}", THE system SHALL return text-only project details
3. WHEN the user query contains action verbs like "analyze" or "optimize", THE system SHALL NOT route to dashboard or list handlers
4. WHEN the ProjectListHandler is used, THE system SHALL continue to return formatted text responses

### Requirement 5: Dashboard Data Completeness

**User Story:** As a user, when I view the dashboard, I want to see complete information about each project including status, metrics, and duplicate detection

#### Acceptance Criteria

1. WHEN the dashboard is generated, THE system SHALL calculate completion percentage for each project (0%, 25%, 50%, 75%, 100%)
2. WHEN the dashboard is generated, THE system SHALL detect duplicate projects within 1km radius
3. WHEN the dashboard is generated, THE system SHALL include project metrics (turbine count, capacity, energy production)
4. WHEN the dashboard is generated, THE system SHALL format timestamps as human-readable relative dates
5. WHEN the dashboard is generated, THE system SHALL identify the active project from session context
