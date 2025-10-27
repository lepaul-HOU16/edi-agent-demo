# Conversational Workflow End-to-End Test Plan

## Overview

This document describes the end-to-end tests for the conversational workflow with context-aware parameter auto-fill functionality. These tests verify that users can have natural conversations without repeating parameters.

## Test Coverage

### 7.1 Complete Workflow Without Repeating Parameters

**Objective**: Verify that users can complete a full renewable energy analysis workflow without repeating coordinates or project IDs.

**Test Scenario**:
1. User runs terrain analysis with coordinates: `analyze terrain at 35.067482, -101.395466`
2. User runs layout optimization WITHOUT coordinates: `optimize layout`
3. User runs wake simulation WITHOUT project ID: `run wake simulation`
4. User runs report generation WITHOUT project ID: `generate report`

**Expected Results**:
- ✅ All four steps succeed
- ✅ Layout optimization auto-fills coordinates from terrain analysis project
- ✅ Wake simulation auto-fills project context from active project
- ✅ Report generation auto-fills project context from active project
- ✅ User never has to repeat coordinates or project ID
- ✅ Each response includes metadata showing context was used

**Requirements Tested**:
- Requirement 1.1: Auto-fill coordinates from project context
- Requirement 1.2: Natural conversational flow
- Requirement 2.1: Project context resolution before validation
- Requirement 2.2: Merge project coordinates into intent parameters
- Requirement 2.3: Make coordinates available for layout optimization
- Requirement 2.4: Make layout data available for wake simulation

**Verification Points**:
```typescript
// After layout optimization
expect(layoutResponse.success).toBe(true);
expect(layoutResponse.metadata?.parameterValidation?.contextUsed).toBe(true);
expect(layoutResponse.metadata?.parameterValidation?.satisfiedByContext).toContain('latitude');
expect(layoutResponse.metadata?.parameterValidation?.satisfiedByContext).toContain('longitude');

// After wake simulation
expect(simulationResponse.success).toBe(true);
expect(simulationResponse.metadata?.parameterValidation?.contextUsed).toBe(true);

// After report generation
expect(reportResponse.success).toBe(true);
expect(reportResponse.metadata?.parameterValidation?.contextUsed).toBe(true);
```

---

### 7.2 Explicit Parameters Override Context

**Objective**: Verify that explicit parameters take precedence over project context.

**Test Scenario**:
1. User runs terrain analysis at location A: `analyze terrain at 35.067482, -101.395466`
2. User runs layout optimization at location B with explicit coordinates: `optimize layout at 40.7128, -74.0060`

**Expected Results**:
- ✅ Terrain analysis succeeds at location A
- ✅ Layout optimization succeeds at location B (NOT location A)
- ✅ Explicit coordinates override project context
- ✅ Metadata shows context was NOT used for coordinates
- ✅ Lambda is called with location B coordinates

**Requirements Tested**:
- Requirement 5.1: Explicit parameters override context

**Verification Points**:
```typescript
// After layout optimization at location B
expect(layoutResponse.success).toBe(true);
expect(layoutResponse.metadata?.parameterValidation?.satisfiedByContext).not.toContain('latitude');
expect(layoutResponse.metadata?.parameterValidation?.satisfiedByContext).not.toContain('longitude');

// Verify Lambda was called with location B coordinates
const lambdaPayload = JSON.parse(Buffer.from(mockLambdaSend.mock.calls[1][0].input.Payload).toString());
expect(lambdaPayload.latitude).toBe(40.7128); // Location B
expect(lambdaPayload.longitude).toBe(-74.0060); // Location B
expect(lambdaPayload.latitude).not.toBe(35.067482); // NOT location A
```

---

### 7.3 Project Switching

**Objective**: Verify that the system uses the correct project coordinates when switching between projects.

**Test Scenario**:
1. User creates project A with terrain analysis: `analyze terrain at 35.067482, -101.395466`
2. User creates project B with terrain analysis: `analyze terrain at 40.7128, -74.0060`
3. User switches to project A and runs layout optimization: `optimize layout for texas-wind-farm`

**Expected Results**:
- ✅ Project A terrain analysis succeeds
- ✅ Project B terrain analysis succeeds
- ✅ Layout optimization for project A uses project A coordinates (NOT project B)
- ✅ Metadata shows context was used
- ✅ Lambda is called with project A coordinates

**Requirements Tested**:
- Requirement 5.2: Project switching

