# Restore EDIcraft Agent Landing Page - Design

## Overview

This design document outlines the approach for restoring the EDIcraft agent landing page functionality. The backend EDIcraft agent integration is complete and functional, connecting to Bedrock AgentCore and executing Minecraft operations. However, the frontend landing page has hardcoded logic that prevents users from accessing this working functionality. 

The solution is straightforward: remove the hardcoded disabled state and integrate the "Clear Environment" button with the existing chat system, following the same pattern used by other agent landing pages.

## Architecture

### Current State

```
User clicks "Clear Environment"
    ↓
handleClearEnvironment() [HARDCODED DISABLED]
    ↓
Shows error: "EDIcraft agent is currently unavailable"
    ↓
[Backend agent never invoked]
```

### Desired State

```
User clicks "Clear Environment"
    ↓
handleClearEnvironment()
    ↓
onWorkflowSelect("Clear the Minecraft environment")
    ↓
ChatPage receives message
    ↓
sendMessage() with agent='edicraft'
    ↓
Backend EDIcraft agent processes request
    ↓
Response with thought steps displayed in chat
```

## Components and Interfaces

### 1. EDIcraftAgentLanding Component

**File**: `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`

**Current Issues**:
- Lines 26-32: Hardcoded disabled logic
- No integration with `onWorkflowSelect` prop
- Manual state management for success/error messages

**Required Changes**:
- Remove hardcoded disabled logic
- Call `onWorkflowSelect` with clear environment prompt
- Remove local state management (success/error alerts)
- Let chat system handle the response display

**Updated Interface**:
```typescript
interface EDIcraftAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const handleClearEnvironment = () => {
  console.log('[CLEAR BUTTON] Invoking EDIcraft agent via chat system');
  onWorkflowSelect?.('Clear the Minecraft environment using chunk-based area wipe');
};
```

### 2. Chat System Integration

**File**: `src/pages/ChatPage.tsx`

**Current State**: Already supports agent selection and message sending

**No Changes Required**: The chat system already:
- Supports `selectedAgent` state including 'edicraft'
- Has `onWorkflowSelect` handler that sends messages
- Displays thought steps from agent responses
- Shows success/error messages

**Integration Flow**:
```typescript
// In ChatPage.tsx (already exists)
const handleWorkflowSelect = (prompt: string) => {
  // Send message with selected agent
  handleSend(prompt);
};

// Pass to landing page
<AgentLandingPage 
  agentType="edicraft"
  onWorkflowSelect={handleWorkflowSelect}
/>
```

### 3. Agent Response Display

**File**: `src/components/ChatMessage.tsx`

**Current State**: Already displays agent responses with thought steps

**No Changes Required**: The component already:
- Displays thought steps from EDIcraft agent
- Shows success/error states
- Handles streaming updates
- Displays artifacts (though EDIcraft returns none)

## Data Models

### Clear Environment Request

```typescript
interface ClearEnvironmentRequest {
  message: string; // "Clear the Minecraft environment using chunk-based area wipe"
  agent: 'edicraft';
  sessionId: string;
  userId: string;
}
```

### EDIcraft Agent Response

