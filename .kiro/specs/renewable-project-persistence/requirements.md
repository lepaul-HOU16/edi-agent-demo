# Requirements Document

## Introduction

The renewable energy tools currently fail when users reference project IDs because there's no persistence layer to store and retrieve project data across operations. Users expect to be able to:
- Create a terrain analysis for a location
- Optimize a layout for that same project (without re-entering coordinates)
- Run wake simulation for that project (without re-entering layout data)
- Generate reports for that project (without re-entering all previous data)

Currently, each tool requires all parameters to be provided explicitly, making the workflow cumbersome and error-prone.

## Requirements

### Requirement 1: Project Data Persistence

**User Story:** As a renewable energy analyst, I want my project data to be automatically saved and retrieved across operations, so that I don't have to re-enter coordinates and layouts for each step.

#### Acceptance Criteria

1. WHEN a user runs terrain analysis with coordinates THEN the system SHALL store the project ID, coordinates, and terrain results in S3
2. WHEN a user runs layout optimization with a project ID THEN the system SHALL retrieve the coordinates from the stored project data
3. WHEN a user runs wake simulation with a project ID THEN the system SHALL retrieve the layout data from the stored project data
4. WHEN a user runs report generation with a project ID THEN the system SHALL retrieve all previous analysis results from the stored project data
5. IF project data is not found for a given project ID THEN the system SHALL return a clear error message indicating what data is missing and what operation needs to be run first
6. WHEN a user runs any renewable operation without specifying a project THEN the system SHALL use the most recent project from the current session as the default context

### Requirement 2: S3-Based Project Store

**User Story:** As a system administrator, I want project data stored in S3 with a consistent structure, so that data is durable and easily accessible across Lambda invocations.

#### Acceptance Criteria

1. WHEN project data is saved THEN it SHALL be stored in S3 at path `renewable/projects/{project_id}/project.json`
2. WHEN project data is updated THEN it SHALL merge new data with existing data (not overwrite)
3. WHEN project data is retrieved THEN it SHALL return the complete project object with all accumulated data
4. THE project data structure SHALL include: project_id, created_at, updated_at, coordinates (lat/lon), terrain_results, layout_results, simulation_results, report_results
5. IF S3 operations fail THEN the system SHALL log the error and return a fallback response indicating the issue

### Requirement 3: Orchestrator Integration

**User Story:** As a developer, I want the orchestrator to automatically load and save project data, so that tool Lambdas don't need to implement their own persistence logic.

#### Acceptance Criteria

1. WHEN the orchestrator receives a request with a project_id THEN it SHALL load existing project data from S3 before calling tool Lambdas
2. WHEN a tool Lambda returns results THEN the orchestrator SHALL save the results to the project data in S3
3. WHEN calling tool Lambdas THEN the orchestrator SHALL pass the complete project context (including previous results) in the payload
4. IF project data doesn't exist for a new project_id THEN the orchestrator SHALL create a new project record
5. THE orchestrator SHALL handle S3 errors gracefully and continue operation with available data

### Requirement 4: Tool Lambda Updates

**User Story:** As a tool Lambda developer, I want to receive project context in the payload, so that I can access previous results without implementing S3 logic.

#### Acceptance Criteria

1. WHEN layout optimization Lambda is invoked with a project_id THEN it SHALL receive coordinates from project context if not explicitly provided
2. WHEN wake simulation Lambda is invoked with a project_id THEN it SHALL receive layout data from project context if not explicitly provided
3. WHEN report generation Lambda is invoked with a project_id THEN it SHALL receive all previous results from project context
4. IF required data is missing from project context THEN the Lambda SHALL return a clear error indicating what operation needs to be run first
5. TOOL Lambdas SHALL NOT directly access S3 for project data (orchestrator handles this)

### Requirement 5: User-Friendly Error Messages

**User Story:** As a renewable energy analyst, I want clear error messages when I skip a step in the workflow, so that I know what to do next.

#### Acceptance Criteria

1. WHEN a user tries to optimize layout without terrain analysis THEN the system SHALL return: "No coordinates found for project {id}. Please run terrain analysis first with coordinates."
2. WHEN a user tries to run wake simulation without layout THEN the system SHALL return: "No layout found for project {id}. Please run layout optimization first."
3. WHEN a user tries to generate a report without any analysis THEN the system SHALL return: "No analysis results found for project {id}. Please run terrain analysis, layout optimization, and wake simulation first."
4. ERROR messages SHALL include the specific project_id referenced
5. ERROR messages SHALL include the exact command or query the user should run next

