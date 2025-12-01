# Requirements Document

## Introduction

The renewable energy workflow is completely broken. When users click workflow buttons like "Generate Turbine Layout", the system generates layouts for **random locations** instead of using the active project's location. This is a critical regression that makes the entire workflow unusable.

Additionally, Chain of Thought streaming is not working in real-time - thought steps only appear when the final artifact renders, which is too late and provides no progress feedback to users.

## Glossary

- **ActiveProject**: The currently selected renewable energy project containing projectId, projectName, location, and coordinates
- **WorkflowButton**: Call-to-action button that triggers the next step in the workflow (e.g., "Generate Turbine Layout")
- **ProjectContext**: The complete project information including coordinates that must be passed through the entire request flow
- **IntentClassification**: Backend process that parses user queries to extract parameters like latitude/longitude
- **ChainOfThought (CoT)**: Real-time progress updates showing what the AI is doing during long-running operations
- **StreamingMessage**: DynamoDB message with role='ai-stream' containing in-progress thought steps
- **Polling**: Frontend mechanism checking DynamoDB every 500ms for new thought steps

## Requirements

### Requirement 1: Workflow Buttons Must Use Active Project Location

**User Story:** As a user working on a renewable energy project, when I click "Generate Turbine Layout" after completing terrain analysis, the layout must be generated for the SAME location as my terrain analysis, not a random location.

#### Acceptance Criteria

1. WHEN a user clicks a workflow button THEN the system SHALL extract the active project's coordinates from ProjectContext
2. WHEN the backend receives a workflow request THEN the system SHALL use the project's coordinates from the request context, not from query parsing
3. WHEN the backend classifies intent THEN the system SHALL prioritize coordinates from projectContext over coordinates extracted from the query text
4. WHEN coordinates are missing from projectContext THEN the system SHALL return a clear error message instead of generating random coordinates
5. WHEN a layout is generated THEN the system SHALL log both the requested coordinates and the actual coordinates used to enable debugging

### Requirement 2: Chain of Thought Must Stream in Real-Time

**User Story:** As a user waiting for a renewable energy analysis, I want to see progress updates in real-time as the system works, not just when the final result appears.

#### Acceptance Criteria

1. WHEN the backend starts processing a renewable query THEN the system SHALL write thought steps to DynamoDB within 100ms of each step completing
2. WHEN the frontend polls for updates THEN the system SHALL retrieve and display new thought steps within 500ms
3. WHEN thought steps are displayed THEN the system SHALL auto-scroll to show the latest step
4. WHEN all thought steps complete THEN the system SHALL continue showing them until the final artifact renders
5. WHEN the final artifact renders THEN the system SHALL clean up the streaming message from DynamoDB

### Requirement 3: Intent Classification Must Respect Project Context

**User Story:** As a developer, I want the intent classification system to prioritize project context over query parsing, so that workflow buttons always operate on the correct project.

#### Acceptance Criteria

1. WHEN projectContext contains coordinates THEN the system SHALL use those coordinates regardless of what the query text says
2. WHEN projectContext is missing coordinates THEN the system SHALL attempt to extract coordinates from the query text as a fallback
3. WHEN both projectContext and query text lack coordinates THEN the system SHALL return an error instead of generating random coordinates
4. WHEN coordinates conflict between projectContext and query text THEN the system SHALL use projectContext coordinates and log a warning
5. WHEN intent classification completes THEN the system SHALL log which coordinate source was used (projectContext, query, or error)

### Requirement 4: Comprehensive Logging for Debugging

**User Story:** As a developer debugging context loss issues, I want detailed logging at every step of the request flow, so I can quickly identify where coordinates are being lost or changed.

#### Acceptance Criteria

1. WHEN a workflow button is clicked THEN the system SHALL log the active project context including coordinates
2. WHEN the API request is sent THEN the system SHALL log the full request payload including projectContext
3. WHEN the backend receives the request THEN the system SHALL log the received projectContext
4. WHEN intent classification runs THEN the system SHALL log the extracted coordinates and their source
5. WHEN a tool is called THEN the system SHALL log the coordinates being passed to the tool

### Requirement 5: Auto-Scroll for Chain of Thought

**User Story:** As a user watching Chain of Thought updates, I want the view to automatically scroll to show the latest thought step, so I don't have to manually scroll to see progress.

#### Acceptance Criteria

1. WHEN a new thought step appears THEN the system SHALL automatically scroll to show that step
2. WHEN the user manually scrolls up THEN the system SHALL pause auto-scrolling to allow reading
3. WHEN the user scrolls back to the bottom THEN the system SHALL resume auto-scrolling
4. WHEN thought steps complete THEN the system SHALL perform a final scroll to show the complete chain
5. WHEN the final artifact renders THEN the system SHALL scroll to show the artifact
