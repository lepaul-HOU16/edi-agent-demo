# Requirements Document

## Introduction

Users are experiencing project management issues with the renewable energy system:
- **34 duplicate projects** created for the same coordinates (35.067482, -101.395466)
- No way to delete unused or duplicate projects
- No way to rename projects after creation
- System creates new projects instead of detecting and reusing existing ones for the same location

This creates clutter, confusion, and forces users to specify full project names when multiple duplicates exist. The system needs intelligent project lifecycle management including deduplication, deletion, and renaming capabilities.

## Requirements

### Requirement 1: Project Deduplication on Creation

**User Story:** As a renewable energy analyst, I want the system to detect when I'm analyzing the same location again, so that it reuses the existing project instead of creating duplicates.

#### Acceptance Criteria

1. WHEN a user requests terrain analysis for coordinates THEN the system SHALL check if a project already exists within 1km of those coordinates
2. IF an existing project is found within 1km THEN the system SHALL ask: "Found existing project '{project-name}' at these coordinates. Would you like to: (1) Continue with existing project, (2) Create new project, (3) View existing project details?"
3. WHEN a user chooses to continue with existing project THEN the system SHALL set it as the active project and proceed with the requested operation
4. WHEN a user chooses to create new project THEN the system SHALL create a new project with a numbered suffix (e.g., "texas-wind-farm-2")
5. THE proximity threshold (1km) SHALL be configurable in the orchestrator
6. THE system SHALL consider projects "duplicate" if coordinates match within the threshold AND they have the same project type (wind farm)

### Requirement 2: Project Deletion

**User Story:** As a renewable energy analyst, I want to delete unused or duplicate projects, so that I can keep my project list clean and organized.

#### Acceptance Criteria

1. WHEN a user says "delete project {name}" THEN the system SHALL confirm: "Are you sure you want to delete '{project-name}'? This will remove all analysis data. Type 'yes' to confirm."
2. WHEN a user confirms deletion THEN the system SHALL remove the project data from S3 at `renewable/projects/{project_id}/`
3. WHEN a user confirms deletion THEN the system SHALL remove the project entry from the project index
4. IF the deleted project was the active project THEN the system SHALL clear the active project context
5. WHEN deletion is complete THEN the system SHALL respond: "Project '{project-name}' has been deleted."
6. WHEN a user says "delete all projects matching {pattern}" THEN the system SHALL list matching projects and ask for confirmation before bulk deletion
7. THE system SHALL NOT allow deletion of projects that are currently being processed (status: in_progress)

### Requirement 3: Project Renaming

**User Story:** As a renewable energy analyst, I want to rename projects after creation, so that I can use more meaningful names as my analysis progresses.

#### Acceptance Criteria

1. WHEN a user says "rename project {old-name} to {new-name}" THEN the system SHALL update the project name in the project index
2. WHEN a project is renamed THEN the system SHALL preserve all project data and history
3. WHEN a project is renamed THEN the system SHALL update the S3 path from `renewable/projects/{old-id}/` to `renewable/projects/{new-id}/`
4. IF the new name already exists THEN the system SHALL respond: "Project name '{new-name}' already exists. Please choose a different name."
5. WHEN rename is complete THEN the system SHALL respond: "Project renamed from '{old-name}' to '{new-name}'"
6. IF the renamed project was the active project THEN the system SHALL update the active project context with the new name

### Requirement 4: Bulk Project Management

**User Story:** As a renewable energy analyst, I want to manage multiple projects at once, so that I can clean up duplicates efficiently.

#### Acceptance Criteria

1. WHEN a user says "show duplicate projects" THEN the system SHALL list all projects within 1km of each other grouped by location
2. WHEN a user says "merge projects {name1} and {name2}" THEN the system SHALL combine their data into one project and delete the other
3. WHEN merging projects THEN the system SHALL keep the most complete data from both projects
4. WHEN merging projects THEN the system SHALL ask which name to keep: "Keep name '{name1}' or '{name2}'?"
5. WHEN a user says "delete all projects except {name}" THEN the system SHALL delete all other projects after confirmation
6. THE system SHALL provide a "dry run" option that shows what would be deleted without actually deleting

### Requirement 5: Project Search and Filtering

**User Story:** As a renewable energy analyst, I want to search and filter my projects, so that I can find specific projects quickly even with many duplicates.

