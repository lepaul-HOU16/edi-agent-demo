# Requirements Document

## Introduction

This specification addresses critical regressions introduced in the Chain of Thought (CoT) streaming implementation. Multiple "Thinking" indicators are appearing, indicators persist after responses complete, CoT steps are batched instead of streaming in real-time, and project context is broken in the Renewables workflow. These issues severely impact user experience and must be resolved immediately.

## Glossary

- **CoT (Chain of Thought)**: The step-by-step reasoning process displayed to users showing how the AI agent is thinking through a problem
- **Thinking Indicator**: A visual component (purple gradient with bouncing dots) that shows the AI is processing
- **Streaming**: Real-time incremental updates where thought steps appear one at a time as they are generated
- **Batching**: All thought steps appearing at once after processing completes (undesired behavior)
- **DynamoDB**: AWS database service used to store chat messages and streaming thought steps
- **Session Context**: Information about the current user session including active project details
- **Project Context**: Information about the active renewable energy project (ID, name, location, coordinates)
- **BaseEnhancedAgent**: Base class for AI agents that provides common functionality
- **Streaming Message**: Temporary message with role 'ai-stream' used during real-time updates

## Requirements

### Requirement 1: Fix Multiple Thinking Indicators

**User Story:** As a user, I want to see only one "Thinking" indicator at a time, so that the interface is clean and not confusing.

#### Acceptance Criteria

1. WHEN the AI is processing a request THEN the system SHALL display exactly one Thinking indicator
2. WHEN thought steps are streaming THEN the system SHALL NOT display duplicate Thinking indicators
3. WHEN a streaming message exists with zero thought steps THEN the system SHALL display the Thinking indicator only once
4. WHEN the ChainOfThoughtDisplay component renders with empty thought steps THEN the system SHALL check if a waiting state already exists before showing the indicator
5. WHEN multiple components render simultaneously THEN the system SHALL coordinate to prevent duplicate indicators

### Requirement 2: Fix Persistent Thinking Indicators

**User Story:** As a user, I want the "Thinking" indicator to disappear when the AI finishes responding, so that I know the response is complete.

#### Acceptance Criteria

1. WHEN the AI completes a response THEN the system SHALL remove all streaming messages from DynamoDB
2. WHEN a final response message is stored THEN the system SHALL delete any messages with role 'ai-stream' for that session
3. WHEN the frontend receives a complete response THEN the system SHALL update the UI to remove the Thinking indicator
4. WHEN page reload occurs after a response completes THEN the system SHALL NOT display stale Thinking indicators
5. WHEN cleanup fails THEN the system SHALL log the error and attempt cleanup on the next message

### Requirement 3: Restore Real-Time CoT Streaming

**User Story:** As a user, I want to see thought steps appear one at a time as the AI thinks, so that I can follow the reasoning process in real-time.

#### Acceptance Criteria

1. WHEN the General Knowledge Agent generates a thought step THEN the system SHALL write it to DynamoDB immediately
2. WHEN a thought step is written to DynamoDB THEN the system SHALL await the write operation before continuing
3. WHEN thought steps are generated THEN the system SHALL display them incrementally with approximately 3-second intervals
4. WHEN the General Knowledge Agent uses streaming functions THEN the system SHALL use the direct streaming helper functions (addStreamingThoughtStep, updateStreamingThoughtStep)
5. WHEN BaseEnhancedAgent streaming methods are called THEN the system SHALL properly await DynamoDB writes instead of fire-and-forget

### Requirement 4: Fix Project Context in Renewables Workflow

**User Story:** As a user working on renewable energy projects, I want workflow buttons to use the correct project context, so that actions are performed on the right project.

#### Acceptance Criteria

1. WHEN a user views a renewable project artifact THEN the system SHALL extract and store the project context correctly
2. WHEN a user clicks a workflow button THEN the system SHALL include the active project context in the request
3. WHEN project context is passed to the backend THEN the system SHALL maintain it through the entire request chain
4. WHEN the agent processes a workflow request THEN the system SHALL have access to the correct project ID and name
5. WHEN project context is missing THEN the system SHALL display a clear error message to the user

### Requirement 5: Implement Proper Testing and Verification

**User Story:** As a developer, I want comprehensive testing after each fix, so that I can verify the issue is resolved and no new regressions are introduced.

#### Acceptance Criteria

1. WHEN code changes are made THEN the system SHALL be tested locally before deployment
2. WHEN backend changes are deployed THEN the system SHALL verify Lambda functions updated successfully
3. WHEN frontend changes are deployed THEN the system SHALL verify changes are visible in production
4. WHEN streaming is tested THEN the system SHALL verify thought steps appear incrementally, not in batches
5. WHEN project context is tested THEN the system SHALL verify workflow buttons execute on the correct project
