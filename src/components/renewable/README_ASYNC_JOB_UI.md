# Async Renewable Job UI Implementation

## Overview

This implementation provides UI components for displaying processing state during async renewable energy jobs. It addresses Requirements 2 and 3 from the async-renewable-jobs spec:

- **Requirement 2**: Job Status Tracking - Real-time progress updates
- **Requirement 3**: Result Delivery - Auto-update when results arrive

## Components

### 1. RenewableJobProcessingIndicator

Low-level component that displays processing state.

**Features:**
- "Analyzing..." message with status indicator
- Progress bar showing current step
- Estimated time remaining
- Step descriptions (terrain analysis, layout optimization, simulation)
- Error state display

**Usage:**
```tsx
<RenewableJobProcessingIndicator
  isProcessing={true}
  currentStep="terrain_analysis"
  completedSteps={1}
  totalSteps={3}
  estimatedTimeRemaining={45}
  error={null}
/>
```

### 2. useRenewableJobStatus Hook

Hook that combines polling with UI state management.

**Features:**
- Integrates with useRenewableJobPolling
- Tracks current step and progress
- Calculates estimated time remaining
- Handles completion and errors
- Provides callbacks for lifecycle events

**Usage:**
```tsx
const jobStatus = useRenewableJobStatus({
  chatSessionId: 'session-123',
  enabled: true,
  onComplete: (message) => {
    console.log('Job complete!', message);
  },
  onError: (error) => {
    console.error('Job failed:', error);
  }
});

// Access status
console.log(jobStatus.isProcessing);
console.log(jobStatus.currentStep);
console.log(jobStatus.completedSteps);
```

### 3. RenewableJobStatusDisplay

High-level integration component for chat interfaces.

**Features:**
- Combines hook and indicator
- Manages visibility state
- Handles auto-hide on completion
- Provides simple integration API

**Usage:**
```tsx
<RenewableJobStatusDisplay
  chatSessionId={chatSessionId}
  enabled={isRenewableJobActive}
  onComplete={(message) => {
    // Results auto-display via polling
    setIsRenewableJobActive(false);
  }}
  onError={(error) => {
    showErrorNotification(error.message);
  }}
/>
```

## Integration Guide

### Step 1: Add State to Chat Component

```tsx
const [isRenewableJobActive, setIsRenewableJobActive] = useState(false);
```

### Step 2: Detect Renewable Queries

```tsx
const handleSendMessage = async (message: string) => {
  // Detect renewable energy queries
  const isRenewableQuery = 
    message.toLowerCase().includes('wind farm') ||
    message.toLowerCase().includes('terrain analysis') ||
    message.toLowerCase().includes('layout optimization') ||
    message.toLowerCase().includes('renewable energy');
  
  if (isRenewableQuery) {
    setIsRenewableJobActive(true);
  }
  
  // Send message to backend
  await sendMessage({
    chatSessionId,
    newMessage: {
      role: 'human',
      content: { text: message }
    }
  });
};
```

### Step 3: Add Status Display to UI

```tsx
return (
  <div className="chat-interface">
    {/* Chat messages */}
    <div className="messages">
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
    </div>
    
    {/* Renewable job status */}
    <RenewableJobStatusDisplay
      chatSessionId={chatSessionId}
      enabled={isRenewableJobActive}
      onComplete={(message) => {
        console.log('✅ Analysis complete!');
        setIsRenewableJobActive(false);
        // Message will auto-display via polling
      }}
      onError={(error) => {
        console.error('❌ Analysis failed:', error);
        setIsRenewableJobActive(false);
        showErrorNotification(error.message);
      }}
    />
    
    {/* Chat input */}
    <ChatBox onSendMessage={handleSendMessage} />
  </div>
);
```

## User Experience Flow

### 1. User Submits Query
```
User: "Analyze wind farm at coordinates 40.7128, -74.0060"
```

### 2. Immediate Response (< 1 second)
```
┌─────────────────────────────────────────┐
│ ⏳ Analyzing renewable energy site...   │
│                                         │
│ Initializing analysis                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Step 0 of 3                             │
│ ~60s remaining                          │
│                                         │
│ Your results will appear automatically  │
│ when the analysis is complete.          │
│ This typically takes 30-60 seconds.     │
└─────────────────────────────────────────┘
```

### 3. Progress Updates (Every 3-5 seconds)
```
┌─────────────────────────────────────────┐
│ ⏳ Analyzing renewable energy site...   │
│                                         │
│ Analyzing terrain and site conditions   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Step 1 of 3                             │
│ ~40s remaining                          │
└─────────────────────────────────────────┘
```

