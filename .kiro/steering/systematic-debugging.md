# Systematic Debugging Protocol

## Problem Statement

The current debugging approach is:
- **Reactive**: Fixing symptoms without understanding root causes
- **Incomplete**: Missing the big picture while focusing on local issues
- **Assumptive**: Assuming fixes work without verification
- **Shallow**: Not testing deeply enough to catch real issues

This document establishes a SYSTEMATIC approach to debugging that addresses root causes and prevents regressions.

## The Debugging Pyramid

```
                    ┌─────────────────┐
                    │  User Symptom   │  ← What user reports
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  UI Behavior    │  ← What's visible in browser
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  State/Data     │  ← What's in application state
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API/Backend    │  ← What backend returns
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Root Cause     │  ← Actual problem
                    └─────────────────┘
```

**CRITICAL RULE**: Always debug from TOP to BOTTOM. Understand each layer before moving deeper.

## Systematic Debugging Process

### Phase 1: Symptom Analysis

#### 1.1 Document the Symptom
```
What is the user experiencing?
- Specific behavior observed
- Expected behavior
- Steps to reproduce
- Frequency (always, sometimes, specific conditions)
- Environment (browser, deployment, etc.)
```

#### 1.2 Reproduce the Issue
```
□ Can I reproduce it locally?
□ Can I reproduce it in deployed environment?
□ What are the EXACT steps to reproduce?
□ Does it happen every time?
□ What conditions are required?
```

**RULE**: Do NOT proceed until you can reliably reproduce the issue.

### Phase 2: UI Layer Investigation

#### 2.1 Browser Console Analysis
```
□ Check for JavaScript errors
□ Check for network errors
□ Check for warning messages
□ Check for failed API calls
□ Check for timing issues
```

#### 2.2 React DevTools Analysis
```
□ Check component state
□ Check component props
□ Check component lifecycle
□ Check re-render patterns
□ Check context values
```

#### 2.3 Network Tab Analysis
```
□ Check API requests sent
□ Check API responses received
□ Check request timing
□ Check request payloads
□ Check response payloads
```

### Phase 3: State Layer Investigation

#### 3.1 Application State
```
□ What state is expected?
□ What state is actual?
□ When does state change?
□ What triggers state changes?
□ Are state updates synchronous or async?
```

#### 3.2 State Flow Tracing
```
□ Trace state from initial value
□ Track all state mutations
□ Identify where state diverges from expected
□ Check for race conditions
□ Check for stale closures
```

### Phase 4: API/Backend Layer Investigation

#### 4.1 API Request Analysis
```
□ Is request sent correctly?
□ Are parameters correct?
□ Is authentication working?
□ Is request reaching backend?
□ What does backend receive?
```

#### 4.2 API Response Analysis
```
□ What does backend return?
□ Is response structure correct?
□ Is response data correct?
□ Are error codes correct?
□ Is timing acceptable?
```

#### 4.3 CloudWatch Logs Analysis
```
□ Check Lambda execution logs
□ Check for errors in logs
□ Check for timeouts
□ Check for parameter issues
□ Check for data processing issues
```

### Phase 5: Root Cause Identification

#### 5.1 Root Cause Analysis
```
Ask "Why?" five times:
1. Why does the symptom occur?
2. Why does that happen?
3. Why does that happen?
4. Why does that happen?
5. Why does that happen? ← Root cause
```

#### 5.2 Validate Root Cause
```
□ Can I explain the entire chain of causation?
□ Does this explain ALL symptoms?
□ Can I predict behavior based on this understanding?
□ Have I verified this with testing?
```

**RULE**: Do NOT implement a fix until root cause is identified and validated.

## Specific Issue Debugging Protocols

### Terrain Map Feature Count Issue (60 vs 151)

#### Investigation Checklist
```
□ Check raw data from backend
  - How many features in API response?
  - Log the actual response data
  
□ Check data transformation
  - How many features after parsing?
  - Are features being filtered out?
  - Log data at each transformation step
  
□ Check filtering logic
  - What filters are applied?
  - Are filters too restrictive?
  - Log filter criteria and results
  
□ Check rendering logic
  - How many features passed to map?
  - Are features being deduplicated?
  - Log features before rendering
  
□ Check map library behavior
  - Is map library filtering features?
  - Are features outside viewport hidden?
  - Check map library configuration
```

#### Root Cause Validation
```
□ Can I trace EXACTLY where 151 becomes 60?
□ Have I logged data at EVERY step?
□ Have I verified the count at EACH layer?
□ Do I understand WHY features are being removed?
```

