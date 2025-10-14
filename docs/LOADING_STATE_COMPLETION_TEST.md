# Loading State Completion Test Documentation

## Overview

This document describes the comprehensive testing approach for Task 16: Test loading state completion. The tests verify that the loading indicator appears and disappears correctly for renewable energy terrain analysis queries in all scenarios.

## Test Requirements

Based on requirements 4.1-4.5 from the spec:

1. **4.1**: Loading indicator appears when orchestrator completes processing
2. **4.2**: Loading indicator is removed when response reaches frontend
3. **4.3**: Loading indicator is cleared when an error occurs
4. **4.4**: System returns timeout error within reasonable timeframe
5. **4.5**: User does not need to reload page to see results

## Test Files Created

### 1. Integration Tests (`tests/integration/renewable-loading-state.test.ts`)

Automated Jest tests that verify loading state behavior using mocked Amplify client.

**Test Scenarios:**
- ✅ Successful response scenario
  - Loading indicator appears when analysis starts
  - Loading indicator disappears when analysis completes
  - Results display without page reload
  
- ✅ Error response scenario
  - Loading indicator disappears on error
  - Error message displays without page reload
  - Permission denied errors handled gracefully
  
- ✅ Timeout scenario
  - Loading indicator disappears on timeout
  - Timeout message displays with remediation steps
  - Retry allowed without page reload
  
- ✅ Loading state transitions
  - Correct state transitions (idle → loading → complete)
  - No race conditions with rapid updates
  - Streaming responses maintain loading state
  
- ✅ UI state consistency
  - No page reload required for any state change

**Running the tests:**
```bash
npm test tests/integration/renewable-loading-state.test.ts
```

### 2. E2E Test Script (`scripts/test-loading-state-completion.js`)

Node.js script that tests loading state with real Amplify backend.

**Features:**
- Creates test chat sessions
- Sends real terrain analysis queries
- Monitors loading state transitions
- Measures response times
- Generates detailed test reports

**Running the script:**
```bash
node scripts/test-loading-state-completion.js
```

**Output:**
```
🚀 Starting Loading State Completion Tests
================================================================================
🧪 Test Scenario: Successful terrain analysis
================================================================================
Query: "Analyze terrain for wind farm at coordinates 10.5, 106.5 with radius 5km"
Expected: Loading indicator should appear, then disappear when complete

📝 Creating test chat session...
✅ Created chat session: abc-123-def
👂 Subscribing to messages...
💬 Sending query: "Analyze terrain for wind farm at coordinates 10.5, 106.5 with radius 5km"
🔄 Loading state: STARTED
🤖 Invoking agent...
📊 Agent response received
📨 Received message: ai - COMPLETE
✅ Loading state: COMPLETED (3245ms)

📊 Test Results:
────────────────────────────────────────────────────────────────────────────────
Duration: 3245ms
States: loading_started → loading_completed
Messages received: 2
Success: ✅

✅ Loading State Verification:
  Loading indicator appeared: ✅
  Loading indicator disappeared: ✅
  No page reload required: ✅ (reactive subscription)
  Response complete: ✅
  Artifacts: 1
```

### 3. Manual UI Test (`tests/manual/loading-state-ui-test.html`)

Interactive HTML page for manual testing in the browser.

**Features:**
- Visual loading indicators
- Real-time state monitoring
- Detailed test checklists
- Console logging
- Three test scenarios:
  1. Successful terrain analysis
  2. Error handling
  3. Timeout handling

**Running the test:**
1. Open `tests/manual/loading-state-ui-test.html` in a browser
2. Open Developer Console (F12)
3. Click "Run Test" for each scenario
4. Verify checklist items pass
5. Review console logs

**Test Checklist Example:**
```
Test 1: Successful Terrain Analysis
✅ Loading indicator appears when query is sent
✅ Loading indicator shows "Analyzing..." or similar message
✅ Loading indicator disappears when analysis completes
✅ Results are displayed without page reload
✅ Terrain map artifact is rendered
```

## Test Scenarios

### Scenario 1: Successful Response

**Query:** "Analyze terrain for wind farm at coordinates 10.5, 106.5 with radius 5km"

**Expected Behavior:**
1. User sends query
2. Loading indicator appears immediately
3. Loading indicator shows "Analyzing..." message
4. Backend processes request (2-5 seconds)
5. Loading indicator disappears
6. Results display with terrain map
7. No page reload required

**Verification Points:**
- ✅ `isLoading` state changes from `false` → `true` → `false`
- ✅ ThinkingIndicator component renders during loading
- ✅ Message with `responseComplete: true` received
- ✅ Artifacts array contains terrain map
- ✅ UI updates reactively via subscription

### Scenario 2: Error Response

**Query:** Any terrain analysis query when orchestrator is not deployed

**Expected Behavior:**
1. User sends query
2. Loading indicator appears
3. Backend attempts to invoke orchestrator
4. Error occurs (orchestrator not found, permission denied, etc.)
5. Loading indicator disappears
6. Error message displays with remediation steps
7. User can retry without reload

**Verification Points:**
- ✅ `isLoading` state changes from `false` → `true` → `false`
- ✅ Error message contains "Error" or "❌"
- ✅ Remediation steps provided
- ✅ Message with `responseComplete: true` received
- ✅ No artifacts in response