### 4. Completion (Auto-hide)
```
┌─────────────────────────────────────────┐
│ AI: Here's your wind farm analysis...   │
│                                         │
│ [Terrain Map Visualization]             │
│ [Layout Optimization Results]           │
│ [Energy Production Simulation]          │
└─────────────────────────────────────────┘
```

## Step Descriptions

The component automatically maps step names to user-friendly descriptions:

| Step Name | Description |
|-----------|-------------|
| `terrain_analysis` | Analyzing terrain and site conditions |
| `layout_optimization` | Optimizing turbine layout |
| `simulation` | Running energy production simulation |
| `report_generation` | Generating comprehensive report |
| `Initializing analysis` | Starting renewable energy analysis |

## Time Estimation

The component calculates estimated time remaining based on:
- Average step duration: 20 seconds per step
- Elapsed time since job start
- Remaining steps to complete

Formula:
```typescript
const remainingSteps = totalSteps - completedSteps;
const estimated = remainingSteps * 20 - (elapsed % 20);
```

## Error Handling

### Display Error State
```tsx
<RenewableJobProcessingIndicator
  isProcessing={false}
  error="Failed to connect to analysis service"
/>
```

### Error UI
```
┌─────────────────────────────────────────┐
│ ❌ Analysis Error                       │
│                                         │
│ Failed to connect to analysis service   │
└─────────────────────────────────────────┘
```

## Testing

### Unit Tests
```bash
npm test -- RenewableJobProcessingIndicator.test.tsx
npm test -- useRenewableJobStatus.test.ts
```

### Integration Tests
```bash
npm test -- useRenewableJobPolling.integration.test.ts
```

### Manual Testing
1. Start the example component:
   ```tsx
   import { RenewableJobStatusIntegrationExample } from '@/components/renewable';
   
   <RenewableJobStatusIntegrationExample />
   ```

2. Click "Start Renewable Energy Analysis"
3. Observe:
   - Immediate display of processing indicator
   - Progress updates every second
   - Step transitions at 15s, 35s, 55s
   - Auto-hide on completion

## Backend Requirements

For this UI to work correctly, the backend must:

1. **Async Invocation** (Task 1 - Complete ✅)
   - Renewable proxy agent invokes orchestrator with `InvocationType: 'Event'`
   - Returns immediately with job ID

2. **DynamoDB Writes** (Task 2 - Complete ✅)
   - Orchestrator writes results to ChatMessage table
   - Results include artifacts and thought steps

3. **IAM Permissions** (Task 3 - Complete ✅)
   - Orchestrator has permission to write to ChatMessage table
   - Orchestrator can query table name from environment

4. **Polling Support** (Task 4 - Complete ✅)
   - Frontend can poll ChatMessage table
   - New messages detected automatically

## Performance Considerations

### Polling Interval
- Default: 3 seconds (configurable)
- Balances responsiveness vs. API calls
- Stops automatically when results arrive

### State Updates
- Minimal re-renders using React.memo
- Stable callbacks with useCallback
- Memoized values with useMemo

### Memory Management
- Cleanup intervals on unmount
- Clear timeouts properly
- No memory leaks

## Accessibility

- Status indicators use semantic HTML
- Progress bars have proper ARIA labels
- Error messages are announced to screen readers
- Keyboard navigation supported

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Uses AWS Amplify client (requires polyfills for IE11)

## Future Enhancements

1. **Real-time Progress from Backend**
   - Backend publishes progress updates
   - Frontend subscribes via AppSync subscriptions
   - More accurate step tracking

2. **Cancellation Support**
   - Allow users to cancel long-running jobs
   - Backend handles graceful shutdown
   - UI shows cancellation state

3. **Job History**
   - Show previous job results
   - Allow re-running failed jobs
   - Export job results

4. **Advanced Progress Indicators**
   - Animated visualizations
   - Real-time metrics (CPU, memory)
   - Detailed step breakdowns

## Troubleshooting

### Indicator Doesn't Show
- Check `enabled` prop is true
- Verify `isProcessing` state is set
- Check console for errors

### Progress Doesn't Update
- Verify polling is active (check console logs)
- Check network tab for API calls
- Verify ChatMessage table permissions

### Results Don't Auto-Display
- Check polling hook is detecting new messages
- Verify message has `responseComplete: true`
- Check message role is 'ai'

### Indicator Doesn't Hide
- Verify `onComplete` callback is called
- Check `hasNewResults` state
- Verify timeout cleanup

## Support

For issues or questions:
1. Check console logs for detailed debugging
2. Review integration example
3. Run unit tests to verify functionality
4. Check backend CloudWatch logs
