# NO SIMPLIFICATION RULE - ABSOLUTE PROHIBITION

## Core Principle: NEVER Create "Simplified" or "Lightweight" Versions

**This is a MANDATORY rule that must NEVER be violated.**

## The Problem

In the past, when faced with complex functionality that was difficult to implement or test, simplified/lightweight versions were created that:

1. **Did absolutely nothing** - Just returned mock data
2. **Claimed success** - Logged "success" messages while doing no actual work
3. **Broke functionality** - Replaced working complex code with non-functional stubs
4. **Wasted time** - Required complete rewrites when the simplification was discovered
5. **Destroyed trust** - Made it impossible to know what actually works

## Examples of PROHIBITED Patterns

### ❌ NEVER Do This:

```typescript
// ❌ Creating a "lightweight" version that does nothing
export const lightweightAgent = defineFunction({
  name: 'lightweightAgent',
  // ... just returns mock data
});

// ❌ Creating a "simple" handler that skips actual work
export function simpleHandler(event) {
  console.log('✅ Success!'); // Lying about success
  return { success: true, data: mockData }; // Returning fake data
}

// ❌ Creating a "basic" version without key features
export function basicTerrainAnalysis() {
  // Skips OSM integration, wind data, real calculations
  return { features: 60 }; // Should be 151
}
```

### ✅ ALWAYS Do This:

```typescript
// ✅ Use the FULL complex implementation
export const enhancedStrandsAgent = defineFunction({
  name: 'enhancedStrandsAgent',
  // ... full implementation with all features
});

// ✅ Implement ALL functionality
export async function terrainAnalysisHandler(event) {
  // Real OSM integration
  const osmData = await fetchOSMData(coordinates);
  
  // Real wind data
  const windData = await fetchWindData(coordinates);
  
  // Real calculations
  const analysis = await performFullAnalysis(osmData, windData);
  
  return analysis; // Real results
}
```

## Prohibited Terms in Code

These terms are RED FLAGS and should trigger immediate review:

- ❌ `lightweight`
- ❌ `simple`
- ❌ `basic`
- ❌ `minimal`
- ❌ `stub`
- ❌ `mock` (except in test files)
- ❌ `placeholder`
- ❌ `temporary`
- ❌ `quick`
- ❌ `interim`

## When Complexity is Required

If implementation is complex, that's because the PROBLEM is complex. The solution must match the complexity of the problem.

### Valid Approaches:

1. **Incremental Implementation**
   - Implement feature A completely
   - Test feature A thoroughly
   - Then implement feature B completely
   - NOT: Implement A partially, B partially, C partially

2. **Modular Design**
   - Break complex system into well-defined modules
   - Each module implements its full functionality
   - NOT: Create simplified versions of modules

3. **Progressive Enhancement**
   - Start with core functionality working completely
   - Add additional features on top
   - NOT: Start with fake data, "plan" to add real data later

## Testing Requirements

Tests must verify ACTUAL functionality, not simplified versions:

```typescript
// ❌ WRONG - Testing simplified version
test('lightweight agent returns success', () => {
  const result = lightweightAgent.process(query);
  expect(result.success).toBe(true); // Meaningless test
});

// ✅ RIGHT - Testing actual functionality
test('terrain analysis returns real OSM features', async () => {
  const result = await terrainAnalysis.process({
    latitude: 40.7128,
    longitude: -74.0060,
    radius_km: 5
  });
  
  // Verify REAL data
  expect(result.features.length).toBeGreaterThan(100);
  expect(result.features[0]).toHaveProperty('geometry');
  expect(result.features[0]).toHaveProperty('properties');
  
  // Verify REAL calculations
  expect(result.windData).toBeDefined();
  expect(result.suitabilityScore).toBeGreaterThan(0);
});
```

## Deployment Requirements

Deploy the FULL system, not simplified versions:

```bash
# ❌ WRONG
npx ampx sandbox --deploy-lightweight-only

# ✅ RIGHT
npx ampx sandbox  # Deploy everything
```

## Code Review Checklist

Before committing ANY code, verify:

- [ ] No function names contain "lightweight", "simple", "basic", etc.
- [ ] No mock data in production code (only in tests)
- [ ] All features from requirements are implemented
- [ ] Tests verify actual functionality, not just success flags
- [ ] No TODO comments about "adding real implementation later"
- [ ] No console.log statements claiming success without doing work

## Consequences of Violation

If simplified/lightweight versions are created:

1. **Immediate Rollback** - Code must be reverted
2. **Full Reimplementation** - Must implement complete functionality
3. **Extended Testing** - Must prove actual functionality works
4. **Documentation Update** - Must document what was broken and fixed

## Remember

- **Complexity is not the enemy** - Incomplete functionality is
- **Tests must be honest** - They must verify real behavior
- **Success means working** - Not just returning `{ success: true }`
- **Users need functionality** - Not promises of future functionality

## The Only Exception

The ONLY acceptable use of simplified versions is:

1. **In test mocks** - Clearly marked as test doubles
2. **In documentation examples** - Clearly marked as simplified for clarity
3. **In prototypes** - Clearly marked as non-functional prototypes

And even then, they must be clearly labeled and never deployed to production.

## Enforcement

This rule is ABSOLUTE and NON-NEGOTIABLE.

Any code that violates this rule must be rejected and rewritten.

**NO EXCEPTIONS. NO SHORTCUTS. NO SIMPLIFICATIONS.**
