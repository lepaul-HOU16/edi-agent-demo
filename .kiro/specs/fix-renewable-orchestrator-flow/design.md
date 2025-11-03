# Design Document

## Overview

This design addresses the critical issue where the `renewableOrchestrator` Lambda is not functioning properly, causing terrain analysis to fail or return incomplete data. The solution involves adding comprehensive diagnostics, fixing the invocation flow, and implementing proper error handling throughout the renewable energy request pipeline.

## Architecture

### Current Flow (Broken)
```
User Query → lightweightAgent → AgentRouter → RenewableProxyAgent → ??? → terrain Lambda (direct?) → Incomplete Response
```

### Expected Flow (To Be Fixed)
```
User Query → lightweightAgent → AgentRouter → RenewableProxyAgent → renewableOrchestrator → terrain Lambda → Complete Response
```

### Root Cause Hypothesis

Based on the symptoms (default project ID, 60 features instead of 151, stuck loading), the likely issues are:

1. **Orchestrator Not Being Invoked**: The RenewableProxyAgent might be failing to invoke the orchestrator
2. **Orchestrator Timing Out**: The orchestrator might be taking too long and timing out
3. **Silent Failure**: The orchestrator might be failing but returning fallback data
4. **Direct Terrain Call**: Something might be bypassing the orchestrator and calling terrain directly

## Components and Interfaces

### 1. Diagnostic Utility

**Purpose**: Verify the orchestrator invocation flow and identify where it's breaking

**Location**: `amplify/functions/agents/diagnostics/orchestratorDiagnostics.ts`

**Interface**:
```typescript
interface DiagnosticResult {
  step: string;
  success: boolean;
  details: any;
  error?: string;
  duration?: number;
}

interface OrchestratorDiagnostics {
  // Check if orchestrator Lambda exists
  checkOrchestratorExists(): Promise<DiagnosticResult>;
  
  // Test orchestrator invocation with simple payload
  testOrchestratorInvocation(query: string): Promise<DiagnosticResult>;
  
  // Verify environment variables are set correctly
  checkEnvironmentVariables(): DiagnosticResult;
  
  // Run full diagnostic suite
  runFullDiagnostics(): Promise<DiagnosticResult[]>;
}
```

### 2. Enhanced RenewableProxyAgent

**Purpose**: Add comprehensive logging and error handling to the proxy agent

**Location**: `amplify/functions/agents/renewableProxyAgent.ts`

**Enhancements**:
- Add detailed logging before/after orchestrator invocation
- Implement timeout detection (if response takes > 60s, log warning)
- Add retry logic with exponential backoff
- Validate orchestrator response structure
- Log full request/response payloads for debugging

**Key Methods**:
```typescript
class RenewableProxyAgent {
  // Enhanced with logging and error handling
  async processQuery(message: string, conversationHistory?: any[]): Promise<RouterResponse>;
  
  // NEW: Validate orchestrator is accessible
  private async validateOrchestratorAccess(): Promise<boolean>;
  
  // NEW: Invoke with timeout and retry
  private async invokeOrchestratorWithRetry(payload: any, maxRetries: number): Promise<any>;
  
  // NEW: Validate response structure
  private validateOrchestratorResponse(response: any): boolean;
}
```

### 3. Enhanced Orchestrator Logging

**Purpose**: Add comprehensive logging to the orchestrator to track execution flow

**Location**: `amplify/functions/renewableOrchestrator/handler.ts`

**Enhancements**:
- Log entry point with full request payload
- Log intent detection results
- Log tool Lambda invocation (function name, payload)
- Log tool Lambda response (success, data structure)
- Log final response before returning
- Add execution time tracking for each step
- Log environment variables on startup

### 4. Orchestrator Health Check Endpoint

**Purpose**: Provide a simple way to verify orchestrator is deployed and functioning

**Location**: `amplify/functions/renewableOrchestrator/handler.ts`

**Implementation**:
```typescript
// Add health check handler
if (event.query === '__health_check__') {
  return {
    success: true,
    message: 'Orchestrator is healthy',
    metadata: {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
      region: process.env.AWS_REGION,
      toolsConfigured: {
        terrain: !!process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
        layout: !!process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME,
        simulation: !!process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
        report: !!process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME
      }
    }
  };
}
```

### 5. Frontend Diagnostic Panel

**Purpose**: Allow developers to run diagnostics from the UI

**Location**: `src/components/renewable/OrchestratorDiagnosticPanel.tsx`

**Features**:
- Button to run orchestrator health check
- Display diagnostic results in a table
- Show CloudWatch log links
- Display environment variable status
- Test orchestrator with sample query

## Data Models

### DiagnosticResult
```typescript
interface DiagnosticResult {
  step: string;              // Name of diagnostic step
  success: boolean;          // Whether step passed
  details: any;              // Detailed information
  error?: string;            // Error message if failed
  duration?: number;         // Execution time in ms
  timestamp: number;         // When diagnostic ran
  recommendations?: string[]; // Suggested fixes
}
```

### OrchestratorInvocationLog
```typescript
interface OrchestratorInvocationLog {
  timestamp: number;
  requestId: string;
  query: string;
  orchestratorFunctionName: string;
  invocationSuccess: boolean;
  responseReceived: boolean;
  duration: number;
  error?: string;
  projectId?: string;
  featureCount?: number;
}
```

