# Design Document

## Overview

This design restores realtime chain-of-thought (CoT) visualization for renewable energy workflows. The backend orchestrator already generates thought steps, but the frontend doesn't display them in realtime. This creates a poor user experience during long-running operations (30-60 seconds) where users see no feedback about what's happening.

The solution involves:
1. Displaying thought steps as they arrive from the backend
2. Showing progress indicators with step-by-step updates
3. Providing visual feedback for each phase of the analysis
4. Handling both synchronous and asynchronous workflows

## Architecture

### Current State

**Backend (Already Implemented)**:
- Orchestrator generates `thoughtSteps` array with each response
- Each thought step includes: step number, action, reasoning, status, timestamp, duration, result
- Thought steps track: validation, intent detection, project resolution, tool invocation, result formatting

**Frontend (Missing)**:
- ChatPage receives thought steps in response but doesn't display them
- No visual progress indicators during processing
- Users see loading spinner but no details about what's happening

### Target State

**Frontend (To Be Implemented)**:
- ChainOfThoughtDisplay component shows thought steps in realtime
- Progress bar reflects completion percentage
- Each step shows: icon, action name, status (in_progress/complete/error), duration
- Steps appear incrementally as they complete
- Visual hierarchy distinguishes major steps from sub-steps

## Components and Interfaces

### 1. ChainOfThoughtDisplay Component

```typescript
interface ChainOfThoughtDisplayProps {
  thoughtSteps: ThoughtStep[];
  isProcessing: boolean;
  className?: string;
}

interface ThoughtStep {
  step: number;
  action: string;
  reasoning: string;
  status: 'in_progress' | 'complete' | 'error';
  timestamp: string;
  duration?: number;
  result?: string;
  error?: {
    message: string;
    suggestion?: string;
  };
}
```

**Responsibilities**:
- Render thought steps in a visually appealing timeline
- Show progress indicators for in-progress steps
- Display completion checkmarks for completed steps
- Show error indicators for failed steps
- Animate step transitions
- Calculate and display overall progress percentage

### 2. ThoughtStepItem Component

```typescript
interface ThoughtStepItemProps {
  step: ThoughtStep;
  isLatest: boolean;
}
```

**Responsibilities**:
- Render individual thought step
- Show appropriate icon based on status (spinner/checkmark/error)
- Display action name and reasoning
- Show duration for completed steps
- Highlight the currently active step
- Expand/collapse detailed information

### 3. ProgressBar Component

```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}
```

**Responsibilities**:
- Show visual progress bar
- Display percentage complete
- Animate progress changes
- Show estimated time remaining (if available)

## Data Models

### ThoughtStep (Already Defined in Backend)

```typescript
interface ThoughtStep {
  step: number;              // Sequential step number
  action: string;            // What is being done
  reasoning: string;         // Why this step is needed
  status: 'in_progress' | 'complete' | 'error';
  timestamp: string;         // ISO 8601 timestamp
  duration?: number;         // Milliseconds (only for completed steps)
  result?: string;           // Summary of what was accomplished
  error?: {
    message: string;
    suggestion?: string;
  };
}
```

### ChatMessage Extension

