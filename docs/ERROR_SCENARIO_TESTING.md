# Error Scenario Testing Guide

## Overview

This document describes the comprehensive error scenario testing for the renewable orchestrator flow. These tests validate that all error conditions are handled gracefully with clear, actionable error messages and remediation steps.

## Test Coverage

### 1. Orchestrator Not Deployed

**Scenario**: The renewable orchestrator Lambda function does not exist or has the wrong name configured.

**Simulation Method**:
```javascript
// Set wrong function name
process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME = 'non-existent-function';
```

**Expected Behavior**:
- Error Type: `NotFound`
- Error Message: "Renewable energy orchestrator is not deployed"
- Remediation Steps:
  - "Run: npx ampx sandbox to deploy all Lambda functions"
  - "Verify RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is set"
  - "Check CloudWatch logs for deployment errors"

**Validation**:
```bash
# Automated test
npm test -- renewable-error-scenarios.test.ts -t "Orchestrator Not Deployed"

# Manual test
node scripts/test-error-scenarios.js
```

### 2. Permission Denied

**Scenario**: The calling Lambda lacks IAM permissions to invoke the orchestrator.

**Simulation Method**:
```bash
# Manually remove IAM permission from calling Lambda role
# Remove: lambda:InvokeFunction on orchestrator ARN
```

**Expected Behavior**:
- Error Type: `PermissionDenied`
- Error Message: "Permission denied accessing renewable energy backend"
- Remediation Steps:
  - "Check IAM permissions for Lambda invocation"
  - "Verify the calling Lambda role has lambda:InvokeFunction permission"
  - "Review IAM policy in amplify/backend.ts"

**Validation**:
```bash
# Manual test required
# 1. Remove IAM permission
# 2. Attempt invocation
# 3. Verify error message
# 4. Restore permission
```

### 3. Timeout

**Scenario**: The orchestrator takes longer than 60 seconds to respond.

**Simulation Method**:
```python
# Add to orchestrator handler.py
import time
time.sleep(65)  # Simulate long-running operation
```

**Expected Behavior**:
- Error Type: `Timeout`
- Error Message: "Renewable energy analysis timed out"
- Warning logged at 30 seconds
- Timeout error at 60 seconds
- Remediation Steps:
  - "Try again with a smaller analysis area"
  - "Check Lambda timeout settings (current: 300s)"
  - "Review CloudWatch logs for performance bottlenecks"

**Validation**:
```bash
# Automated test (with mock)
npm test -- renewable-error-scenarios.test.ts -t "Timeout"

# Manual test
# 1. Add delay to orchestrator
# 2. Invoke with terrain query
# 3. Verify warning at 30s
# 4. Verify timeout at 60s
# 5. Remove delay
```

### 4. Invalid Response

**Scenario**: The orchestrator returns a malformed response.

**Test Cases**:

#### 4.1 Missing Required Fields
```json
{
  "data": "some data"
  // Missing: success, message, artifacts
}
```

#### 4.2 Invalid Artifacts Type
```json
{
  "success": true,
  "message": "Complete",
  "artifacts": "not-an-array"  // Should be array
}
```

#### 4.3 Default Project ID
```json
{
  "success": true,
  "message": "Complete",
  "artifacts": [],
  "projectId": "default-project"  // Should be unique
}
```

**Expected Behavior**:
- Error Type: `InvalidResponse`
- Error Message: "Received invalid response from renewable energy backend"
- Remediation Steps:
  - "Check orchestrator logs for errors"
  - "Verify orchestrator is returning proper response structure"
  - "Review CloudWatch logs: /aws/lambda/renewableOrchestrator"

**Validation**:
```bash
# Automated test
npm test -- renewable-error-scenarios.test.ts -t "Invalid Response"
```

### 5. Tool Lambda Failure

**Scenario**: A tool Lambda (terrain, layout, simulation, report) fails during execution.

**Simulation Method**:
```python
# Break terrain Lambda temporarily
# Remove required import or dependency
```

**Expected Behavior**:
- Error Type: `ToolFailure`
- Error Message: "Renewable energy tool execution failed"
- Tool name included in error details
- Remediation Steps:
  - "Check tool Lambda logs and verify Python dependencies"
  - "Verify tool Lambda is deployed: [tool-name]"
  - "Review CloudWatch logs: /aws/lambda/[tool-name]"

**Validation**:
```bash
# Manual test
# 1. Break tool Lambda
# 2. Invoke orchestrator
# 3. Verify error message
# 4. Fix tool Lambda
```

## Error Message Quality Standards

### Clarity Requirements

All error messages must:
1. **Be user-friendly**: Avoid technical jargon where possible
2. **Be specific**: Clearly state what went wrong
3. **Be actionable**: Tell users what they can do next
4. **Include context**: Provide relevant details (function names, request IDs)

### Examples

✅ **Good Error Message**:
```
"Renewable energy orchestrator is not deployed. Run: npx ampx sandbox to deploy all Lambda functions."
```

❌ **Bad Error Message**:
```
"ResourceNotFoundException: Function not found"
```

### Remediation Step Requirements

