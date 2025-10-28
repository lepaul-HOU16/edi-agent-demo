# Task 13: Integration Tests - Quick Reference

## Test File
`tests/integration/test-edicraft-integration.test.ts`

## Run Tests

### Run Integration Tests
```bash
npx jest tests/integration/test-edicraft-integration.test.ts --verbose
```

### Run All EDIcraft Tests
```bash
npx jest --testPathPattern="edicraft" --verbose
```

## Test Coverage

### 38 Integration Tests
- ✅ 6 Complete Flow Tests
- ✅ 5 Error Scenario Tests
- ✅ 4 Thought Step Extraction Tests
- ✅ 6 Response Format Tests
- ✅ 3 Multiple Query Scenario Tests
- ✅ 4 Environment Configuration Tests
- ✅ 7 Edge Case Tests
- ✅ 3 Requirements Verification Tests

## Key Test Scenarios

### Successful Workflows
```typescript
// Wellbore visualization
const query = 'Build wellbore trajectory for wellbore-123 in Minecraft';
const traces = [rationale, actionInvocation, observation, minecraftAction, minecraftObservation];
const response = await simulator.processQuery(query, traces);
// ✅ response.success === true
// ✅ response.thoughtSteps.length > 0
// ✅ response.artifacts === []
```

### Error Scenarios
```typescript
// Missing environment variables
const invalidConfig = { ...config, bedrockAgentId: '' };
const response = await simulator.processQuery(query, traces);
// ✅ response.success === false
// ✅ response.error === 'INVALID_CONFIG'
// ✅ response.connectionStatus === 'error'
```

### Thought Step Extraction
```typescript
// Extract from traces
const traces = [rationale, actionInvocation, observation];
const response = await simulator.processQuery(query, traces);
// ✅ Has analysis steps (from rationale)
// ✅ Has processing steps (from actions/observations)
// ✅ Has completion step (added automatically)
```

## Mock Bedrock Traces

### Rationale (Analysis)
```typescript
{
  orchestrationTrace: {
    rationale: {
      text: 'I need to fetch wellbore data and build in Minecraft'
    }
  }
}
```

### Action Invocation (Processing)
```typescript
{
  orchestrationTrace: {
    invocationInput: {
      actionGroupInvocationInput: {
        actionGroupName: 'OSDU_Tools',
        function: 'get_wellbore_trajectory',
        parameters: [{ name: 'wellbore_id', value: 'wellbore-123' }]
      }
    }
  }
}
```

### Observation (Processing)
```typescript
{
  orchestrationTrace: {
    observation: {
      actionGroupInvocationOutput: {
        text: 'Successfully retrieved wellbore trajectory'
      }
    }
  }
}
```

### Failure (Error)
```typescript
{
  failureTrace: {
    failureReason: 'Connection to Minecraft server failed',
    traceId: 'trace-123'
  }
}
```

## Response Format

### Success Response
```typescript
{
  success: true,
  message: 'Wellbore built successfully at coordinates (100, 64, 200)',
  artifacts: [], // Always empty for EDIcraft
  thoughtSteps: [
    { id: 'step-0', type: 'analysis', ... },
    { id: 'step-1', type: 'processing', ... },
    { id: 'step-2', type: 'completion', ... }
  ],
  connectionStatus: 'connected'
}
```

### Error Response
```typescript
{
  success: false,
  message: 'Configuration error: Missing bedrockAgentId',
  artifacts: [],
  thoughtSteps: [],
  connectionStatus: 'error',
  error: 'INVALID_CONFIG'
}
```

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
Time:        0.591 s
```

## Requirements Satisfied

✅ **Requirement 6.5**: Integration Testing
- Complete flow from query to response
- Error scenarios (missing env vars, connection failures)
- Thought step extraction from mock traces
- Response format compatibility

## Next Tasks

- **Task 14**: Manual Testing and Validation
- **Task 15**: Update Documentation
