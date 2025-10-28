# Timeout Fixes for Renewable Lambdas

## Problem

Financial analysis and report generation were timing out because Lambda timeouts were too short.

## Current Timeouts (BEFORE FIX)

```
Terrain:      60s timeout,  1024MB ✅ OK
Layout:       60s timeout,  1024MB ✅ OK  
Simulation:  300s timeout,  3008MB ✅ OK
Report:       30s timeout,   512MB ❌ TOO SHORT
Orchestrator: 90s timeout,   512MB ❌ TOO SHORT
```

## Issues

1. **Report Lambda: 30s timeout**
   - Financial analysis requires complex calculations
   - Report generation needs time to compile data
   - 30 seconds is nowhere near enough
   - **Result**: "Execution timed out" error

2. **Orchestrator: 90s timeout**
   - Orchestrator invokes report Lambda synchronously
   - If report takes 5 minutes, orchestrator needs to wait
   - 90 seconds means it times out before report finishes
   - **Result**: "Execution timed out" error

## Fixes Applied

### 1. Report Lambda Timeout
**File**: `amplify/functions/renewableTools/report/resource.ts`

```typescript
// BEFORE
timeout: Duration.seconds(30),
memorySize: 512,

// AFTER
timeout: Duration.seconds(300), // 5 minutes
memorySize: 1024, // Increased for report generation
```

### 2. Orchestrator Timeout
**File**: `amplify/functions/renewableOrchestrator/resource.ts`

```typescript
// BEFORE
timeoutSeconds: 90,

// AFTER
timeoutSeconds: 300, // 5 minutes - needs to wait for report Lambda
```

## New Timeouts (AFTER FIX)

```
Terrain:      60s timeout,  1024MB ✅ OK
Layout:       60s timeout,  1024MB ✅ OK  
Simulation:  300s timeout,  3008MB ✅ OK
Report:      300s timeout,  1024MB ✅ FIXED
Orchestrator:300s timeout,   512MB ✅ FIXED
```

## Deployment Required

```bash
npx ampx sandbox
```

Wait for deployment to complete, then test:
1. "Perform financial analysis and ROI calculation"
2. "Generate comprehensive executive report"

Both should now work without timing out.

## Files Changed

1. `amplify/functions/renewableTools/report/resource.ts`
   - Increased timeout from 30s to 300s
   - Increased memory from 512MB to 1024MB

2. `amplify/functions/renewableOrchestrator/resource.ts`
   - Increased timeout from 90s to 300s

3. `amplify/functions/renewableOrchestrator/handler.ts`
   - Removed all mock data fallbacks (separate fix)

## Testing After Deployment

1. **Financial Analysis**: "Perform financial analysis and ROI calculation"
   - Should complete without timeout
   - Should show REAL error if report Lambda has issues
   - Should NOT show mock data

2. **Report Generation**: "Generate comprehensive executive report"
   - Should complete without timeout
   - Should show REAL error if implementation missing
   - Should NOT show "Mock data not available"

## Why These Timeouts

- **5 minutes (300s)** is standard for complex operations:
  - Financial calculations with multiple scenarios
  - Report compilation from multiple data sources
  - PDF generation (if implemented)
  - Data aggregation across project lifecycle

- **Orchestrator needs same timeout** as longest tool Lambda:
  - Synchronous invocation means orchestrator waits
  - If report takes 5 min, orchestrator needs 5 min
  - Plus buffer for network/processing overhead