### Scenario 3: Timeout Response

**Query:** Large area analysis that exceeds 60-second timeout

**Expected Behavior:**
1. User sends query
2. Loading indicator appears
3. Backend processes for extended time
4. Timeout occurs after 60 seconds
5. Loading indicator disappears
6. Timeout message displays
7. User can retry with smaller area

**Verification Points:**
- ✅ `isLoading` state changes from `false` → `true` → `false`
- ✅ Timeout message contains "timed out" or "⏱️"
- ✅ Duration approximately 60 seconds
- ✅ Remediation suggests smaller area
- ✅ Message with `responseComplete: true` received

## Implementation Details

### Loading State Management

The loading state is managed in `ChatBox.tsx`:

```typescript
const [isLoading, setIsLoading] = useState<boolean>(false);

// Set loading when sending message
const handleSend = async (userMessage: string) => {
  setIsLoading(true);
  await sendMessage({ ... });
};

// Clear loading when response complete
useEffect(() => {
  const messagesSub = amplifyClient.models.ChatMessage.observeQuery({
    filter: { chatSessionId: { eq: chatSessionId } }
  }).subscribe({
    next: ({ items }) => {
      setMessages((prevMessages) => {
        const sortedMessages = combineAndSortMessages(prevMessages, items);
        if (sortedMessages[sortedMessages.length - 1]?.responseComplete) {
          setIsLoading(false); // ✅ Clear loading state
        }
        return sortedMessages;
      });
    }
  });
}, [chatSessionId]);
```

### Loading Indicator Component

The `ThinkingIndicator` component displays during loading:

```typescript
{isLoading && (
  <ListItem>
    <ThinkingIndicator
      context="🧠 Analyzing your request..."
      step="Preparing analysis workflow"
      progress={0}
      isVisible={true}
    />
  </ListItem>
)}
```

### Response Completion

Messages are marked complete with `responseComplete: true`:

```typescript
const aiMessage: Schema['ChatMessage']['createType'] = {
  role: 'ai',
  content: { text: response.message },
  chatSessionId: chatSessionId,
  responseComplete: true, // ✅ Marks response as complete
  artifacts: response.artifacts,
};
```

## Running All Tests

### Automated Tests
```bash
# Run integration tests
npm test tests/integration/renewable-loading-state.test.ts

# Run with coverage
npm test -- --coverage tests/integration/renewable-loading-state.test.ts
```

### E2E Tests
```bash
# Run E2E test script
node scripts/test-loading-state-completion.js

# Run with specific scenario
node scripts/test-loading-state-completion.js --scenario=success
```

### Manual Tests
```bash
# Open manual test page
open tests/manual/loading-state-ui-test.html

# Or serve with local server
npx http-server tests/manual -p 8080
# Then navigate to http://localhost:8080/loading-state-ui-test.html
```

## Success Criteria

All tests pass when:

1. ✅ Loading indicator appears immediately when query is sent
2. ✅ Loading indicator disappears when response is complete
3. ✅ Loading indicator disappears when error occurs
4. ✅ Loading indicator disappears when timeout occurs
5. ✅ No page reload is required for any scenario
6. ✅ Results display reactively via subscription
7. ✅ Error messages include remediation steps
8. ✅ Timeout messages suggest smaller area
9. ✅ User can retry after error/timeout
10. ✅ State transitions are correct (idle → loading → complete/error)

## Troubleshooting

### Loading Indicator Doesn't Appear

**Possible Causes:**
- `isLoading` state not being set to `true`
- ThinkingIndicator component not rendering
- CSS hiding the indicator

**Debug Steps:**
1. Check console for `isLoading` state changes
2. Verify ThinkingIndicator is in component tree
3. Check CSS for `display: none` or `visibility: hidden`

### Loading Indicator Doesn't Disappear

**Possible Causes:**
- `responseComplete` not set to `true` in message
- Subscription not receiving complete message
- Error in message processing

**Debug Steps:**
1. Check CloudWatch logs for orchestrator response
2. Verify message has `responseComplete: true`
3. Check subscription is active
4. Look for errors in console

### Page Reload Required

**Possible Causes:**
- Subscription not working
- State not updating reactively
- Component not re-rendering

**Debug Steps:**
1. Verify subscription is created
2. Check `observeQuery` is called correctly
3. Ensure state updates trigger re-renders
4. Look for React warnings in console

## Related Documentation

- [Orchestrator Fix Spec Complete](./ORCHESTRATOR_FIX_SPEC_COMPLETE.md)
- [Renewable Proxy Agent Logging](./RENEWABLE_PROXY_AGENT_LOGGING_ENHANCEMENT.md)
- [Timeout Detection Implementation](./TIMEOUT_DETECTION_IMPLEMENTATION.md)
- [Error Categorization Implementation](./ERROR_CATEGORIZATION_IMPLEMENTATION.md)

## Conclusion

The loading state completion tests provide comprehensive coverage of all scenarios where the loading indicator should appear and disappear. The combination of automated integration tests, E2E scripts, and manual UI tests ensures that the loading state behavior is correct and provides a good user experience.

All tests verify that no page reload is required, which is a critical requirement for a modern reactive web application.
