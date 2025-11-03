# Requirements Document

## Introduction

Users are experiencing a frustrating workflow issue where saying "optimize layout" after completing terrain analysis fails with "Missing required parameters: latitude, longitude" even though the system has this information from the active project context. This breaks the natural conversational flow and forces users to repeat information unnecessarily.

## Requirements

### Requirement 1: Auto-fill Parameters from Project Context

**User Story:** As a renewable energy analyst, I want to say "optimize layout" after terrain analysis without repeating coordinates, so that I can have a natural conversational workflow.

#### Acceptance Criteria

1. WHEN a user requests layout optimization without coordinates AND there is an active project with coordinates THEN the system SHALL automatically use the project's coordinates
2. WHEN a user requests layout optimization without coordinates AND there is NO active project THEN the system SHALL return a helpful error message suggesting to either provide coordinates or run terrain analysis first
3. WHEN a user requests layout optimization with explicit coordinates THEN the system SHALL use the provided coordinates regardless of project context
4. WHEN parameter auto-fill occurs THEN the system SHALL log which parameters were auto-filled and from which project

### Requirement 2: Project Context Resolution Before Validation

**User Story:** As a system architect, I want project context to be resolved before parameter validation, so that validation can check against the complete parameter set including auto-filled values.

#### Acceptance Criteria

1. WHEN the orchestrator receives a request THEN it SHALL resolve project context BEFORE validating parameters
2. WHEN project data is loaded THEN it SHALL merge project coordinates into intent parameters BEFORE validation
3. WHEN project data contains terrain results THEN it SHALL make coordinates available for layout optimization
4. WHEN project data contains layout results THEN it SHALL make layout data available for wake simulation

### Requirement 3: Clear Error Messages for Missing Context

**User Story:** As a user, I want clear guidance when I request an operation that requires prior context, so that I understand what I need to do next.

#### Acceptance Criteria

1. WHEN layout optimization is requested without coordinates or project context THEN the system SHALL suggest: "To optimize layout, either provide coordinates (e.g., 'optimize layout at 35.067482, -101.395466') or run terrain analysis first"
2. WHEN wake simulation is requested without layout context THEN the system SHALL suggest: "To run wake simulation, first create a layout with 'optimize layout' or provide a project name"
3. WHEN report generation is requested without any analysis THEN the system SHALL suggest: "To generate a report, first complete terrain analysis and layout optimization"
4. WHEN error messages reference project context THEN they SHALL include the active project name if one exists

### Requirement 4: Validation Logic Enhancement

**User Story:** As a developer, I want the parameter validator to understand project context, so that it can make intelligent decisions about required vs optional parameters.

#### Acceptance Criteria

1. WHEN validating parameters THEN the validator SHALL accept a project context parameter
2. WHEN project context contains coordinates THEN latitude/longitude SHALL NOT be marked as missing for layout optimization
3. WHEN project context contains layout data THEN layout SHALL NOT be marked as missing for wake simulation
4. WHEN project context is provided THEN the validator SHALL log which parameters were satisfied by context vs query

### Requirement 5: Backward Compatibility

**User Story:** As a system maintainer, I want the fix to maintain backward compatibility, so that existing workflows continue to work.

#### Acceptance Criteria

1. WHEN a user provides explicit coordinates in the query THEN those SHALL take precedence over project context
2. WHEN a user specifies a different project name THEN that project's context SHALL be used instead of the active project
3. WHEN no project context exists THEN the system SHALL behave as it does currently (require explicit parameters)
4. WHEN the fix is deployed THEN all existing test cases SHALL continue to pass
