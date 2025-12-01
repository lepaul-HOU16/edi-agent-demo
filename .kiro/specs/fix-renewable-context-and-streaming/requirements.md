# Requirements Document

## Introduction

This specification addresses two critical regressions in the renewable energy workflow system:
1. **Context Loss**: Workflow call-to-action buttons do not retain project context between steps, causing layouts to be generated for entirely different locations
2. **Chain of Thought Not Streaming**: Thought steps are written to DynamoDB but not displayed in real-time to users

These regressions break the core user experience and must be fixed immediately.

## Glossary

- **ProjectContext**: The active renewable energy project information including project ID, name, location, and coordinates
- **WorkflowCTAButtons**: Call-to-action buttons that guide users through the renewable energy workflow (terrain → layout → simulation → windrose → financial → report)
- **ChainOfThought (CoT)**: Real-time thought steps showing the AI's reasoning process during long-running operations
- **ThoughtStep**: A single step in the chain of thought, including action, reasoning, status, and result
- **DynamoDB**: AWS database where messages and thought steps are persisted
- **Polling**: Frontend mechanism to periodically check for new thought steps from the backend
- **Streaming Message**: A temporary message with role 'ai-stream' that contains in-progress thought steps

## Requirements

### Requirement 1: Project Context Retention

**User Story:** As a user working on a renewable energy project, I want the workflow buttons to remember my active project context, so that each workflow step operates on the same location and project data.

#### Acceptance Criteria

1. WHEN a user completes a terrain analysis THEN the system SHALL persist the project context (project ID, name, location, coordinates) to the ProjectContext
2. WHEN a user clicks "Generate Turbine Layout" THEN the system SHALL include the active project context in the API request to ensure the layout is generated for the correct location
3. WHEN a user clicks any workflow button THEN the system SHALL validate that the active project context matches the project referenced in the button action
4. WHEN the system detects a project context mismatch THEN the system SHALL prevent the action and display a clear error message to the user
5. WHEN a user navigates between pages THEN the system SHALL restore the active project context from sessionStorage

### Requirement 2: Real-Time Chain of Thought Display

**User Story:** As a user waiting for a long-running renewable energy analysis, I want to see real-time thought steps showing what the system is doing, so that I understand the progress and don't think the system is frozen.

#### Acceptance Criteria

1. WHEN the backend writes a thought step to DynamoDB THEN the frontend SHALL retrieve and display it within 1 second
2. WHEN a thought step status changes from 'in_progress' to 'complete' THEN the frontend SHALL update the display to reflect the new status
3. WHEN multiple thought steps are in progress THEN the frontend SHALL display all steps in chronological order
4. WHEN a thought step encounters an error THEN the frontend SHALL display the error message and suggestion prominently
5. WHEN all thought steps are complete THEN the frontend SHALL stop polling and display the final results

### Requirement 3: Polling Mechanism

**User Story:** As a developer, I want a reliable polling mechanism that retrieves thought steps from DynamoDB, so that users see real-time updates without overwhelming the backend.

#### Acceptance Criteria

1. WHEN a renewable energy query is submitted THEN the frontend SHALL start polling for thought steps every 500 milliseconds
2. WHEN polling detects a new thought step THEN the system SHALL add it to the ChainOfThoughtDisplay component
3. WHEN polling detects an updated thought step THEN the system SHALL update the existing step in the display
4. WHEN the final response is received THEN the system SHALL stop polling and clean up the streaming message
5. WHEN polling encounters an error THEN the system SHALL retry up to 3 times before displaying an error to the user

### Requirement 4: Backend Thought Step Streaming

**User Story:** As a backend developer, I want the renewable orchestrator to write thought steps to DynamoDB in real-time, so that the frontend can display progress to users.

#### Acceptance Criteria

1. WHEN the orchestrator starts processing a query THEN the system SHALL create a streaming message with role 'ai-stream' in DynamoDB
2. WHEN the orchestrator completes a thought step THEN the system SHALL update the streaming message with the new step
3. WHEN the orchestrator completes all processing THEN the system SHALL write the final AI message and delete the streaming message
4. WHEN multiple thought steps are generated THEN the system SHALL write them in chronological order with unique step numbers
5. WHEN a thought step fails THEN the system SHALL include error details in the thought step object

### Requirement 5: Context Debugging and Validation

**User Story:** As a developer debugging context issues, I want comprehensive logging and validation, so that I can quickly identify where context is being lost.

#### Acceptance Criteria

1. WHEN a workflow button is clicked THEN the system SHALL log the active project context, button action, and resolved query
2. WHEN the API request is sent THEN the system SHALL log the full request payload including project context
3. WHEN the backend receives a request THEN the system SHALL log the received project context and validate it against the query
4. WHEN context validation fails THEN the system SHALL log the mismatch details and return a clear error message
5. WHEN context is successfully passed through the entire flow THEN the system SHALL log a success message with the final project context