### Loading State Issue (Analyzing popup not dismissing)

#### Investigation Checklist
```
□ Check loading state initialization
  - When is loading state set to true?
  - Log when loading starts
  
□ Check API call lifecycle
  - Is API call completing?
  - Is response received?
  - Is response processed?
  - Log API call start and end
  
□ Check state update logic
  - When should loading state be set to false?
  - Is state update being called?
  - Is state update being executed?
  - Log all state updates
  
□ Check error handling
  - What happens on error?
  - Is loading state cleared on error?
  - Are errors being caught?
  - Log error paths
  
□ Check race conditions
  - Are multiple requests in flight?
  - Are state updates conflicting?
  - Is there a timing issue?
  - Log request/response timing
  
□ Check component lifecycle
  - Is component unmounting?
  - Are effects cleaning up?
  - Are there stale closures?
  - Log component lifecycle events
```

#### Root Cause Validation
```
□ Can I explain EXACTLY why loading state doesn't clear?
□ Have I traced the COMPLETE request/response cycle?
□ Have I verified state updates are executed?
□ Have I tested ALL code paths (success, error, timeout)?
```

## Testing Protocol After Fix

### Level 1: Unit Testing
```
□ Test the specific function/component fixed
□ Test with valid inputs
□ Test with invalid inputs
□ Test edge cases
□ Test error conditions
```

### Level 2: Integration Testing
```
□ Test interaction with dependent components
□ Test complete data flow
□ Test state management
□ Test API integration
```

### Level 3: Regression Testing
```
□ Test ALL related features
□ Test ALL user workflows
□ Verify no existing functionality broken
□ Check for cascade failures
```

### Level 4: End-to-End Testing
```
□ Test complete user workflow in browser
□ Test loading states
□ Test error states
□ Test success states
□ Verify no reload required
□ Verify correct data displayed
```

### Level 5: Deployment Testing
```
□ Deploy to environment
□ Test in deployed environment
□ Check CloudWatch logs
□ Verify no deployment-specific issues
□ Test with real data
```

## Logging Strategy

### What to Log

```typescript
// At entry points
console.log('[ComponentName] Mounted with props:', props);

// At state changes
console.log('[ComponentName] State updated:', { before, after });

// At API calls
console.log('[ComponentName] API call starting:', { endpoint, params });
console.log('[ComponentName] API call completed:', { response, duration });

// At data transformations
console.log('[ComponentName] Data transformed:', { input, output, count });

// At decision points
console.log('[ComponentName] Condition evaluated:', { condition, result });

// At error points
console.error('[ComponentName] Error occurred:', { error, context });
```

### Logging Best Practices

```
✅ Log at EVERY significant step
✅ Include context in every log
✅ Use consistent prefixes
✅ Log data counts and structures
✅ Log timing information
✅ Keep logs during debugging

❌ Don't assume you know what's happening
❌ Don't skip logging "obvious" steps
❌ Don't remove logs until issue is resolved
❌ Don't log sensitive data
```

## Common Debugging Mistakes

### ❌ Mistake 1: Fixing Without Understanding
```
Problem: "I'll just try this fix and see if it works"
Result: May fix symptom but not root cause
Solution: Always identify root cause first
```

### ❌ Mistake 2: Incomplete Testing
```
Problem: "It works in this one case"
Result: Breaks in other cases
Solution: Test ALL cases, not just happy path
```

### ❌ Mistake 3: Local-Only Testing
```
Problem: "It works on my machine"
Result: Fails in deployed environment
Solution: Always test in deployed environment
```

### ❌ Mistake 4: Assuming State
```
Problem: "The state should be X"
Result: State is actually Y
Solution: Always LOG and VERIFY state
```

### ❌ Mistake 5: Ignoring Timing
```
Problem: "The code is correct"
Result: Race condition or timing issue
Solution: Consider async behavior and timing
```

## Success Criteria

A bug is ONLY fixed when:

```
✅ Root cause identified and validated
✅ Fix addresses root cause, not symptom
✅ Fix tested at all levels (unit, integration, e2e)
✅ No regressions introduced
✅ Deployed and tested in production environment
✅ CloudWatch logs show no errors
✅ User workflow works end-to-end
✅ No reload or workarounds required
✅ Issue cannot be reproduced
✅ User has validated the fix
```

## Remember

- **Symptoms are not root causes**
- **Assumptions are not facts**
- **Local testing is not enough**
- **One test case is not enough**
- **"Should work" is not "does work"**

**DEBUG SYSTEMATICALLY. TEST THOROUGHLY. VERIFY COMPLETELY.**