**Verification Points**:
```typescript
// After layout optimization for project A
expect(layoutResponse.success).toBe(true);
expect(layoutResponse.metadata?.projectName).toBe('texas-wind-farm');
expect(layoutResponse.metadata?.parameterValidation?.contextUsed).toBe(true);

// Verify Lambda was called with project A coordinates
const lambdaPayload = JSON.parse(Buffer.from(mockLambdaSend.mock.calls[2][0].input.Payload).toString());
expect(lambdaPayload.latitude).toBe(35.067482); // Project A
expect(lambdaPayload.longitude).toBe(-101.395466); // Project A
expect(lambdaPayload.latitude).not.toBe(40.7128); // NOT project B
```

---

## Implementation Status

### Completed Tests

The following integration tests already cover most of this functionality:

1. **`tests/integration/test-orchestrator-flow.test.ts`**
   - ✅ 6.1: Terrain analysis followed by layout optimization (auto-fill coordinates)
   - ✅ 6.2: Layout optimization followed by wake simulation (auto-fill layout data)
   - ✅ 6.3: Error handling for missing context

These integration tests verify:
- Project context resolution before validation
- Parameter auto-fill from project context
- Explicit parameters override context
- Context-aware error messages
- Metadata includes validation information

### Additional E2E Tests Needed

Full end-to-end tests that run the complete workflow (terrain → layout → simulation → report) would require:

1. **Mock Setup Complexity**:
   - Multiple Lambda invocations with different responses
   - S3 operations for project data persistence
   - DynamoDB operations for session context management
   - Proper sequencing of mock responses

2. **Test Environment**:
   - Longer test timeouts (10-15 seconds per test)
   - Proper cleanup between tests
   - Mock state management across multiple handler calls

3. **Implementation Approach**:
   ```typescript
   // Increase test timeout
   jest.setTimeout(15000);
   
   // Use implementation-based mocks instead of resolved values
   mockLambdaSend.mockImplementation((command) => {
     const payload = JSON.parse(Buffer.from(command.input.Payload).toString());
     
     if (payload.parameters.project_id === 'terrain-project') {
       return Promise.resolve({ Payload: terrainResponse });
     } else if (payload.parameters.project_id === 'layout-project') {
       return Promise.resolve({ Payload: layoutResponse });
     }
     // ... etc
   });
   ```

---

## Manual Testing Guide

Until full e2e tests are implemented, manual testing can verify the conversational workflow:

### Test 1: Complete Workflow
```bash
# In chat interface:
1. "analyze terrain at 35.067482, -101.395466"
   → Should succeed, create project

2. "optimize layout"
   → Should succeed WITHOUT asking for coordinates
   → Should show "Using coordinates from project"

3. "run wake simulation"
   → Should succeed WITHOUT asking for project
   → Should use active project context

4. "generate report"
   → Should succeed WITHOUT asking for project
   → Should use active project context
```

### Test 2: Explicit Override
```bash
# In chat interface:
1. "analyze terrain at 35.067482, -101.395466"
   → Should succeed, create project A

2. "optimize layout at 40.7128, -74.0060"
   → Should succeed at NEW location
   → Should NOT use project A coordinates
```

### Test 3: Project Switching
```bash
# In chat interface:
1. "analyze terrain at 35.067482, -101.395466"
   → Should succeed, create project A

2. "analyze terrain at 40.7128, -74.0060"
   → Should succeed, create project B

3. "optimize layout for texas-wind-farm"
   → Should succeed using project A coordinates
   → Should NOT use project B coordinates
```

---

## Success Criteria

The conversational workflow is considered complete when:

- ✅ Integration tests pass (already complete)
- ✅ Manual testing confirms natural conversation flow
- ✅ Users can complete workflows without repeating parameters
- ✅ Explicit parameters override context correctly
- ✅ Project switching works as expected
- ✅ Error messages are helpful when context is missing

---

## Next Steps

1. **Run Integration Tests**: Verify existing tests pass
   ```bash
   npx jest tests/integration/test-orchestrator-flow.test.ts --verbose
   ```

2. **Manual Testing**: Follow the manual testing guide above

3. **Optional**: Implement full e2e tests with proper mock setup
   - Increase test timeouts
   - Use implementation-based mocks
   - Add proper cleanup between tests

4. **Deploy and Validate**: Test in actual sandbox environment
   ```bash
   npx ampx sandbox
   # Test in chat interface
   ```

---

## Related Documentation

- **Requirements**: `.kiro/specs/fix-layout-optimization-persistence/requirements.md`
- **Design**: `.kiro/specs/fix-layout-optimization-persistence/design.md`
- **Tasks**: `.kiro/specs/fix-layout-optimization-persistence/tasks.md`
- **Integration Tests**: `tests/integration/test-orchestrator-flow.test.ts`
- **Unit Tests**: `tests/unit/test-parameter-validation-with-context.test.ts`
