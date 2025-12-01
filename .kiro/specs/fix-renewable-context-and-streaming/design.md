# Design Document

## Overview

This design addresses two critical regressions in the renewable energy workflow:

1. **Context Loss**: Workflow buttons lose project context between steps, causing operations to execute on wrong locations
2. **Chain of Thought Streaming**: Thought steps are written to DynamoDB but not displayed in real-time to users

The root cause analysis revealed:
- **Context Loss**: `ChatBox.handleSend` was not passing `projectContext` to the `sendMessage` API despite the API supporting it
- **CoT Streaming**: The `streamThoughtStepToDynamoDB` function was properly imported but the backend may not have been deployed with the latest code

## Architecture

### Context Flow Architecture

```
User Action (Workflow Button Click)
    ↓
WorkflowCTAButtons extracts projectContext from artifact
    ↓
ChatBox.handleSend receives message + projectContext
    ↓
sendMessage API call includes projectContext parameter
    ↓
Backend receives projectContext in request
    ↓
Backend validates and uses projectContext for operation
    ↓
Response includes same projectContext
    ↓
Frontend updates ProjectContext state
```

### Chain of Thought Streaming Architecture

```
Backend starts processing
    ↓
streamThoughtStepToDynamoDB writes to DynamoDB
    ↓
Creates/updates streaming message (role: 'ai-stream')
    ↓
Frontend polls every 500ms
    ↓
Retrieves streaming message from DynamoDB
    ↓
ChainOfThoughtDisplay renders thought steps
    ↓
Backend completes → clears streaming message
    ↓
Frontend stops polling
```

## Components and Interfaces

### Frontend Components

#### ChatBox Component
**Purpose**: Main chat interface that sends messages to backend

**Key Changes**:
- Import `useProjectContext` hook
- Extract `projectContext` from context
- Pass `projectContext` to `sendMessage` API calls

```typescript
interface ChatBoxProps {
  sessionId: string;
  userId: string;
}

// Enhanced handleSend
const handleSend = async (message: string) => {
  const { projectContext } = useProjectContext();
  
  await sendMessage({
    sessionId,
    userId,
    message,
    projectContext // Now included!
  });
};
```

#### WorkflowCTAButtons Component
**Purpose**: Renders workflow buttons that trigger next steps

**Current Behavior**: Already extracts projectContext from artifacts and passes to ChatBox

**No Changes Required**: This component already works correctly

#### ChainOfThoughtDisplay Component
**Purpose**: Displays real-time thought steps during processing

**Key Features**:
- Renders thought steps from streaming message
- Updates in real-time as new steps arrive
- Shows status indicators (in_progress, complete, error)
- Displays timing information

#### useRenewableJobPolling Hook
**Purpose**: Polls DynamoDB for streaming messages

**Key Features**:
- Polls every 500ms when job is active
- Retrieves messages with role='ai-stream'
- Updates ChainOfThoughtDisplay with new steps
- Stops polling when job completes

### Backend Components

#### Renewable Orchestrator Handler
**Purpose**: Processes renewable energy queries and orchestrates tool calls

**Key Functions**:
- `streamThoughtStepToDynamoDB`: Writes thought steps to DynamoDB
- `addStreamingThoughtStep`: Adds new step and streams it
- `updateStreamingThoughtStep`: Updates existing step and streams it
- `clearStreamingMessage`: Removes streaming message when complete

**Import Fix Applied**:
```typescript
import { 
  addStreamingThoughtStep, 
  updateStreamingThoughtStep,
  clearStreamingMessage,
  streamThoughtStepToDynamoDB // ✅ Now imported!
} from '../shared/thoughtStepStreaming';
```

#### thoughtStepStreaming Module
**Purpose**: Shared utilities for streaming thought steps to DynamoDB

**Key Functions**:
- `streamThoughtStepToDynamoDB(sessionId, userId, thoughtStep, allThoughtSteps)`: Core streaming function
- `addStreamingThoughtStep(thoughtSteps, step, sessionId, userId)`: Helper to add and stream
- `updateStreamingThoughtStep(thoughtSteps, index, updates, sessionId, userId)`: Helper to update and stream
- `clearStreamingMessage(sessionId)`: Cleanup function

