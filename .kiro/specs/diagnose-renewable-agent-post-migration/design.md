# Design Document

## Overview

This design outlines a systematic diagnostic approach to identify and fix the renewable agent issues post-CDK migration. The approach focuses on testing each integration point in the message flow from frontend to backend and back.

## Architecture

### Current Message Flow

```
User Input (Frontend)
    ↓
ChatBox Component (src/components/ChatBox.tsx)
    ↓
sendMessage (src/utils/chatUtils.ts)
    ↓
REST API Client (src/lib/api/chat.ts)
    ↓
API Gateway HTTP API
    ↓
Chat Lambda (cdk/lambda-functions/chat/handler.ts)
    ↓
Agent Handler (cdk/lambda-functions/chat/agents/handler.ts)
    ↓
Agent Router (cdk/lambda-functions/chat/agents/agentRouter.ts)
    ↓
Renewable Proxy Agent (cdk/lambda-functions/chat/agents/renewableProxyAgent.ts)
    ↓
Renewable Orchestrator Lambda (cdk/lambda-functions/renewable-orchestrator/handler.ts)
    ↓
Tool Lambdas (terrain, layout, simulation)
    ↓
Response back through the chain
    ↓
DynamoDB (message persistence)
    ↓
Frontend displays results
```

### Identified Issues

Based on code analysis, potential issues include:

1. **Message Display Issue**: User message may not be saved to DynamoDB before agent processing
2. **Agent Routing Issue**: Renewable agent may not be properly initialized or selected
3. **Orchestrator Configuration**: Environment variables may not be set correctly
4. **Response Format**: API response format may not match frontend expectations
5. **Artifact Transformation**: Artifacts may be lost or incorrectly formatted during transformation
6. **Error Handling**: Errors may be swallowed without proper logging

## Components and Interfaces

### 1. Diagnostic Test Suite

Create a comprehensive test suite to verify each integration point:

#### Test 1: Frontend Message Sending
- **Purpose**: Verify message is sent to API correctly
- **Method**: Add console logging in ChatBox and chatUtils
- **Success Criteria**: Message appears in browser console with correct format

#### Test 2: API Gateway Integration
- **Purpose**: Verify API Gateway receives and forwards requests
- **Method**: Check API Gateway CloudWatch logs
- **Success Criteria**: Request logged with correct path and body

#### Test 3: Chat Lambda Processing
- **Purpose**: Verify Chat Lambda receives and processes requests
- **Method**: Check Chat Lambda CloudWatch logs
- **Success Criteria**: User message saved to DynamoDB, agent handler called

#### Test 4: Agent Router Selection
- **Purpose**: Verify renewable agent is selected and initialized
- **Method**: Check Agent Router logs for routing decision
- **Success Criteria**: "Routing to Renewable Energy Agent" logged

#### Test 5: Proxy Agent Invocation
- **Purpose**: Verify Proxy Agent invokes orchestrator
- **Method**: Check Proxy Agent logs for Lambda invocation
- **Success Criteria**: Orchestrator invoked with correct payload

#### Test 6: Orchestrator Processing
- **Purpose**: Verify orchestrator processes query and returns results
- **Method**: Check Orchestrator CloudWatch logs
- **Success Criteria**: Intent detected, tool invoked, artifacts generated

#### Test 7: Response Transformation
- **Purpose**: Verify artifacts are correctly transformed
- **Method**: Check Proxy Agent logs for artifact transformation
- **Success Criteria**: Artifacts transformed to EDI format

#### Test 8: Message Persistence
- **Purpose**: Verify AI response is saved to DynamoDB
- **Method**: Query DynamoDB for AI message with artifacts
- **Success Criteria**: AI message exists with artifacts array

#### Test 9: API Response Format
- **Purpose**: Verify API returns correct response format
- **Method**: Check Chat Lambda response structure
- **Success Criteria**: Response has success, message, and response.artifacts fields

#### Test 10: Frontend Display
- **Purpose**: Verify frontend displays artifacts
- **Method**: Check ChatMessage component rendering
- **Success Criteria**: Artifacts rendered as visual components

### 2. Configuration Verification

Verify all required environment variables are set:

#### Chat Lambda Environment Variables
```typescript
{
  STORAGE_BUCKET: string,
  CHAT_MESSAGE_TABLE: string,
  CHAT_SESSION_TABLE: string,
  PROJECT_TABLE: string,
  AGENT_PROGRESS_TABLE: string,
  SESSION_CONTEXT_TABLE: string,
  PETROPHYSICS_CALCULATOR_FUNCTION_NAME: string,
  // Renewable-specific (if needed)
  RENEWABLE_ORCHESTRATOR_FUNCTION_NAME?: string
}
```

#### Renewable Proxy Agent Configuration
```typescript
{
  region: string,
  agentCoreEndpoint: string, // Orchestrator function name
  enabled: boolean
}
```

#### Renewable Orchestrator Environment Variables
```typescript
{
  RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: string,
  RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: string,
  RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: string,
  RENEWABLE_S3_BUCKET: string,
  SESSION_CONTEXT_TABLE: string
}
```

### 3. Logging Enhancement

Add comprehensive logging at each integration point:

#### Frontend Logging
```typescript
// In ChatBox.tsx
console.log('🔵 FRONTEND: Sending message:', message);
console.log('🔵 FRONTEND: Session ID:', chatSessionId);
console.log('🔵 FRONTEND: Selected agent:', selectedAgent);

// In chatUtils.ts
console.log('🔵 API CLIENT: Request:', { message, chatSessionId });
console.log('🔵 API CLIENT: Response:', response);
```

