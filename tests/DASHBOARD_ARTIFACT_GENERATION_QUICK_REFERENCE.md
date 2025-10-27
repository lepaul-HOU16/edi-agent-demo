# Dashboard Artifact Generation Tests - Quick Reference

## Run Tests

```bash
# Run all dashboard artifact generation tests
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts

# Run with coverage
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts --coverage

# Run specific test suite
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Completion percentage"

# Run specific test
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "should calculate 50% completion"
```

## Test Categories

### 1. Basic Artifact Generation
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Multiple projects"
```
- Tests artifact generation with multiple projects
- Tests empty project list handling

### 2. Completion Percentage
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Completion percentage"
```
- Tests 0%, 25%, 50%, 75%, 100% completion calculations
- Tests status labels (Not Started, Terrain Complete, etc.)

### 3. Duplicate Detection
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Duplicate detection"
```
- Tests same location duplicates
- Tests 0.5km proximity duplicates
- Tests 2km separation (no duplicates)
- Tests multiple duplicate groups

### 4. Active Project Marking
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Active project"
```
- Tests active project marking from session
- Tests no active project scenario
- Tests error handling

### 5. Location Formatting
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Location formatting"
```
- Tests coordinate formatting (4 decimal places)
- Tests missing coordinates handling

### 6. Error Handling
```bash
npm test -- tests/unit/test-dashboard-artifact-generation.test.ts -t "Error handling"
```
- Tests ProjectStore errors
- Tests SessionContext errors
- Tests missing session ID

## Expected Results

All 20 tests should pass:
```
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

## Test Data Examples

### Project with 0% Completion
```typescript
{
  project_id: 'proj-1',
  project_name: 'new-project',
  coordinates: { latitude: 35.0, longitude: -101.0 },
  // No results
}
// Expected: completionPercentage = 0, status = "Not Started"
```

### Project with 50% Completion
```typescript
{
  project_id: 'proj-1',
  project_name: 'layout-complete',
  coordinates: { latitude: 35.0, longitude: -101.0 },
  terrain_results: { data: 'terrain' },
  layout_results: { data: 'layout' },
}
// Expected: completionPercentage = 50, status = "Layout Complete"
```

### Duplicate Projects (Same Location)
```typescript
[
  { coordinates: { latitude: 35.0, longitude: -101.0 } },
  { coordinates: { latitude: 35.0, longitude: -101.0 } }
]
// Expected: Both marked as duplicates, 1 duplicate group
```

### Duplicate Projects (0.5km Apart)
```typescript
[
  { coordinates: { latitude: 35.0, longitude: -101.0 } },
  { coordinates: { latitude: 35.0045, longitude: -101.0 } }
]
// Expected: Both marked as duplicates (within 1km threshold)
```

### Non-Duplicate Projects (2km Apart)
```typescript
[
  { coordinates: { latitude: 35.0, longitude: -101.0 } },
  { coordinates: { latitude: 35.018, longitude: -101.0 } }
]
// Expected: Neither marked as duplicate (beyond 1km threshold)
```

## Debugging Failed Tests

### If completion percentage is wrong:
1. Check that all 4 result fields are considered: terrain, layout, simulation, report
2. Verify calculation: (completed / 4) * 100

### If duplicate detection fails:
1. Check Haversine distance calculation
2. Verify 1km threshold (1.0 in code)
3. Check that processed set prevents double-counting

### If active project marking fails:
1. Verify SessionContextManager mock returns correct project name
2. Check that project name matches exactly
3. Verify error handling for session context failures

## Requirements Mapping

| Test Category | Requirements |
|--------------|--------------|
| Artifact Generation | 2.1, 2.2 |
| Completion Percentage | 5.2 |
| Duplicate Detection | 2.3, 5.3, 5.5 |
| Active Project | 2.4 |
| Location Formatting | 5.1 |
| Status Labels | 5.4 |

## Related Files

- **Implementation**: `amplify/functions/shared/projectListHandler.ts`
- **Tests**: `tests/unit/test-dashboard-artifact-generation.test.ts`
- **Dependencies**: 
  - `amplify/functions/shared/projectStore.ts`
  - `amplify/functions/shared/sessionContextManager.ts`

## Next Steps

After these tests pass:
1. Run integration tests (Task 9)
2. Run manual test scenarios (Task 10)
3. Deploy and validate (Task 11)
