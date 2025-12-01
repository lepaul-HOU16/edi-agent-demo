# Design Document

## Overview

This design addresses four critical regressions in the Chain of Thought streaming system:

1. **Multiple Thinking Indicators**: ChainOfThoughtDisplay unconditionally shows ThinkingIndicator when thoughtSteps is empty, creating duplicates with the main waiting indicator
2. **Persistent Indicators**: Streaming messages (role: 'ai-stream') remain in DynamoDB after responses complete, causing stale indicators on reload
3. **Batched CoT**: General Knowledge Agent was changed to use BaseEnhancedAgent methods that don't properly await DynamoDB writes, causing all steps to appear at once
4. **Broken Project Context**: Project context is not flowing correctly through the Renewables workflow

The solution involves reverting problematic changes, fixing coordination between components, implementing proper cleanup, and restoring working streaming patterns.

## Architecture

### Current System Flow

```
User Query → ChatPage → API → Lambda Handler → Agent Router → Specific Agent
                ↓                                                      ↓
         ChatInterface                                    Generate Thought Steps
                ↓                                                      ↓
    ChainOfThoughtDisplay ← DynamoDB ← Streaming Functions ← Agent Logic
                ↓
         ThinkingIndicator (when empty)
```

### Problem Areas

1. **ChainOfThoughtDisplay** shows ThinkingIndicator independently of ChatInterface's waiting state
2. **Streaming messages** are never cleaned up from DynamoDB
3. **BaseEnhancedAgent.streamThoughtStep()** uses fire-and-forget pattern (doesn't await)
4. **General Knowledge Agent** was changed from working direct streaming to broken BaseEnhancedAgent methods
5. **Project context** is not being passed or maintained correctly

### Solution Architecture

```
User Query → ChatPage (tracks isWaitingForResponse) → API → Lambda Handler
                ↓                                              ↓
         ChatInterface (shows ThinkingIndicator)    Extract projectContext
                ↓                                              ↓
    ChainOfThoughtDisplay (NO indicator)           Pass to Agent Router
                ↓                                              ↓
         Thought Steps Display                      Specific Agent (with context)
                                                               ↓
                                                    Direct Streaming Functions
                                                    (await DynamoDB writes)
                                                               ↓
                                                    Cleanup on completion
```

## Components and Interfaces

### 1. ChainOfThoughtDisplay Component

**Current Implementation:**
```typescript
// Shows ThinkingIndicator when thoughtSteps is empty
{thoughtSteps.length === 0 && <ThinkingIndicator />}
```

**Fixed Implementation:**
```typescript
// Remove ThinkingIndicator entirely - let parent handle waiting state
// Only render when there are actual thought steps to display
{thoughtSteps.length > 0 && (
  <div className="chain-of-thought">
    {/* Render thought steps */}
  </div>
)}
```

**Rationale**: ChainOfThoughtDisplay should only display thought steps, not manage waiting states. The parent component (ChatInterface) already handles the waiting indicator.

### 2. Streaming Message Cleanup

**New Function in thoughtStepStreaming.ts:**
```typescript
export async function cleanupStreamingMessages(
  sessionId: string,
  userId: string
): Promise<void> {
  // Query for all messages with role 'ai-stream'
  // Delete them from DynamoDB
  // Log success/failure
}
```

**Integration Points:**
- Call after final response is stored in DynamoDB
- Call in Lambda handler after agent completes
- Add error handling and retry logic

### 3. General Knowledge Agent Revert

**Current (Broken) Implementation:**
```typescript
export class GeneralKnowledgeAgent extends BaseEnhancedAgent {
  // Uses this.addThoughtStep() which calls streamThoughtStep()
  // streamThoughtStep() doesn't await - fire and forget
}
```

**Reverted (Working) Implementation:**
```typescript
export class GeneralKnowledgeAgent {
  // Direct use of streaming functions
  await addStreamingThoughtStep(sessionId, userId, step);
  await updateStreamingThoughtStep(sessionId, userId, stepId, updates);
  // Properly awaits DynamoDB writes
}
```

**Files to Revert:**
- `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`

### 4. Project Context Flow

**Current Flow (Broken):**
```
Artifact → setActiveProject → ProjectContext → WorkflowCTAButtons
                                                        ↓
                                                  API Request (missing context?)
                                                        ↓
                                                  Lambda Handler
                                                        ↓
                                                  Agent (no context)
```

**Fixed Flow:**
```
Artifact → setActiveProject → ProjectContext → WorkflowCTAButtons
                                                        ↓
                                                  API Request (includes projectContext)
                                                        ↓
                                                  Lambda Handler (extracts projectContext)
                                                        ↓
                                                  Agent Router (passes projectContext)
                                                        ↓
                                                  Agent (uses projectContext)
```

**Required Changes:**
1. Verify WorkflowCTAButtons includes projectContext in API calls
2. Verify Lambda handler extracts projectContext from request body
3. Verify agent router passes projectContext to agents
4. Add logging at each step to trace context flow

## Data Models

### Streaming Message Structure

```typescript
interface StreamingMessage {
  sessionId: string;      // Partition key
  timestamp: number;      // Sort key
  userId: string;
  role: 'ai-stream';      // Identifies as streaming message
  content: string;
  thoughtSteps: ThoughtStep[];
  metadata?: {
    isStreaming: boolean;
  };
}
```

**Cleanup Strategy:**
- Query by sessionId and role='ai-stream'
- Delete all matching items
- Execute after final response is stored

### Project Context Structure

```typescript
interface ProjectContext {
  projectId: string;
  projectName: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated?: string;
}
```

**Flow Points:**
1. Extracted from artifacts (TerrainMap, LayoutMap, etc.)
2. Stored in React Context (ProjectContext)
3. Included in API requests from WorkflowCTAButtons
4. Extracted in Lambda handler
5. Passed to agent router
6. Available to agents for processing


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Single Thinking Indicator

*For any* user request that triggers AI processing, exactly one Thinking indicator should be visible in the DOM at any given time, regardless of how many components are rendering.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Streaming Message Cleanup

*For any* completed AI response, querying DynamoDB for messages with role='ai-stream' in that session should return zero results after the final response is stored.

**Validates: Requirements 2.1, 2.2**

### Property 3: Indicator Removal on Completion

*For any* completed AI response, the Thinking indicator should not be visible in the UI after the response is fully rendered.

**Validates: Requirements 2.3, 2.4**

### Property 4: Immediate DynamoDB Writes

*For any* thought step generated by the General Knowledge Agent, the step should exist in DynamoDB before the next thought step begins generation.

**Validates: Requirements 3.1, 3.2**

### Property 5: Incremental Thought Step Display

*For any* sequence of thought steps, each step should appear in the UI within 5 seconds of being generated, and steps should not all appear simultaneously at the end.

**Validates: Requirements 3.3**

### Property 6: Awaited Streaming Operations

*For any* call to BaseEnhancedAgent streaming methods, the DynamoDB write operation should complete before the method returns control to the caller.

**Validates: Requirements 3.5**

### Property 7: Project Context Extraction

*For any* renewable project artifact that contains project data (projectId, projectName), viewing the artifact should result in that project context being stored in the ProjectContext state.

**Validates: Requirements 4.1**

### Property 8: Project Context in Requests

*For any* workflow button click when an active project exists, the API request should include the projectContext object with the correct projectId and projectName.

**Validates: Requirements 4.2, 4.4**

### Property 9: Project Context Flow

*For any* workflow request with project context, the context should be accessible to the agent processing the request, maintaining the same projectId and projectName throughout the request chain.

**Validates: Requirements 4.3**

## Error Handling

### 1. Missing Project Context

**Scenario**: User clicks workflow button without an active project

**Handling**:
- WorkflowCTAButtons checks for activeProject before sending request
- Displays Alert component with message: "Please select a project first"
- Disables workflow buttons when activeProject is null
- Logs warning to console with context state

### 2. DynamoDB Cleanup Failure

**Scenario**: Cleanup function fails to delete streaming messages

**Handling**:
- Log error with full details to CloudWatch
- Store failed cleanup sessionId for retry
- Attempt cleanup on next message in same session
- Don't block response delivery if cleanup fails
- Alert monitoring if cleanup fails repeatedly

### 3. Streaming Write Failure

**Scenario**: addStreamingThoughtStep fails to write to DynamoDB

**Handling**:
- Log error with step details
- Continue processing (don't block agent)
- Return thought steps in final response as fallback
- User sees steps in batch instead of streaming (degraded but functional)

### 4. Project Context Extraction Failure

**Scenario**: Artifact data is malformed or missing project fields

**Handling**:
- Log warning with artifact data structure
- Don't update ProjectContext with invalid data
- Keep previous activeProject if one exists
- Display warning in console for debugging

### 5. Stale Streaming Messages on Reload

**Scenario**: Page reloads before cleanup completes

**Handling**:
- Frontend checks message timestamps on load
- Ignore streaming messages older than 5 minutes
- Display warning if stale messages detected
- Trigger cleanup for old streaming messages

## Testing Strategy

### Unit Tests

**ChainOfThoughtDisplay Component:**
- Test that ThinkingIndicator is NOT rendered when thoughtSteps is empty
- Test that thought steps are rendered when array has items
- Test that component handles missing thoughtSteps prop gracefully

**Cleanup Function:**
- Test cleanupStreamingMessages deletes correct messages
- Test cleanup handles empty results
- Test cleanup logs errors appropriately
- Test cleanup doesn't delete non-streaming messages

**Project Context Extraction:**
- Test extraction from various artifact data structures
- Test handling of missing fields
- Test handling of malformed data

### Property-Based Tests

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property-based tests. Each test will run a minimum of 100 iterations.

**Property 1: Single Thinking Indicator**
- Generate random UI states with various component combinations
- Verify only one indicator is ever visible
- Tag: **Feature: fix-critical-thinking-indicator-regressions, Property 1: Single Thinking Indicator**

**Property 2: Streaming Message Cleanup**
- Generate random session IDs and message sets
- Verify cleanup removes all streaming messages
- Tag: **Feature: fix-critical-thinking-indicator-regressions, Property 2: Streaming Message Cleanup**

**Property 5: Incremental Thought Step Display**
- Generate random thought step sequences
- Verify steps appear incrementally, not in batch
- Measure timing between appearances
- Tag: **Feature: fix-critical-thinking-indicator-regressions, Property 5: Incremental Thought Step Display**

**Property 7: Project Context Extraction**
- Generate random artifact data with project fields
- Verify context is extracted correctly
- Tag: **Feature: fix-critical-thinking-indicator-regressions, Property 7: Project Context Extraction**

**Property 8: Project Context in Requests**
- Generate random project contexts and button clicks
- Verify requests include correct context
- Tag: **Feature: fix-critical-thinking-indicator-regressions, Property 8: Project Context in Requests**

### Integration Tests

**End-to-End Streaming Test:**
1. Send query to General Knowledge Agent
2. Monitor DynamoDB for thought step writes
3. Verify steps appear incrementally in UI
4. Verify cleanup occurs after completion
5. Verify no stale indicators remain

**Project Context Flow Test:**
1. Load renewable project artifact
2. Verify context extracted and stored
3. Click workflow button
4. Verify request includes context
5. Verify agent receives context
6. Verify action executes on correct project

**Regression Prevention Test:**
1. Test all four agents (General Knowledge, Petrophysics, Maintenance, Renewables)
2. Verify streaming works for each
3. Verify no duplicate indicators
4. Verify cleanup works for each
5. Verify project context works for Renewables

### Manual Testing Checklist

**Before Deployment:**
- [ ] Test General Knowledge Agent query locally
- [ ] Verify thought steps stream incrementally (not batched)
- [ ] Verify only one Thinking indicator appears
- [ ] Verify indicator disappears when complete
- [ ] Test page reload - no stale indicators
- [ ] Test Renewables workflow with project context
- [ ] Verify workflow buttons use correct project
- [ ] Check CloudWatch logs for errors

**After Deployment:**
- [ ] Test in production environment
- [ ] Verify all agents stream correctly
- [ ] Verify cleanup works in production
- [ ] Verify project context flows correctly
- [ ] Monitor CloudWatch for errors
- [ ] Test with multiple concurrent users

## Implementation Notes

### Revert Strategy

**General Knowledge Agent Revert:**
1. Use git to find last working version before BaseEnhancedAgent changes
2. Compare current vs. working version
3. Restore direct streaming function calls
4. Remove BaseEnhancedAgent inheritance
5. Test locally before deploying

**Files to Check:**
- `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`
- Git history around the time of regression

### Cleanup Implementation

**Location**: `cdk/lambda-functions/shared/thoughtStepStreaming.ts`

**Function Signature:**
```typescript
export async function cleanupStreamingMessages(
  sessionId: string,
  userId: string
): Promise<{ deleted: number; errors: string[] }>
```

**Call Sites:**
1. After storing final response in chat handler
2. In agent completion logic
3. On frontend when detecting stale messages

### Coordination Strategy

**ChainOfThoughtDisplay Changes:**
- Remove ThinkingIndicator rendering
- Only render when thoughtSteps.length > 0
- Add prop to explicitly control indicator (if needed)

**ChatInterface Responsibility:**
- Sole owner of Thinking indicator display
- Shows indicator when isWaitingForResponse is true
- Hides indicator when response arrives

### Project Context Debugging

**Add Logging At Each Step:**
1. Artifact: Log when setActiveProject is called
2. WorkflowCTAButtons: Log projectContext in API call
3. Lambda Handler: Log extracted projectContext
4. Agent Router: Log projectContext passed to agent
5. Agent: Log received projectContext

**Verification:**
- Trace a single request through all logs
- Verify context is identical at each step
- Identify where context is lost or corrupted

## Deployment Plan

### Phase 1: Fix Thinking Indicators (Low Risk)

1. Update ChainOfThoughtDisplay to remove ThinkingIndicator
2. Deploy frontend only
3. Test in production
4. Verify single indicator appears

### Phase 2: Implement Cleanup (Medium Risk)

1. Add cleanupStreamingMessages function
2. Integrate cleanup into chat handler
3. Deploy backend
4. Test cleanup works
5. Monitor for stale messages

### Phase 3: Revert General Knowledge Agent (High Risk)

1. Revert to working streaming implementation
2. Test locally thoroughly
3. Deploy backend
4. Test streaming in production
5. Verify incremental display
6. Monitor CloudWatch logs

### Phase 4: Fix Project Context (Medium Risk)

1. Add comprehensive logging
2. Deploy backend with logging
3. Test workflow and examine logs
4. Identify where context is lost
5. Fix the identified issue
6. Deploy fix
7. Verify workflow works correctly

### Rollback Plan

**If Phase 3 Fails:**
- Keep current General Knowledge Agent (batched CoT)
- Document as known issue
- Plan proper fix for BaseEnhancedAgent

**If Phase 4 Fails:**
- Disable workflow buttons temporarily
- Add "Coming Soon" message
- Fix project context properly before re-enabling

## Success Criteria

### Thinking Indicators Fixed

- [ ] Only one indicator appears during processing
- [ ] Indicator disappears when response completes
- [ ] No stale indicators after page reload
- [ ] Works consistently across all agents

### Streaming Restored

- [ ] General Knowledge Agent shows incremental thought steps
- [ ] Steps appear every 3-5 seconds
- [ ] No batching at the end
- [ ] DynamoDB writes are immediate

### Cleanup Working

- [ ] No streaming messages remain after completion
- [ ] Cleanup logs success
- [ ] Cleanup handles errors gracefully
- [ ] No stale messages accumulate over time

### Project Context Fixed

- [ ] Artifacts extract context correctly
- [ ] Workflow buttons include context in requests
- [ ] Backend receives and uses context
- [ ] Actions execute on correct project
- [ ] Error messages appear when context missing