### Requirement 6: Human-Friendly Project Names

**User Story:** As a renewable energy analyst, I want to use memorable project names instead of random IDs, so that I can easily reference my projects in conversation.

#### Acceptance Criteria

1. WHEN a user provides a location name in their query (e.g., "analyze terrain in West Texas") THEN the system SHALL generate a project name like "west-texas-wind-farm"
2. WHEN a user provides coordinates without a name THEN the system SHALL generate a descriptive name based on reverse geocoding (e.g., "amarillo-tx-wind-farm")
3. WHEN a user explicitly names a project (e.g., "create project Panhandle Wind") THEN the system SHALL use that name (normalized to "panhandle-wind")
4. PROJECT names SHALL be normalized to lowercase with hyphens (kebab-case)
5. IF a project name already exists THEN the system SHALL append a number (e.g., "west-texas-wind-farm-2")
6. USERS SHALL be able to reference projects by partial name match (e.g., "west texas" matches "west-texas-wind-farm")

### Requirement 7: Session Context and Smart Defaults

**User Story:** As a renewable energy analyst, I want the system to remember my current project context, so that I don't have to repeat the project name for every operation.

#### Acceptance Criteria

1. WHEN a user starts a terrain analysis THEN the system SHALL set that project as the active project for the session
2. WHEN a user runs subsequent operations without specifying a project THEN the system SHALL use the active project from the session
3. WHEN a user explicitly specifies a different project THEN the system SHALL switch the active project to that one
4. THE system SHALL display the active project name in responses (e.g., "Running wake simulation for West Texas Wind Farm...")
5. WHEN a user asks "what's my current project" THEN the system SHALL return the active project name and status

### Requirement 8: Project Listing and Status

**User Story:** As a renewable energy analyst, I want to see what projects exist and their completion status, so that I can track my work and resume where I left off.

#### Acceptance Criteria

1. WHEN a user asks "list my renewable projects" THEN the system SHALL return all project names with their status
2. PROJECT status SHALL indicate which steps are complete: terrain (✓/✗), layout (✓/✗), simulation (✓/✗), report (✓/✗)
3. WHEN a user asks "show project {name}" THEN the system SHALL return the complete project data including all results
4. PROJECT listing SHALL include created_at and updated_at timestamps in human-readable format
5. PROJECT listing SHALL include coordinates and basic metrics (turbine count, capacity, AEP) if available
6. PROJECT listing SHALL show the active project with a marker (e.g., "→ west-texas-wind-farm (active)")

### Requirement 9: Natural Language Project References

**User Story:** As a renewable energy analyst, I want to reference projects naturally in conversation, so that the workflow feels intuitive.

#### Acceptance Criteria

1. WHEN a user says "optimize the layout" THEN the system SHALL use the active project context
2. WHEN a user says "run wake simulation for that project" THEN the system SHALL use the most recently mentioned project
3. WHEN a user says "compare west texas and panhandle projects" THEN the system SHALL identify both projects by name matching
4. WHEN a user says "continue with the Texas project" THEN the system SHALL match projects containing "texas" in the name
5. IF multiple projects match a partial name THEN the system SHALL ask for clarification with a list of matches

### Requirement 10: AgentCore-Style Chain of Thought Display

**User Story:** As a renewable energy analyst, I want to see the AI's reasoning process in a clean, professional format matching AgentCore's default display, so that I can understand and trust the analysis.

#### Acceptance Criteria

1. WHEN the AI is processing a request THEN the system SHALL display thought steps in a clean, minimal format
2. THE chain of thought display SHALL use Cloudscape design system components for consistency
3. EACH thought step SHALL show: step number, action description, status indicator (in progress/complete/error)
4. THE display SHALL be collapsible/expandable for each step
5. THE display SHALL show timing information for each step
6. THE display SHALL use subtle animations for in-progress steps (not distracting)
7. THE display SHALL match AgentCore's visual style: clean, professional, minimal
8. COMPLETED steps SHALL be collapsed by default with expand option
9. ERROR steps SHALL be highlighted with clear error messages and remediation suggestions
10. THE display SHALL NOT use overly complex animations or visual effects
