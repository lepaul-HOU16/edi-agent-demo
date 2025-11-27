# Streaming Chain of Thought Implementation Plan

## Problem
Chain of thought steps arrive all at once after 30-60 seconds, not in realtime as they happen.

## Root Cause
The renewable orchestrator runs synchronously - it completes all steps, then returns everything at once. There's no mechanism to stream intermediate thought steps to the frontend.

## Solution: DynamoDB-based Streaming

### Architecture
1. **Backend**: Orchestrator writes each thought step to DynamoDB as it completes
2. **Frontend**: Polls DynamoDB for new thought steps every 2 seconds
3. **Display**: ChainOfThoughtDisplay shows steps incrementally as they arrive

### Implementation Steps

#### 1. Backend: Write Thought Steps Incrementally

In `cdk/lambda-functions/renewable-orchestrator/handler.ts`:
- After each major step completes, write it to DynamoDB immediately
- Use a dedicated table or add to existing messages table
- Include: sessionId, stepNumber, timestamp, action, reasoning, status, duration

```typescript
async function writeThoughtStepToDynamoDB(sessionId: string, step: ThoughtStep) {
  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);
  
  await docClient.send(new PutCommand({
    TableName: process.env.THOUGHT_STEPS_TABLE,
    Item: {
      sessionId,
      stepId: `${sessionId}#${step.step}`,
      timestamp: step.timestamp,
      ...step
    }
  }));
}
```

#### 2. Frontend: Poll for Thought Steps

Create `src/hooks/useThoughtStepPolling.ts`:
```typescript
export function useThoughtStepPolling(sessionId: string, enabled: boolean) {
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(async () => {
      const response = await fetch(`/api/thought-steps/${sessionId}`);
      const newSteps = await response.json();
      setThoughtSteps(newSteps);
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [sessionId, enabled]);
  
  return thoughtSteps;
}
```

#### 3. API Endpoint: Read Thought Steps

Create Lambda to query DynamoDB for thought steps by sessionId.

#### 4. Frontend Integration

In ChatBox.tsx:
```typescript
const thoughtSteps = useThoughtStepPolling(chatSessionId, isLoading);
```

Pass to ChainOfThoughtDisplay which already handles incremental updates.

## Alternative: Use Existing Message Polling

The codebase already has `useChatMessagePolling` - we could:
1. Store thought steps in the message record
2. Update the message incrementally as steps complete
3. Frontend polls messages and extracts thought steps

This requires less infrastructure but means thought steps are tied to messages.

## Recommendation

Use the existing message polling infrastructure:
1. Orchestrator updates the AI message in DynamoDB after each step
2. Frontend polls messages (already implemented)
3. Extract and display thought steps from the latest message

This is simpler and reuses existing code.