```typescript
interface ChatMessage {
  role: 'user' | 'ai';
  content: {
    text: string;
  };
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];  // Add thought steps to messages
  metadata?: {
    executionTime?: number;
    toolsUsed?: string[];
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Thought Step Visibility
*For any* renewable energy query that generates thought steps, all thought steps returned by the backend should be displayed in the frontend UI.
**Validates: Requirements 1.1, 3.1**

### Property 2: Progress Monotonicity
*For any* sequence of thought steps, the progress percentage should never decrease (it should be monotonically increasing).
**Validates: Requirements 3.2**

### Property 3: Status Consistency
*For any* thought step, once its status changes from 'in_progress' to 'complete' or 'error', it should never change back to 'in_progress'.
**Validates: Requirements 1.3, 3.2**

### Property 4: Step Ordering
*For any* sequence of thought steps, they should be displayed in ascending order by step number.
**Validates: Requirements 1.1**

### Property 5: Duration Presence
*For any* thought step with status 'complete', it should have a duration value greater than or equal to 0.
**Validates: Requirements 1.6**

### Property 6: Error Information
*For any* thought step with status 'error', it should have an error object with a message field.
**Validates: Requirements 1.7, 3.5**

## Error Handling

### Missing Thought Steps
- If backend response doesn't include thought steps, show generic loading message
- Don't break the UI if thought steps are undefined

### Malformed Thought Steps
- Validate thought step structure before rendering
- Skip invalid steps with console warning
- Continue rendering valid steps

### Network Errors
- Show error state in ChainOfThoughtDisplay
- Provide retry option
- Preserve last known thought steps

### Timeout Scenarios
- Show timeout message after reasonable duration (60 seconds)
- Suggest checking CloudWatch logs
- Provide option to cancel operation

## Testing Strategy

### Unit Tests

**ChainOfThoughtDisplay Component**:
- Renders empty state when no thought steps provided
- Renders all thought steps in correct order
- Shows progress bar with correct percentage
- Handles in_progress, complete, and error statuses
- Animates step transitions
- Calculates progress correctly

**ThoughtStepItem Component**:
- Renders action and reasoning text
- Shows correct icon for each status
- Displays duration for completed steps
- Shows error message for failed steps
- Highlights active step

**ProgressBar Component**:
- Displays correct percentage
- Animates progress changes
- Shows label text
- Handles edge cases (0%, 100%)

### Property-Based Tests

**Property 1: Thought Step Visibility**
- Generate random thought step arrays
- Verify all steps are rendered in DOM
- Check that step count matches input

**Property 2: Progress Monotonicity**
- Generate sequences of thought steps with increasing completion
- Verify progress percentage never decreases
- Test with various step counts

**Property 3: Status Consistency**
- Generate thought step sequences with status transitions
- Verify no backward transitions (complete → in_progress)
- Test all valid status combinations

**Property 4: Step Ordering**
- Generate thought steps with random step numbers
- Verify they're displayed in ascending order
- Test with gaps in step numbers

**Property 5: Duration Presence**
- Generate completed thought steps
- Verify all have duration >= 0
- Test duration display formatting

**Property 6: Error Information**
- Generate error thought steps
- Verify all have error.message
- Test error display formatting

### Integration Tests

**End-to-End Workflow**:
- Send terrain analysis query
- Verify thought steps appear incrementally
- Check progress bar updates
- Confirm final completion state
- Validate all steps shown

**Error Scenarios**:
- Simulate backend error
- Verify error thought step displayed
- Check error message shown to user
- Confirm recovery options available

## Visual Design

### Thought Step Timeline

```
┌─────────────────────────────────────────────────────────┐
│ Analysis Progress (60%)                                  │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────────────────┘

✓ Validating deployment (120ms)
  All tools available

✓ Analyzing query (85ms)
  Detected: terrain_analysis

⟳ Resolving project context
  Loading project data to auto-fill parameters

○ Invoking terrain analysis tool
  Pending...
```

### Status Icons
- `⟳` - In Progress (spinning animation)
- `✓` - Complete (green checkmark)
- `✗` - Error (red X)
- `○` - Pending (gray circle)

### Color Scheme
- In Progress: Blue (#0066CC)
- Complete: Green (#00AA00)
- Error: Red (#CC0000)
- Pending: Gray (#999999)

### Spacing and Layout
- Each step: 16px vertical padding
- Icon: 24px × 24px
- Action text: 16px font, bold
- Reasoning text: 14px font, regular, gray
- Duration: 12px font, italic, light gray
- Indent sub-steps: 32px left margin

## Performance Considerations

### Rendering Optimization
- Use React.memo for ThoughtStepItem to prevent unnecessary re-renders
- Virtualize long lists of thought steps (if > 20 steps)
- Debounce progress bar animations

### Animation Performance
- Use CSS transforms for animations (GPU-accelerated)
- Limit animation duration to 200-300ms
- Disable animations on low-end devices

### Memory Management
- Limit thought step history to last 50 steps
- Clear old thought steps when starting new query
- Avoid memory leaks in animation timers

## Accessibility

### Screen Reader Support
- Announce new thought steps as they appear
- Provide ARIA labels for status icons
- Use semantic HTML (ordered list for steps)

### Keyboard Navigation
- Allow expanding/collapsing steps with keyboard
- Focus management for new steps
- Skip links for long thought step lists

### Visual Accessibility
- High contrast mode support
- Sufficient color contrast ratios (WCAG AA)
- Don't rely solely on color for status (use icons too)
- Scalable text (respects user font size preferences)

## Implementation Notes

### Integration with ChatPage

The ChainOfThoughtDisplay should be integrated into ChatPage as follows:

1. **Message Rendering**: When rendering AI messages, check if `thoughtSteps` exist
2. **Conditional Display**: Only show ChainOfThoughtDisplay if thought steps are present
3. **Positioning**: Display thought steps above the main message text
4. **Collapsible**: Allow users to collapse/expand thought steps to save space
5. **Persistence**: Preserve thought steps in conversation history

### Backend Compatibility

The backend already provides thought steps in this format:
```json
{
  "success": true,
  "message": "Analysis complete",
  "artifacts": [...],
  "thoughtSteps": [
    {
      "step": 1,
      "action": "Validating deployment",
      "reasoning": "Checking if renewable energy tools are available",
      "status": "complete",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "duration": 120,
      "result": "All tools available"
    }
  ]
}
```

No backend changes are required - we just need to display this data.

### Future Enhancements

1. **Streaming Support**: If backend adds streaming, update to show steps in realtime
2. **Detailed Logs**: Add expandable section for detailed logs per step
3. **Performance Metrics**: Show timing breakdown chart
4. **Export**: Allow exporting thought steps as JSON/text
5. **Filtering**: Filter steps by status or tool type