```typescript
interface EDIcraftResponse {
  success: boolean;
  message: string; // "Environment cleared successfully" or error message
  artifacts: []; // Always empty for EDIcraft
  thoughtSteps: ThoughtStep[];
  connectionStatus: 'connected' | 'error' | 'pending';
  error?: string;
}

interface ThoughtStep {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Button invokes agent
*For any* click on the "Clear Environment" button, the system should invoke the EDIcraft agent through the chat system
**Validates: Requirements 1.1, 1.5**

### Property 2: Loading state during operation
*For any* clear environment operation in progress, the button should display a loading state and be disabled
**Validates: Requirements 1.2, 5.2**

### Property 3: Success message on completion
*For any* successful clear operation, the system should display a success message in the chat interface
**Validates: Requirements 1.3, 5.4**

### Property 4: Error message on failure
*For any* failed clear operation, the system should display the actual error message from the backend
**Validates: Requirements 1.4, 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Thought steps displayed
*For any* clear operation, the system should display thought steps showing the agent's execution progress
**Validates: Requirements 2.2, 2.3**

### Property 6: No hardcoded disabled state
*For any* state of the system, the clear button should not show a hardcoded "agent unavailable" message
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Chat system integration
*For any* workflow button click, the message should be sent through the same chat system as manual text input
**Validates: Requirements 2.1, 2.4**

## Error Handling

### Error Display Strategy

All errors are handled by the backend and displayed through the chat system:

1. **Minecraft Server Unreachable**
   - Backend returns: "Connection refused: Minecraft server unreachable"
   - Displayed in chat as error message
   - User sees troubleshooting guidance from backend

2. **Agent Not Deployed**
   - Backend returns: "EDIcraft agent not configured. Please set BEDROCK_AGENT_ID"
   - Displayed in chat as error message
   - User sees deployment instructions from backend

3. **Authentication Failed**
   - Backend returns: "Permission denied. Lambda needs bedrock-agent-runtime:InvokeAgent permission"
   - Displayed in chat as error message
   - User sees credential verification guidance from backend

4. **Timeout**
   - Backend returns: "Request timeout. Please try again"
   - Displayed in chat as error message
   - User can retry by clicking button again

5. **Unknown Error**
   - Backend returns: Error message from exception
   - Displayed in chat as error message
   - User sees generic troubleshooting guidance

**Key Insight**: The frontend doesn't need to handle specific error types. The backend EDIcraft agent already categorizes errors and returns user-friendly messages. The frontend just needs to display whatever the backend returns.

## Testing Strategy

### Unit Tests

**Test File**: `src/components/agent-landing-pages/__tests__/EDIcraftAgentLanding.test.tsx`

1. **Test button click invokes callback**
   - Render component with mock `onWorkflowSelect`
   - Click "Clear Environment" button
   - Verify `onWorkflowSelect` called with correct prompt

2. **Test button is not disabled by default**
   - Render component
   - Verify button is enabled
   - Verify no error message displayed

3. **Test no hardcoded error message**
   - Render component
   - Click button
   - Verify no "agent unavailable" message appears

### Integration Tests

**Test File**: `src/pages/__tests__/ChatPage.integration.test.tsx`

1. **Test workflow selection sends message**
   - Render ChatPage with EDIcraft agent selected
   - Trigger workflow selection
   - Verify message sent to backend with agent='edicraft'

2. **Test response displays in chat**
   - Mock backend response with thought steps
   - Send clear environment message
   - Verify response displays in chat interface
   - Verify thought steps are shown

3. **Test error handling**
   - Mock backend error response
   - Send clear environment message
   - Verify error displays in chat interface

### Manual Testing

1. **Test Clear Environment Button**
   - Navigate to Chat page
   - Select EDIcraft agent
   - Click "Clear Environment" button
   - Verify message appears in chat
   - Verify agent processes request
   - Verify thought steps display
   - Verify success/error message displays

2. **Test Error Scenarios**
   - Test with backend unavailable
   - Test with invalid credentials
   - Test with Minecraft server down
   - Verify error messages are helpful

3. **Test User Experience**
   - Verify button shows loading state
   - Verify button is disabled during operation
   - Verify button re-enables after completion
   - Verify messages are clear and actionable

## Implementation Approach

### Phase 1: Remove Hardcoded Disabled Logic

**File**: `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`

**Changes**:
```typescript
// BEFORE (lines 18-47)
const [isClearing, setIsClearing] = useState(false);
const [clearResult, setClearResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

const handleClearEnvironment = async () => {
  console.log('[CLEAR BUTTON] Button clicked - executing chunk-based area wipe');
  setIsClearing(true);
  setClearResult(null);

  try {
    // EDIcraft agent is currently disabled in this build
    console.log('[CLEAR BUTTON] EDIcraft agent is not available');

    // Show informational message
    setClearResult({
      type: 'error',
      message: 'EDIcraft agent is currently unavailable. This feature requires the Minecraft server integration to be enabled.'
    });

  } catch (error) {
    console.error('[CLEAR BUTTON] Error clearing environment:', error);
    
    setClearResult({
      type: 'error',
      message: error instanceof Error 
        ? `Failed to clear environment: ${error.message}` 
        : 'Failed to clear environment. Please try again.'
    });
  } finally {
    setIsClearing(false);
  }
};

// AFTER
const handleClearEnvironment = () => {
  console.log('[CLEAR BUTTON] Invoking EDIcraft agent via chat system');
  onWorkflowSelect?.('Clear the Minecraft environment using chunk-based area wipe. Process the environment in 32×32 chunk sections, clearing all blocks from ground level to build height, then restore terrain with grass blocks.');
};
```

### Phase 2: Remove Unused State

**Remove**:
- `isClearing` state (loading handled by chat system)
- `clearResult` state (success/error handled by chat system)
- Alert component displaying `clearResult`

### Phase 3: Simplify Button

**Changes**:
```typescript
// BEFORE
<Button
  variant="normal"
  iconName="remove"
  loading={isClearing}
  onClick={handleClearEnvironment}
  fullWidth
>
  Clear Environment (Chunk-Based Wipe)
</Button>

// AFTER
<Button
  variant="normal"
  iconName="remove"
  onClick={handleClearEnvironment}
  fullWidth
>
  Clear Environment (Chunk-Based Wipe)
</Button>
```

**Rationale**: Loading state is managed by the chat system when the message is being processed.

### Phase 4: Update Documentation

**Update**: Description text to indicate the button sends a message to the agent

```typescript
<Box color="text-body-secondary" fontSize="body-s">
  Sends a request to the EDIcraft agent to perform aggressive chunk-based area wipe, 
  removing ALL structures from the Minecraft world. The agent processes the environment 
  in 32×32 chunk sections, clearing all blocks from ground level to build height, then 
  restores terrain with grass blocks. Ideal for demo preparation or complete environment reset.
</Box>
```

## Success Criteria

The implementation is successful when:

1. ✅ Clicking "Clear Environment" button sends message to chat
2. ✅ Message is processed by EDIcraft agent
3. ✅ Thought steps display in chat interface
4. ✅ Success message displays on completion
5. ✅ Error messages display actual backend errors
6. ✅ No hardcoded "agent unavailable" message
7. ✅ Button behavior matches other workflow buttons
8. ✅ User can see agent execution progress
9. ✅ All tests pass
10. ✅ User validates the fix works end-to-end

## Security Considerations

**No Security Changes Required**: The implementation uses the existing chat system which already:
- Authenticates users via Cognito
- Validates session IDs
- Authorizes agent access
- Sanitizes input
- Handles errors securely

## Performance Considerations

**No Performance Impact**: The implementation:
- Removes unnecessary local state management
- Delegates to existing chat system
- No additional API calls
- No additional rendering overhead

## Rollback Plan

If issues arise:
1. Revert `EDIcraftAgentLanding.tsx` to previous version
2. Hardcoded disabled state returns
3. Users see "agent unavailable" message
4. No impact on other functionality

## Summary

This is a simple fix that removes artificial restrictions from the frontend. The backend EDIcraft agent is fully functional and ready to use. The frontend just needs to stop blocking access to it. By integrating with the existing chat system, we get:

- Consistent user experience across all agents
- Proper error handling from backend
- Thought step visualization
- Loading states
- Success/error messages
- No duplicate code

The implementation is minimal, low-risk, and follows established patterns in the codebase.
