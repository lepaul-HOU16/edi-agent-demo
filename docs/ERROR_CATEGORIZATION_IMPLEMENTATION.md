# Error Categorization Implementation

## Overview

Implemented a comprehensive error categorization system for the renewable energy orchestrator flow. The system maps Lambda errors to specific error types with appropriate user-friendly messages and detailed remediation steps.

## Implementation Date

January 8, 2025

## Components Implemented

### 1. Error Categorization Module (`errorCategorization.ts`)

**Location**: `amplify/functions/agents/errorCategorization.ts`

**Features**:
- Error type enumeration with 6 categories
- Automatic error classification based on error name and message
- Category-specific error messages
- Detailed remediation steps for each error type
- Logging and user-friendly formatting utilities

**Error Categories**:

1. **NotFound** - Lambda function not deployed or not found
2. **Timeout** - Analysis exceeded timeout threshold
3. **PermissionDenied** - IAM permission issues
4. **InvalidResponse** - Malformed or incomplete response from backend
5. **ToolFailure** - Tool Lambda execution failures (terrain, layout, simulation, report)
6. **Unknown** - Unrecognized or generic errors

### 2. Integration with RenewableProxyAgent

**Changes**:
- Imported `ErrorCategorizer` and `RenewableErrorType`
- Updated `handleError()` method to use error categorization
- Enhanced error logging with categorized error details
- Improved user-facing error messages with remediation steps

**Benefits**:
- Consistent error handling across all renewable energy operations
- Clear, actionable error messages for users
- Detailed logging for debugging
- Specific remediation steps for each error type

## Error Type Details

### NotFound Errors

**Triggers**:
- `ResourceNotFoundException`
- Messages containing "does not exist", "not found", "Function not found"

**Remediation Steps**:
1. Deploy the renewable energy backend using: `npx ampx sandbox`
2. Verify all Lambda functions are deployed in AWS Console
3. Check that the function name is correct in configuration
4. Ensure environment variables are set correctly
5. Review CloudWatch logs for deployment errors

### Timeout Errors

**Triggers**:
- `TimeoutError`
- Messages containing "timed out", "timeout after", "Task timed out", "Lambda timeout"

**Remediation Steps**:
1. Try again with a smaller analysis area (reduce radius parameter)
2. Check Lambda timeout settings in AWS Console (increase if needed)
3. Review CloudWatch logs for the orchestrator and tool Lambda functions
4. Verify the Lambda functions are not experiencing cold starts
5. Consider optimizing the analysis parameters
6. Contact support with request ID if issue persists

### PermissionDenied Errors

**Triggers**:
- `AccessDeniedException`, `UnauthorizedException`, `ForbiddenException`
- Messages containing "Permission denied", "Access denied", "not authorized"

**Remediation Steps**:
1. Add IAM permissions for `lambda:InvokeFunction` to the agent execution role
2. Add IAM permissions for `lambda:GetFunction` to the agent execution role
3. Verify the Lambda function ARN in the IAM policy is correct
4. Check that the execution role has the correct trust relationship
5. Review IAM policies in AWS Console
6. Example policy provided in error message

### InvalidResponse Errors

**Triggers**:
- `ValidationException`, `InvalidParameterException`
- Messages containing "Invalid response", "Missing required fields", "Invalid artifact", "Invalid project ID"

**Remediation Steps**:
1. Check CloudWatch logs for the orchestrator Lambda function
2. Verify the orchestrator is returning the correct response structure
3. Ensure all required fields are present: success, message, artifacts
4. Verify project ID generation is working correctly
5. Check that artifacts have required fields: type, data
6. Review the orchestrator code for response formatting issues
7. Redeploy the orchestrator if needed: `npx ampx sandbox`

### ToolFailure Errors

**Triggers**:
- Messages containing "Tool execution failed", "terrain Lambda", "layout Lambda", "simulation Lambda", "report Lambda"
- Python errors: "ModuleNotFoundError", "ImportError", "Python error"

**Remediation Steps**:
1. Check CloudWatch logs for the specific tool Lambda function
2. Verify the tool Lambda is deployed correctly
3. Ensure the orchestrator is passing correct parameters to the tool
4. For Python errors:
   - Verify Python dependencies are installed in the Lambda layer
   - Check that the Lambda layer is attached to the function
   - Review requirements.txt for missing dependencies
   - Rebuild and redeploy the Lambda layer if needed
5. For other errors:
   - Verify environment variables are set correctly
   - Check that the tool has access to required AWS services (S3, etc.)
   - Review the tool code for runtime errors
6. Redeploy all functions if needed: `npx ampx sandbox`

### Unknown Errors

**Triggers**:
- Any error that doesn't match other categories
- Null or undefined errors
- Errors without standard properties

