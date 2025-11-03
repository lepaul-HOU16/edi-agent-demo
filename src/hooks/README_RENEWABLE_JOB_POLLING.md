# Renewable Job Polling Hook

## Overview

The `useRenewableJobPolling` hook provides a polling mechanism to check for new renewable energy job results in the ChatMessage table. It's designed to work with the async renewable job pattern where long-running analyses are processed in the background.

## Purpose

This hook solves the problem of AWS AppSync's 30-second timeout limit for renewable energy queries by:
- Polling the ChatMessage table every 3-5 seconds
- Detecting when new AI responses arrive
- Automatically stopping when results are complete
- Providing real-time status updates

## Installation

The hook is already exported from `src/hooks/index.ts`:

```typescript
import { useRenewableJobPolling } from '@/hooks';
```

## Basic Usage

```typescript
import { useRenewableJobPolling } from '@/hooks';

function MyComponent({ chatSessionId }: { chatSessionId: string }) {
  const {
    isProcessing,
    hasNewResults,
    latestMessage,
    error
  } = useRenewableJobPolling({
    chatSessionId,
    enabled: true,
    pollingInterval: 3000 // Poll every 3 seconds
  });

  if (isProcessing) {
    return <div>Processing renewable energy analysis...</div>;
  }

  if (hasNewResults && latestMessage) {
    return <div>Analysis complete! {latestMessage.artifacts?.length} artifacts</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Waiting for job...</div>;
}
```

## API Reference

### Parameters

```typescript
interface UseRenewableJobPollingOptions {
  chatSessionId: string;        // Required: Chat session to poll
  enabled: boolean;              // Required: Enable/disable polling
  pollingInterval?: number;      // Optional: Polling interval in ms (default: 3000)
  onNewMessage?: (message) => void;  // Optional: Callback when new message detected
  onError?: (error: Error) => void;  // Optional: Callback when error occurs
}
```

### Return Value

```typescript
{
  isProcessing: boolean;         // True while job is processing
  hasNewResults: boolean;        // True when new results are available
  latestMessage: Message | null; // Latest message from the chat
  error: string | null;          // Error message if polling fails
  startPolling: () => void;      // Manually start polling
  stopPolling: () => void;       // Manually stop polling
}
```

## Advanced Usage

### With Callbacks

```typescript
const { isProcessing, hasNewResults } = useRenewableJobPolling({
  chatSessionId: 'session-123',
  enabled: true,
  pollingInterval: 5000, // Poll every 5 seconds
  onNewMessage: (message) => {
    console.log('New message received:', message);
    // Update UI, show notification, etc.
  },
  onError: (error) => {
    console.error('Polling failed:', error);
    // Show error notification
  }
});
```

### Manual Control

```typescript
const {
  isProcessing,
  startPolling,
  stopPolling
} = useRenewableJobPolling({
  chatSessionId: 'session-123',
  enabled: false // Start disabled
});

// Start polling manually
const handleStartAnalysis = () => {
  startPolling();
};

// Stop polling manually
const handleCancel = () => {
  stopPolling();
};
```

### Conditional Polling

```typescript
const [jobStarted, setJobStarted] = useState(false);

const { isProcessing, hasNewResults } = useRenewableJobPolling({
  chatSessionId: 'session-123',
  enabled: jobStarted, // Only poll when job is started
  pollingInterval: 3000
});

const handleStartJob = async () => {
  // Start the renewable energy job
  await startRenewableJob();
  setJobStarted(true); // Enable polling
};
```

## How It Works

1. **Initialization**: When `enabled` is true, the hook initializes an Amplify client and starts polling
2. **Polling**: Every `pollingInterval` milliseconds, it queries the ChatMessage table for the specified chat session
3. **Message Detection**: It compares the newest message ID with the last seen message ID
4. **State Updates**: When a new message is detected:
   - If `role === 'ai'` and `responseComplete === true`: Sets `hasNewResults = true` and stops polling
   - If `role === 'ai'` and `responseComplete === false`: Sets `isProcessing = true` and continues polling
5. **Cleanup**: When unmounted or disabled, it clears the polling interval

## Message Detection Logic

The hook detects new messages by:
1. Querying all messages in the chat session
2. Sorting by `createdAt` timestamp (newest first)
3. Comparing the newest message ID with the last seen ID
4. Checking if the message is complete (`responseComplete === true`)

## Performance Considerations

- **Polling Interval**: Default is 3 seconds. Adjust based on expected job duration:
  - Fast jobs (< 30s): 2-3 seconds
  - Medium jobs (30-60s): 3-5 seconds
  - Long jobs (> 60s): 5-10 seconds

- **Auto-Stop**: Polling automatically stops when results are received to avoid unnecessary API calls

- **Conditional Polling**: Only enable polling when a job is actually running

## Error Handling

The hook handles errors gracefully:
- Network errors are caught and exposed via the `error` state
- The `onError` callback is called with the error object
- Polling continues even after errors (doesn't stop on transient failures)

## Testing

Comprehensive tests are available in `src/hooks/__tests__/useRenewableJobPolling.test.ts`:

```bash
npm test -- src/hooks/__tests__/useRenewableJobPolling.test.ts
```

Test coverage includes:
- Initialization
- Polling behavior (start, stop, interval)
- Message detection (new, processing, complete)
- Callbacks (onNewMessage, onError)
- Manual control (startPolling, stopPolling)
- Cleanup on unmount
- Edge cases (empty messages, null data, etc.)

## Example Component

See `src/components/renewable/RenewableJobPollingExample.tsx` for a complete example showing:
- Processing state with progress indicator
- Success state with results
- Error state with error message
- Idle and disabled states

## Integration with Async Job Pattern

This hook is designed to work with the async renewable job pattern:

1. **Frontend**: User submits renewable energy query
2. **Backend**: Creates job record, invokes orchestrator async, returns immediately
3. **Frontend**: Enables polling via this hook
4. **Backend**: Orchestrator processes in background, writes results to ChatMessage table
5. **Frontend**: Hook detects new message, updates UI automatically

## Best Practices

1. **Enable Only When Needed**: Don't poll unless a job is actually running
2. **Use Appropriate Interval**: Balance responsiveness vs. API call frequency
3. **Handle All States**: Show appropriate UI for processing, success, error, and idle states
4. **Cleanup**: The hook automatically cleans up on unmount, but you can manually stop if needed
5. **Callbacks**: Use callbacks for side effects (notifications, analytics, etc.)

## Troubleshooting

### Polling Doesn't Start
- Check that `enabled` is `true`
- Verify `chatSessionId` is not empty
- Check browser console for initialization errors

### Messages Not Detected
- Verify messages are being written to the correct chat session
- Check that messages have `role === 'ai'` and `responseComplete === true`
- Look for errors in the browser console

### Polling Doesn't Stop
- Check that messages have `responseComplete === true`
- Verify the message ID is being set correctly
- Manually call `stopPolling()` if needed

## Related Files

- Hook: `src/hooks/useRenewableJobPolling.ts`
- Tests: `src/hooks/__tests__/useRenewableJobPolling.test.ts`
- Example: `src/components/renewable/RenewableJobPollingExample.tsx`
- Schema: `amplify/data/resource.ts` (ChatMessage model)
- Requirements: `.kiro/specs/async-renewable-jobs/requirements.md`
- Design: `.kiro/specs/async-renewable-jobs/design.md`
