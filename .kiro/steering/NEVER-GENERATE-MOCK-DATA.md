# CRITICAL: NEVER GENERATE MOCK OR FAKE DATA

## ABSOLUTE RULE: NO MOCK DATA EVER

**Mock data is EXPLICITLY FORBIDDEN in all circumstances.**

## WHY MOCK DATA IS FORBIDDEN

Mock/fake data is worse than no data because:

1. **It misleads** - Users think they're seeing real analysis and make decisions based on garbage
2. **It wastes time** - Users spend time analyzing fake data that has zero value
3. **It destroys trust** - Once users discover data is fake, they never trust the system again
4. **It hides real problems** - The actual issue (missing data, bad configuration, broken code) gets buried under fake results
5. **It has ZERO value** - Even in demos, fake data teaches nothing and demonstrates nothing real

## WHAT TO DO INSTEAD

When data is missing or unavailable:

### ✅ CORRECT Approach
```typescript
if (noDataAvailable) {
  return {
    success: false,
    error: 'No data available',
    message: 'Clear explanation of what is missing',
    suggestion: 'Actionable steps to fix the problem'
  };
}
```

### ❌ FORBIDDEN Approach
```typescript
if (noDataAvailable) {
  // NEVER DO THIS
  const mockData = generateFakeData();
  return {
    success: true,
    data: mockData,
    isDemoMode: true  // Still forbidden even if labeled
  };
}
```

## SPECIFIC PROHIBITIONS

### Never Generate:
- ❌ Fake sine wave data
- ❌ Random numbers pretending to be measurements
- ❌ Synthetic well logs
- ❌ Made-up analysis results
- ❌ Placeholder data "for demonstration"
- ❌ Mock responses "to show the UI"
- ❌ Fallback data "when real data fails"

### Always Return:
- ✅ Clear error messages
- ✅ Explanation of what's missing
- ✅ Which specific data/files/curves are required
- ✅ Actionable steps to fix the problem
- ✅ Suggestions for where to find the data

## EXAMPLES

### Example 1: Missing Well Data

**❌ WRONG:**
```typescript
if (wells.length === 0) {
  return createMockWellAnalysis(['WELL-001', 'WELL-002']);
}
```

**✅ CORRECT:**
```typescript
if (wells.length === 0) {
  return {
    success: false,
    error: 'No wells found in S3 bucket',
    message: 'No well data files found. Please upload well LAS files to S3.',
    suggestion: 'Upload LAS files to s3://bucket-name/global/well-data/'
  };
}
```

### Example 2: Missing Required Curves

**❌ WRONG:**
```typescript
if (!hasDEPT || !hasRHOB || !hasNPHI) {
  return generateSyntheticCurves();
}
```

**✅ CORRECT:**
```typescript
if (!hasDEPT || !hasRHOB || !hasNPHI) {
  const missing = [];
  if (!hasDEPT) missing.push('DEPT (depth)');
  if (!hasRHOB) missing.push('RHOB (bulk density)');
  if (!hasNPHI) missing.push('NPHI (neutron porosity)');
  
  return {
    success: false,
    error: `Missing required curves: ${missing.join(', ')}`,
    message: `Well ${wellName} is missing required curves for porosity analysis`,
    availableCurves: Object.keys(curves),
    suggestion: 'Ensure LAS file contains DEPT, RHOB, and NPHI curves'
  };
}
```

### Example 3: All Wells Failed Analysis

**❌ WRONG:**
```typescript
if (successfulWells.length === 0) {
  console.log('Creating mock data for demonstration');
  return createMockAnalysis(attemptedWells);
}
```

**✅ CORRECT:**
```typescript
if (successfulWells.length === 0) {
  return {
    success: false,
    error: 'All wells failed analysis',
    message: `Failed to analyze ${failedWells.length} wells: ${failedWells.join(', ')}`,
    failedWells: failedWells.map(w => ({
      wellName: w.name,
      reason: w.failureReason,
      missingCurves: w.missingCurves
    })),
    suggestion: 'Check CloudWatch logs for detailed errors. Verify wells have required curves with valid data.'
  };
}
```

## ERROR MESSAGE REQUIREMENTS

Every error message MUST include:

1. **Clear statement of the problem** - What failed and why
2. **Specific details** - Which wells, which curves, which files
3. **Actionable suggestion** - Concrete steps to fix the issue
4. **Context** - What was attempted, what was expected

## DEMO SCENARIOS

Even in demos or examples:
- ❌ Do NOT generate fake data
- ✅ Use real sample data files
- ✅ Document where to get real data
- ✅ Show error handling when data is missing

## CONSEQUENCES OF VIOLATION

Generating mock data:
- Wastes user time analyzing garbage
- Destroys trust in the system
- Hides real bugs and configuration issues
- Provides zero value to anyone
- Makes debugging impossible

## REMEMBER

**Real data or clear error. Nothing else. Ever.**

If you find yourself thinking "I'll just generate some fake data to show how it works" - STOP. Return a clear error instead.
