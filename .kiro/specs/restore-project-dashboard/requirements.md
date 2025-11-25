# Requirements Document: Restore Project Dashboard Feature

## Introduction

The project dashboard feature allows users to view all their renewable energy projects in a comprehensive dashboard view. This feature was previously implemented but has been lost, likely due to code changes or overwrites. This spec will restore and enhance the project dashboard functionality.

## Glossary

- **Project Dashboard**: A visual interface showing all renewable energy projects with their status, progress, and quick actions
- **Renewable Orchestrator**: The Lambda function that routes renewable energy queries to appropriate handlers
- **ProjectDashboardArtifact**: The React component that renders the dashboard UI
- **Project Store**: The DynamoDB table storing project data

## Requirements

### Requirement 1: Dashboard Intent Recognition

**User Story:** As a user, I want to ask "show my project dashboard" or similar queries and have the system recognize this intent

#### Acceptance Criteria

1. WHEN the user sends a message containing "dashboard", "show projects", "list projects", or "my projects", THE Renewable Orchestrator SHALL classify the intent as 'project_dashboard'
2. WHEN the intent is classified as 'project_dashboard', THE Renewable Orchestrator SHALL route the request to the dashboard handler
3. THE intent classifier SHALL have a confidence score of at least 0.95 for dashboard queries

### Requirement 2: Project Data Retrieval

**User Story:** As a user, I want to see all my renewable energy projects in the dashboard

#### Acceptance Criteria

1. WHEN the dashboard handler is invoked, THE system SHALL retrieve all projects from the Project DynamoDB table
2. THE system SHALL calculate the completion percentage for each project based on workflow status
3. THE system SHALL format project data with fields: id, name, location, status, createdAt, lastUpdated, progress
4. THE system SHALL return the total count of projects

### Requirement 3: Dashboard Artifact Generation

**User Story:** As a user, I want the dashboard to be displayed as a visual artifact in the chat

#### Acceptance Criteria

1. WHEN project data is retrieved, THE system SHALL create an artifact with messageContentType 'project_dashboard'
2. THE artifact SHALL contain a data object with 'projects' array and 'totalCount' number
3. THE artifact SHALL be returned in the orchestrator response
4. THE frontend SHALL render the ProjectDashboardArtifact component when it receives a 'project_dashboard' artifact

### Requirement 4: Progress Calculation

**User Story:** As a user, I want to see how complete each project is

#### Acceptance Criteria

1. THE system SHALL calculate progress based on project status
2. WHEN status is 'terrain_complete', THE progress SHALL be 16% (1/6 steps)
3. WHEN status is 'layout_complete', THE progress SHALL be 33% (2/6 steps)
4. WHEN status is 'simulation_complete', THE progress SHALL be 50% (3/6 steps)
5. WHEN status is 'windrose_complete', THE progress SHALL be 66% (4/6 steps)
6. WHEN status is 'financial_complete', THE progress SHALL be 83% (5/6 steps)
7. WHEN status is 'report_complete', THE progress SHALL be 100% (6/6 steps)

### Requirement 5: Error Handling

**User Story:** As a user, I want helpful error messages if the dashboard cannot be loaded

#### Acceptance Criteria

1. WHEN the database query fails, THE system SHALL return an error message "Failed to load project dashboard"
2. WHEN no projects exist, THE system SHALL return a message "Found 0 projects in your dashboard"
3. THE system SHALL log all errors to CloudWatch for debugging

### Requirement 6: Frontend Integration

**User Story:** As a user, I want the dashboard to display properly in the chat interface

#### Acceptance Criteria

1. THE ChatMessage component SHALL check for messageContentType 'project_dashboard'
2. WHEN a project_dashboard artifact is detected, THE system SHALL render the ProjectDashboardArtifact component
3. THE component SHALL receive the data prop with projects and totalCount
4. THE component SHALL display project cards with name, location, status, and progress
5. THE component SHALL provide action buttons for each project (view, continue, delete)