## Data Models

### ProjectContext Interface
```typescript
interface ProjectContext {
  projectId: string;
  projectName: string;
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  metadata?: {
    area?: number;
    terrain?: string;
    [key: string]: any;
  };
}
```

### ThoughtStep Interface
```typescript
interface ThoughtStep {
  step: number | string;
  action?: string;
  reasoning?: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error' | 'thinking';
  timestamp: string;
  duration?: number;
  error?: {
    message: string;
    suggestion?: string;
  };
}
```

### Streaming Message Format
```typescript
interface StreamingMessage {
  id: string; // 'streaming-{sessionId}'
  chatSessionId: string;
  thoughtSteps: ThoughtStep[];
  role: 'ai-stream';
  updatedAt: string;
  owner: string;
  createdAt: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Context Preservation Through API Call
*For any* workflow button click with valid project context, the project context passed to `sendMessage` should match the project context extracted from the artifact.

**Validates: Requirements 1.2, 1.3**

### Property 2: Context Validation Prevents Mismatches
*For any* API request with project context, if the context does not match the query location, the backend should reject the request with a clear error message.

**Validates: Requirements 1.4**

### Property 3: Thought Step Streaming Latency
*For any* thought step written to DynamoDB, the frontend should retrieve and display it within 1 second (500ms polling + network latency).

**Validates: Requirements 2.1**

### Property 4: Thought Step Status Updates
*For any* thought step that transitions from 'in_progress' to 'complete' or 'error', the frontend display should update to reflect the new status within the next polling cycle (500ms).

**Validates: Requirements 2.2**

### Property 5: Polling Lifecycle
*For any* renewable energy query, polling should start when the query is submitted and stop when the final response is received, with no orphaned polling processes.

**Validates: Requirements 3.1, 3.4**

### Property 6: Streaming Message Cleanup
*For any* completed renewable energy query, the streaming message should be deleted from DynamoDB, preventing stale thought steps from appearing on subsequent queries.

**Validates: Requirements 4.3**

### Property 7: Context Logging Completeness
*For any* workflow button click, the system should log the project context at each stage (button click, API call, backend receipt) to enable debugging.

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### Context Validation Errors

**Scenario**: Project context doesn't match query location

**Handling**:
1. Backend validates context against query
2. If mismatch detected, return 400 error with clear message
3. Frontend displays error alert to user
4. Suggest user refresh project context or start new project

**Error Message Template**:
```
"Project context mismatch: The active project is for {projectLocation}, but you're trying to analyze {queryLocation}. Please ensure you're working on the correct project."
```

### Streaming Errors

**Scenario**: DynamoDB write fails during thought step streaming

**Handling**:
1. Log error but don't throw (streaming is best-effort)
2. Continue processing the query
3. Return final result even if streaming failed
4. User may not see real-time updates but gets final answer

**Scenario**: Polling fails to retrieve streaming message

**Handling**:
1. Retry up to 3 times with exponential backoff
2. If all retries fail, show generic "Processing..." indicator
3. Continue polling for final result
4. Log error for debugging

### Session Storage Errors

**Scenario**: ProjectContext fails to persist to sessionStorage

**Handling**:
1. Log warning
2. Keep context in React state for current session
3. User may lose context on page refresh
4. Suggest user avoid refreshing during active workflow

## Testing Strategy

### Unit Testing

**Context Passing Tests**:
- Test that `ChatBox.handleSend` includes projectContext in API call
- Test that `WorkflowCTAButtons` extracts correct context from artifacts
- Test that backend validates context against query

**Streaming Tests**:
- Test that `streamThoughtStepToDynamoDB` writes to DynamoDB correctly
- Test that polling retrieves streaming messages
- Test that `clearStreamingMessage` removes streaming message

**Edge Cases**:
- Empty project context
- Malformed project context
- Missing sessionId or userId
- DynamoDB unavailable

### Property-Based Testing

We will use **fast-check** for TypeScript property-based testing.

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment with this format:
```typescript
// **Feature: fix-renewable-context-and-streaming, Property {number}: {property_text}**
```

**Property Test 1: Context Preservation**
```typescript
// **Feature: fix-renewable-context-and-streaming, Property 1: Context Preservation Through API Call**
test('project context is preserved through API call', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        projectId: fc.uuid(),
        projectName: fc.string(),
        location: fc.string(),
        coordinates: fc.record({
          lat: fc.float({ min: -90, max: 90 }),
          lon: fc.float({ min: -180, max: 180 })
        })
      }),
      async (projectContext) => {
        const sentContext = await sendMessage({ projectContext });
        expect(sentContext).toEqual(projectContext);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Streaming Latency**
```typescript
// **Feature: fix-renewable-context-and-streaming, Property 3: Thought Step Streaming Latency**
test('thought steps appear within 1 second', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        step: fc.integer({ min: 1, max: 10 }),
        action: fc.string(),
        status: fc.constantFrom('in_progress', 'complete', 'error')
      }),
      async (thoughtStep) => {
        const startTime = Date.now();
        await streamThoughtStepToDynamoDB(sessionId, userId, thoughtStep);
        
        // Poll until we see the thought step
        let found = false;
        while (Date.now() - startTime < 1000 && !found) {
          const messages = await pollForMessages();
          found = messages.some(m => m.thoughtSteps?.some(s => s.step === thoughtStep.step));
          await sleep(100);
        }
        
        const latency = Date.now() - startTime;
        expect(found).toBe(true);
        expect(latency).toBeLessThan(1000);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Workflow Test**:
1. Create project with terrain analysis
2. Click "Generate Turbine Layout" button
3. Verify layout is generated for same location as terrain
4. Verify thought steps stream in real-time
5. Verify final result includes correct project context

**Polling Integration Test**:
1. Start renewable query
2. Verify polling starts
3. Write thought steps to DynamoDB
4. Verify frontend displays them within 1 second
5. Complete query
6. Verify polling stops
7. Verify streaming message is cleaned up

## Implementation Notes

### Deployment Requirements

Both backend and frontend must be deployed for fixes to take effect:

1. **Backend Deployment**: `cd cdk && npm run deploy`
   - Ensures `streamThoughtStepToDynamoDB` is available
   - Updates Lambda functions with latest code

2. **Frontend Deployment**: `./deploy-frontend.sh`
   - Ensures `ChatBox` passes projectContext
   - Updates polling logic
   - Deploys to CloudFront

3. **Cache Invalidation**: Wait 1-2 minutes after frontend deployment for CloudFront cache to clear

### Debugging Tools

**Context Debugging**:
- Use `projectContextDebug.ts` utility for logging
- Check browser console for context flow
- Verify API request payloads include projectContext

**Streaming Debugging**:
- Check CloudWatch logs for streaming function calls
- Query DynamoDB directly for streaming messages
- Monitor polling frequency in browser network tab

### Performance Considerations

**Polling Frequency**: 500ms is aggressive but necessary for real-time feel
- Consider exponential backoff if no updates for 5 seconds
- Stop polling after 5 minutes to prevent runaway processes

**DynamoDB Writes**: Each thought step triggers a DynamoDB write
- Use PutCommand (not UpdateCommand) to replace entire message
- This ensures atomic updates and prevents race conditions

**Frontend Rendering**: ChainOfThoughtDisplay re-renders on each poll
- Use React.memo to prevent unnecessary re-renders
- Only update if thought steps actually changed

## Security Considerations

**Context Validation**: Always validate project context on backend
- Prevent users from accessing other users' projects
- Verify userId matches project owner
- Check permissions before executing operations

**DynamoDB Access**: Streaming messages must be scoped to user
- Include `owner` field in streaming message
- Filter queries by userId
- Use IAM policies to restrict access

## Future Enhancements

1. **WebSocket Streaming**: Replace polling with WebSocket for true real-time updates
2. **Context Persistence**: Store project context in DynamoDB for cross-device access
3. **Thought Step Replay**: Allow users to replay thought steps from completed queries
4. **Context History**: Track project context changes over time for debugging
5. **Streaming Analytics**: Monitor streaming performance and optimize polling frequency