#### Backend Logging
```typescript
// In chat/handler.ts
console.log('🟢 CHAT LAMBDA: Request received');
console.log('🟢 CHAT LAMBDA: User message saved:', userMessageId);
console.log('🟢 CHAT LAMBDA: Agent response:', agentResponse);
console.log('🟢 CHAT LAMBDA: AI message saved:', aiMessageId);

// In agentRouter.ts
console.log('🟡 AGENT ROUTER: Routing decision:', agentType);
console.log('🟡 AGENT ROUTER: Renewable enabled:', this.renewableEnabled);

// In renewableProxyAgent.ts
console.log('🟠 PROXY AGENT: Invoking orchestrator:', functionName);
console.log('🟠 PROXY AGENT: Orchestrator response:', response);
console.log('🟠 PROXY AGENT: Transformed artifacts:', artifacts);

// In renewable-orchestrator/handler.ts
console.log('🔴 ORCHESTRATOR: Query received:', query);
console.log('🔴 ORCHESTRATOR: Intent detected:', intent);
console.log('🔴 ORCHESTRATOR: Tool results:', results);
console.log('🔴 ORCHESTRATOR: Final artifacts:', artifacts);
```

### 4. Error Handling Improvements

Implement comprehensive error handling:

#### Frontend Error Handling
```typescript
try {
  const response = await sendMessage(...);
  if (!response.success) {
    console.error('❌ FRONTEND: API error:', response.error);
    // Display error to user
  }
} catch (error) {
  console.error('❌ FRONTEND: Network error:', error);
  // Display network error to user
}
```

#### Backend Error Handling
```typescript
try {
  const agentResponse = await agentHandler(event);
  // Process response
} catch (error) {
  console.error('❌ CHAT LAMBDA: Agent error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to process message'
    })
  };
}
```

## Data Models

### Message Model (DynamoDB)
```typescript
interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: 'human' | 'ai' | 'tool';
  content: {
    text: string;
  };
  artifacts?: Artifact[];
  thoughtSteps?: ThoughtStep[];
  responseComplete: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Artifact Model
```typescript
interface Artifact {
  type: string;
  messageContentType: string;
  data: {
    messageContentType: string;
    [key: string]: any;
  };
  metadata?: {
    projectId?: string;
    projectName?: string;
    [key: string]: any;
  };
}
```

### API Response Model
```typescript
interface ChatAPIResponse {
  success: boolean;
  message: string;
  response: {
    text: string;
    artifacts: Artifact[];
  };
  data?: {
    artifacts: Artifact[];
    thoughtSteps: ThoughtStep[];
    sourceAttribution: any[];
    agentUsed: string;
  };
}
```

## Testing Strategy

### Phase 1: Isolation Testing
1. Test petrophysics agent to verify base functionality works
2. Test renewable orchestrator directly (bypass proxy agent)
3. Test proxy agent in isolation
4. Test agent router selection logic

### Phase 2: Integration Testing
1. Test full flow with simple renewable query
2. Verify message persistence at each step
3. Verify artifact transformation
4. Verify frontend display

### Phase 3: End-to-End Testing
1. Test complete user workflow
2. Verify all artifacts display correctly
3. Verify error handling
4. Verify logging completeness

## Diagnostic Checklist

### Pre-Deployment Checks
- [ ] All environment variables set in CDK stack
- [ ] Renewable orchestrator Lambda deployed
- [ ] Tool Lambdas (terrain, layout, simulation) deployed
- [ ] IAM permissions granted for Lambda invocation
- [ ] DynamoDB tables accessible
- [ ] S3 bucket accessible

### Runtime Checks
- [ ] Chat Lambda receives requests
- [ ] User message saved to DynamoDB
- [ ] Agent router selects renewable agent
- [ ] Proxy agent initialized
- [ ] Orchestrator invoked successfully
- [ ] Orchestrator returns artifacts
- [ ] Artifacts transformed correctly
- [ ] AI message saved with artifacts
- [ ] API returns correct response format
- [ ] Frontend displays artifacts

### Logging Checks
- [ ] Frontend logs message sending
- [ ] API Gateway logs request
- [ ] Chat Lambda logs processing
- [ ] Agent Router logs selection
- [ ] Proxy Agent logs invocation
- [ ] Orchestrator logs processing
- [ ] All errors logged with stack traces

## Implementation Plan

### Step 1: Add Comprehensive Logging
- Add logging to all integration points
- Deploy and test with simple query
- Review CloudWatch logs for complete flow

### Step 2: Verify Configuration
- Check all environment variables
- Verify Lambda function names
- Verify IAM permissions
- Test orchestrator invocation directly

### Step 3: Test Agent Routing
- Test with explicit agent selection (renewable)
- Test with auto agent selection
- Verify renewable agent initialization
- Check agent router logs

### Step 4: Test Message Persistence
- Verify user message saved
- Verify AI message saved with artifacts
- Query DynamoDB to confirm
- Check for duplicate messages

### Step 5: Test Response Format
- Verify API response structure
- Check artifact format
- Verify frontend receives artifacts
- Test artifact rendering

### Step 6: Fix Identified Issues
- Fix configuration issues
- Fix routing issues
- Fix persistence issues
- Fix response format issues
- Fix artifact transformation issues

### Step 7: End-to-End Verification
- Test complete user workflow
- Verify all requirements met
- Test error scenarios
- Verify logging completeness

## Success Criteria

The renewable agent will be considered fixed when:

1. User messages appear immediately in chat interface
2. Renewable queries are routed to renewable agent
3. Orchestrator processes queries successfully
4. Artifacts are returned and displayed
5. Messages are persisted to DynamoDB
6. API returns correct response format
7. Errors are handled gracefully with clear messages
8. Complete logging is available for debugging
9. Petrophysics agent continues to work correctly
10. No "No response generated" errors for valid queries