#### Acceptance Criteria

1. WHEN a user says "list projects in Texas" THEN the system SHALL filter projects by location name
2. WHEN a user says "list projects created today" THEN the system SHALL filter projects by creation date
3. WHEN a user says "list incomplete projects" THEN the system SHALL show projects missing terrain, layout, simulation, or report data
4. WHEN a user says "list projects at coordinates {lat}, {lon}" THEN the system SHALL show all projects within 5km of those coordinates
5. THE system SHALL support combining filters (e.g., "list incomplete projects in Texas created this week")

### Requirement 6: Smart Project Name Suggestions

**User Story:** As a renewable energy analyst, I want the system to suggest better project names based on context, so that I don't end up with generic names like "claude-texas-wind-farm-34".

#### Acceptance Criteria

1. WHEN creating a project THEN the system SHALL suggest a name based on: nearest city/town, state, and unique identifier
2. WHEN a user provides a query like "analyze terrain at coordinates X, Y in Amarillo" THEN the system SHALL suggest "amarillo-tx-wind-farm"
3. WHEN a user provides only coordinates THEN the system SHALL use reverse geocoding to suggest "{city}-{state}-wind-farm"
4. IF reverse geocoding fails THEN the system SHALL use "{lat}-{lon}-wind-farm" format
5. THE system SHALL ask: "I'll create project '{suggested-name}'. Would you like to use a different name?"
6. WHEN a user provides a custom name THEN the system SHALL use it instead of the suggestion

### Requirement 7: Project Status Dashboard

**User Story:** As a renewable energy analyst, I want a clear overview of all my projects and their status, so that I can see what needs attention.

#### Acceptance Criteria

1. WHEN a user says "show project dashboard" THEN the system SHALL display a summary table with: project name, location, completion status, last updated, and actions
2. THE dashboard SHALL show completion percentage (e.g., "75% complete: terrain ✓, layout ✓, simulation ✓, report ✗")
3. THE dashboard SHALL highlight duplicate projects (same coordinates within 1km)
4. THE dashboard SHALL show the active project with a marker
5. THE dashboard SHALL provide quick actions: "view", "continue", "delete", "rename"
6. THE dashboard SHALL be sortable by: name, date, location, completion status

### Requirement 8: Project Archiving

**User Story:** As a renewable energy analyst, I want to archive old projects instead of deleting them, so that I can keep historical data without cluttering my active project list.

#### Acceptance Criteria

1. WHEN a user says "archive project {name}" THEN the system SHALL move the project to archived status
2. ARCHIVED projects SHALL NOT appear in default project listings
3. WHEN a user says "list archived projects" THEN the system SHALL show all archived projects
4. WHEN a user says "unarchive project {name}" THEN the system SHALL restore the project to active status
5. ARCHIVED projects SHALL still be accessible by explicit name reference
6. THE system SHALL suggest archiving projects older than 30 days with no activity

### Requirement 9: Project Export and Import

**User Story:** As a renewable energy analyst, I want to export and import project data, so that I can share projects with colleagues or back them up.

#### Acceptance Criteria

1. WHEN a user says "export project {name}" THEN the system SHALL generate a downloadable JSON file with all project data
2. WHEN a user says "import project from {file}" THEN the system SHALL create a new project from the imported data
3. EXPORTED data SHALL include: project metadata, coordinates, all analysis results, and artifacts
4. WHEN importing THEN the system SHALL validate the data format and check for conflicts with existing projects
5. IF a project with the same name exists THEN the system SHALL ask: "Project '{name}' already exists. Import as '{name}-imported'?"

### Requirement 10: Conversational Project Management

**User Story:** As a renewable energy analyst, I want to manage projects using natural language, so that the workflow feels intuitive and doesn't require memorizing commands.

#### Acceptance Criteria

1. THE system SHALL understand variations like: "delete", "remove", "get rid of", "trash" for deletion
2. THE system SHALL understand variations like: "rename", "change name", "call it" for renaming
3. THE system SHALL understand variations like: "show", "list", "display", "what are" for listing
4. THE system SHALL provide helpful suggestions when commands are ambiguous
5. WHEN a user's intent is unclear THEN the system SHALL ask clarifying questions
6. THE system SHALL remember context from previous messages (e.g., "delete it" after viewing a project)