All remediation steps must:
1. **Be actionable**: Include specific commands or actions
2. **Be ordered**: Most likely solution first
3. **Include examples**: Show exact commands to run
4. **Reference logs**: Include CloudWatch log stream names when available

### Examples

✅ **Good Remediation Steps**:
```javascript
[
  "Run: npx ampx sandbox to deploy all Lambda functions",
  "Verify RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable is set",
  "Check CloudWatch logs: /aws/lambda/renewableOrchestrator"
]
```

❌ **Bad Remediation Steps**:
```javascript
[
  "Fix the deployment",
  "Check the logs"
]
```

## Test Execution

### Automated Tests

Run all automated error scenario tests:
```bash
# All error scenario tests
npm test -- renewable-error-scenarios.test.ts

# Specific test suite
npm test -- renewable-error-scenarios.test.ts -t "Orchestrator Not Deployed"
npm test -- renewable-error-scenarios.test.ts -t "Permission Denied"
npm test -- renewable-error-scenarios.test.ts -t "Timeout"
npm test -- renewable-error-scenarios.test.ts -t "Invalid Response"
npm test -- renewable-error-scenarios.test.ts -t "Tool Lambda Failure"
```

### Manual Tests

Run manual test script:
```bash
node scripts/test-error-scenarios.js
```

This script will:
1. Verify orchestrator deployment status
2. Test orchestrator not deployed scenario
3. Provide instructions for manual permission testing
4. Provide instructions for manual timeout testing
5. Validate error message clarity
6. Validate remediation step accuracy

### Integration Tests

Test error scenarios in deployed environment:
```bash
# Deploy to sandbox
npx ampx sandbox

# Run integration tests
npm test -- tests/integration/renewable-error-scenarios.test.ts
```

## Validation Checklist

Use this checklist to validate error handling:

### Error Detection
- [ ] Orchestrator not deployed detected correctly
- [ ] Permission denied detected correctly
- [ ] Timeout detected at 60 seconds
- [ ] Warning logged at 30 seconds
- [ ] Invalid response structure detected
- [ ] Missing required fields detected
- [ ] Default project ID detected
- [ ] Tool Lambda failures detected

### Error Messages
- [ ] All error messages are user-friendly
- [ ] All error messages are specific
- [ ] All error messages include context
- [ ] No technical jargon in user-facing messages
- [ ] Request IDs included when available

### Remediation Steps
- [ ] All errors have remediation steps
- [ ] Steps are actionable (include commands)
- [ ] Steps are ordered by likelihood
- [ ] CloudWatch log references included
- [ ] Examples provided where applicable

### User Experience
- [ ] Loading state clears on all error types
- [ ] Users can retry after errors
- [ ] No page reload required
- [ ] Error UI is clear and helpful
- [ ] Errors don't crash the application

## Common Issues and Solutions

### Issue: Tests Timing Out

**Cause**: Timeout tests take 60+ seconds to complete

**Solution**: 
```javascript
// Increase Jest timeout
it('should timeout', async () => {
  // test code
}, 70000); // 70 second timeout
```

### Issue: Mock Not Working

**Cause**: AWS SDK client mock not properly reset

**Solution**:
```javascript
beforeEach(() => {
  lambdaMock.reset(); // Reset before each test
});
```

### Issue: Environment Variables Not Set

**Cause**: Tests running without proper environment setup

**Solution**:
```bash
# Set required environment variables
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=your-function-name
export AWS_REGION=us-east-1
```

## Continuous Validation

### Pre-Deployment Checks

Before deploying changes:
```bash
# Run all error scenario tests
npm test -- renewable-error-scenarios.test.ts

# Run manual validation
node scripts/test-error-scenarios.js

# Verify error messages
grep -r "error.*message" amplify/functions/agents/
```

### Post-Deployment Validation

After deploying to sandbox/production:
```bash
# Test with wrong function name
RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=wrong-name node scripts/test-error-scenarios.js

# Test actual timeout (if safe)
# Add delay to orchestrator, test, remove delay

# Verify CloudWatch logs
aws logs tail /aws/lambda/renewableOrchestrator --follow
```

## Success Criteria

Error scenario testing is complete when:

1. ✅ All automated tests pass
2. ✅ All manual tests validated
3. ✅ Error messages are clear and helpful
4. ✅ Remediation steps are accurate and actionable
5. ✅ Loading state clears on all error types
6. ✅ Users can retry after errors
7. ✅ No regressions in existing functionality

## Related Documentation

- [Orchestrator Fix Spec](.kiro/specs/fix-renewable-orchestrator-flow/design.md)
- [Error Categorization](ERROR_CATEGORIZATION_IMPLEMENTATION.md)
- [Response Validation](RESPONSE_VALIDATION_IMPLEMENTATION.md)
- [Timeout Detection](TIMEOUT_DETECTION_IMPLEMENTATION.md)
- [Diagnostic API](DIAGNOSTIC_API_IMPLEMENTATION.md)

## Maintenance

This test suite should be updated when:
- New error types are added
- Error messages are changed
- Remediation steps are updated
- New tool Lambdas are added
- Orchestrator behavior changes

Last Updated: 2025-01-08