**Remediation Steps**:
1. Check CloudWatch logs for detailed error information
2. Verify all Lambda functions are deployed and healthy
3. Check AWS service status for any outages
4. Review network connectivity and AWS credentials
5. Try the operation again in a few moments
6. Contact support with request ID and error details if issue persists

## Testing

### Test Coverage

**File**: `amplify/functions/agents/__tests__/errorCategorization.test.ts`

**Test Suites**: 42 tests covering:
- NotFound error categorization (4 tests)
- Timeout error categorization (4 tests)
- PermissionDenied error categorization (4 tests)
- InvalidResponse error categorization (5 tests)
- ToolFailure error categorization (8 tests)
- Unknown error categorization (4 tests)
- Error formatting (5 tests)
- Edge cases (5 tests)
- Multiple error type detection (3 tests)

**Test Results**: ✅ All 42 tests passing

### Key Test Scenarios

1. **Error Type Detection**: Verifies correct categorization for each error type
2. **Remediation Steps**: Validates appropriate remediation steps are provided
3. **Error Message Extraction**: Tests extraction of function names, durations, etc.
4. **Tool Identification**: Verifies correct tool identification (terrain, layout, simulation, report)
5. **Python Error Handling**: Tests Python-specific error detection and remediation
6. **Edge Cases**: Handles null, undefined, and malformed errors gracefully
7. **Priority**: Tests error type priority when multiple patterns match
8. **Formatting**: Validates logging and user-friendly formatting

## Usage Example

```typescript
import { ErrorCategorizer } from './errorCategorization';

try {
  // Some operation that might fail
  await invokeOrchestrator(payload);
} catch (error) {
  // Categorize the error
  const categorized = ErrorCategorizer.categorizeError(error, requestId);
  
  // Log categorized error
  console.error('Error occurred:', ErrorCategorizer.formatForLogging(categorized));
  
  // Return user-friendly message
  return {
    success: false,
    message: ErrorCategorizer.formatForUser(categorized),
  };
}
```

## Benefits

### For Users
- Clear, actionable error messages
- Specific remediation steps for each error type
- Request ID for support correlation
- No technical jargon in user-facing messages

### For Developers
- Consistent error handling across the codebase
- Detailed logging for debugging
- Easy to extend with new error types
- Comprehensive test coverage

### For Operations
- Faster troubleshooting with categorized errors
- Clear remediation steps reduce support burden
- CloudWatch logs include error categories for filtering
- Request ID correlation for tracking issues

## Integration Points

### RenewableProxyAgent
- `handleError()` method uses error categorization
- All errors are categorized before returning to user
- Logging includes error type and remediation steps

### Future Integration Opportunities
- Orchestrator error handling
- Tool Lambda error responses
- Frontend error display
- Monitoring and alerting based on error types

## Monitoring and Metrics

### Recommended CloudWatch Insights Queries

**Error Type Distribution**:
```
fields @timestamp, errorType, message
| filter errorType like /NotFound|Timeout|PermissionDenied|InvalidResponse|ToolFailure/
| stats count() by errorType
```

**Timeout Analysis**:
```
fields @timestamp, requestId, duration, errorType
| filter errorType = "Timeout"
| sort @timestamp desc
```

**Tool Failure Analysis**:
```
fields @timestamp, requestId, details, errorType
| filter errorType = "ToolFailure"
| parse details /(?<tool>terrain|layout|simulation|report)/
| stats count() by tool
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **7.1**: Orchestrator fails to respond → Clear error message with categorization
- **7.2**: Orchestrator times out → Timeout-specific guidance with remediation
- **7.3**: Lambda functions not deployed → Indicates which components are missing
- **7.4**: Permission errors → IAM-related troubleshooting steps
- **7.5**: Errors occur → Loading state cleared, user can retry with clear guidance

## Next Steps

1. ✅ Task 10: Implement error categorization - **COMPLETE**
2. ✅ Task 10.1: Write unit tests for error categorization - **COMPLETE**
3. ⏭️ Task 11: Create diagnostic utility
4. ⏭️ Task 12: Add diagnostic API endpoint
5. ⏭️ Task 13: Create frontend diagnostic panel

## Files Modified

1. **Created**: `amplify/functions/agents/errorCategorization.ts` (400+ lines)
2. **Created**: `amplify/functions/agents/__tests__/errorCategorization.test.ts` (500+ lines)
3. **Modified**: `amplify/functions/agents/renewableProxyAgent.ts` (added import and updated handleError method)
4. **Created**: `docs/ERROR_CATEGORIZATION_IMPLEMENTATION.md` (this file)

## Conclusion

The error categorization system provides a robust, maintainable approach to error handling in the renewable energy orchestrator flow. It improves user experience with clear error messages, reduces support burden with specific remediation steps, and enhances debugging with detailed categorized logging.

All tests are passing, and the implementation is ready for integration with the diagnostic utility (Task 11) and frontend diagnostic panel (Task 13).