## Error Handling

### Error Categories

1. **Orchestrator Not Found**
   - Error: `ResourceNotFoundException` or function name is undefined
   - Message: "Renewable energy orchestrator is not deployed"
   - Remediation: "Run: npx ampx sandbox to deploy all Lambda functions"

2. **Orchestrator Timeout**
   - Error: Invocation takes > 60 seconds
   - Message: "Renewable energy analysis timed out"
   - Remediation: "Try again with a smaller analysis area or check Lambda timeout settings"

3. **Permission Denied**
   - Error: `AccessDeniedException`
   - Message: "Permission denied accessing renewable energy backend"
   - Remediation: "Check IAM permissions for Lambda invocation"

4. **Invalid Response**
   - Error: Response missing required fields
   - Message: "Received invalid response from renewable energy backend"
   - Remediation: "Check orchestrator logs for errors"

5. **Tool Lambda Failure**
   - Error: Terrain/layout/simulation Lambda fails
   - Message: "Renewable energy tool execution failed"
   - Remediation: "Check tool Lambda logs and verify Python dependencies"

### Error Response Structure
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    details: string;
    remediationSteps: string[];
    logStreamName?: string;
    requestId?: string;
  };
  artifacts: [];
  thoughtSteps: ThoughtStep[];
}
```

## Testing Strategy

### Unit Tests

1. **RenewableProxyAgent Tests**
   - Test orchestrator invocation with mock Lambda client
   - Test retry logic with simulated failures
   - Test timeout detection
   - Test response validation

2. **Orchestrator Tests**
   - Test intent detection for terrain queries
   - Test project ID generation
   - Test tool Lambda invocation
   - Test error handling for missing tools

3. **Diagnostic Utility Tests**
   - Test environment variable validation
   - Test orchestrator existence check
   - Test health check invocation

### Integration Tests

1. **End-to-End Orchestrator Flow**
   - Send terrain analysis query through full stack
   - Verify orchestrator is invoked
   - Verify terrain Lambda is called with correct parameters
   - Verify response includes unique project ID
   - Verify all 151 features are returned

2. **Error Scenario Tests**
   - Test with orchestrator not deployed
   - Test with invalid permissions
   - Test with timeout scenario
   - Test with malformed responses

### Manual Testing

1. **CloudWatch Log Analysis**
   - Check `/aws/lambda/renewableOrchestrator` logs
   - Check `/aws/lambda/lightweightAgent` logs
   - Verify orchestrator invocation appears in logs
   - Check for error messages or timeouts

2. **Diagnostic Panel Testing**
   - Run health check from UI
   - Verify diagnostic results are accurate
   - Test with orchestrator deployed and not deployed
   - Verify remediation steps are helpful

## Implementation Plan

### Phase 1: Add Diagnostics (High Priority)
1. Create orchestrator diagnostic utility
2. Add health check endpoint to orchestrator
3. Enhance RenewableProxyAgent logging
4. Add orchestrator invocation logging

### Phase 2: Fix Invocation Flow (Critical)
1. Verify environment variables are passed correctly
2. Add retry logic to RenewableProxyAgent
3. Fix any timeout issues in orchestrator
4. Ensure project ID is generated and passed correctly

### Phase 3: Restore Feature Count (High Priority)
1. Verify orchestrator passes correct parameters to terrain Lambda
2. Check terrain Lambda OSM query for artificial limits
3. Ensure full feature set is returned
4. Validate response includes all features

### Phase 4: Fix Loading State (Medium Priority)
1. Ensure orchestrator returns proper completion response
2. Add timeout handling to clear loading state
3. Improve error responses to clear loading state
4. Test loading state with various scenarios

### Phase 5: Add Monitoring (Low Priority)
1. Create frontend diagnostic panel
2. Add CloudWatch log links
3. Implement real-time status monitoring
4. Add performance metrics

## Success Criteria

1. **Orchestrator Invocation**: CloudWatch logs show orchestrator is being invoked for every terrain query
2. **Unique Project IDs**: All terrain analyses return unique project IDs (not "default-project")
3. **Full Feature Count**: Terrain analyses return 151 features (or actual OSM count)
4. **Loading State**: Loading indicator disappears when analysis completes
5. **Error Handling**: Clear error messages with remediation steps when issues occur
6. **Diagnostics**: Diagnostic panel accurately reports orchestrator status

## Rollback Plan

If the fixes cause issues:

1. **Revert RenewableProxyAgent changes**: Restore previous version
2. **Disable enhanced logging**: Remove verbose logging if it causes performance issues
3. **Fallback to mock data**: If orchestrator still fails, use mock data with clear messaging
4. **Document issues**: Create detailed issue report for further investigation

## Performance Considerations

1. **Logging Overhead**: Verbose logging may add 100-200ms to request time
2. **Retry Logic**: Retries may add 2-5 seconds in failure scenarios
3. **Diagnostic Checks**: Health checks should complete in < 1 second
4. **CloudWatch Costs**: Increased logging may increase CloudWatch costs slightly

## Security Considerations

1. **Log Sanitization**: Ensure sensitive data is not logged (API keys, credentials)
2. **IAM Permissions**: Verify orchestrator has minimum required permissions
3. **Error Messages**: Don't expose internal system details in user-facing errors
4. **Diagnostic Access**: Restrict diagnostic panel to authenticated users only
