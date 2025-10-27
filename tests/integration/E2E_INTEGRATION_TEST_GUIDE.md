# End-to-End Integration Test Guide

## Overview

This document describes the comprehensive end-to-end integration test for the renewable project persistence system. The test validates that all components work together correctly through a complete user workflow.

## Test Coverage

### Complete Workflow Test
Tests the full renewable energy workflow from start to finish:

1. **Terrain Analysis**
   - Generate project name from user query
   - Create new project with coordinates
   - Save terrain analysis results
   - Set active project in session

2. **Layout Optimization**
   - Resolve project from implicit reference ("optimize layout")
   - Auto-load coordinates from terrain analysis
   - Save layout results
   - Merge with existing project data

3. **Wake Simulation**
   - Resolve project from implicit reference ("run wake simulation")
   - Auto-load layout data from previous step
   - Save simulation results
   - Merge with existing project data

4. **Report Generation**
   - Resolve project from implicit reference ("generate report")
   - Auto-load all previous results
   - Save report results
   - Verify complete project data

### Project Name Generation Tests

1. **Unique Name Generation**
   - Generate unique names for multiple projects
   - Append numbers for conflicts (e.g., "-2", "-3")
   - Verify uniqueness checking works

2. **Name from Coordinates**
   - Generate name using reverse geocoding
   - Use AWS Location Service
   - Cache geocoding results

3. **Fallback Name Generation**
   - Generate coordinate-based name on geocoding failure
   - Format: `site-n35-w101-wind-farm`

### Session Context Persistence Tests

1. **Context Maintenance**
   - Set active project
   - Track project history
   - Persist across operations

2. **History Tracking**
   - Add projects to history
   - Maintain order (most recent first)
   - Remove duplicates
   - Limit to max size (10 projects)

### Auto-loading Tests

1. **Coordinates for Layout**
   - Load coordinates from terrain analysis
   - Pass to layout optimization
   - Verify availability

2. **Layout for Simulation**
   - Load layout from previous step
   - Pass to wake simulation
   - Verify turbine data available

3. **All Results for Report**
   - Load terrain, layout, and simulation results
   - Pass to report generation
   - Verify complete data available

### Error Handling Tests

1. **Missing Project Data**
   - Handle non-existent projects gracefully
   - Return null without errors

2. **S3 Errors**
   - Fallback to cache on S3 failure
   - Continue operation with cached data

3. **DynamoDB Errors**
   - Create session-only context on failure
   - Continue operation without persistence

4. **Ambiguous References**
   - Detect multiple matching projects
   - Return list of matches
   - Suggest disambiguation

### Performance and Caching Tests

1. **S3 Caching**
   - Cache project data (5 minute TTL)
   - Reduce S3 calls
   - Verify cache hit rate

2. **Geocoding Caching**
   - Cache location lookups (24 hour TTL)
   - Reduce Location Service calls
   - Verify cache effectiveness

3. **Session Context Caching**
   - Cache session data (5 minute TTL)
   - Reduce DynamoDB calls
   - Verify cache invalidation

## Test Structure

```
tests/integration/
├── test-e2e-workflow.test.ts    # Main integration test
├── run-e2e-tests.sh             # Test runner script
└── E2E_INTEGRATION_TEST_GUIDE.md # This file
```

## Running the Tests

### Using the Test Runner Script

```bash
# Run all integration tests
./tests/integration/run-e2e-tests.sh
```

### Using Jest Directly

```bash
# Run integration tests
npx jest tests/integration/test-e2e-workflow.test.ts --verbose

# Run with coverage
npx jest tests/integration/test-e2e-workflow.test.ts --coverage

# Run specific test suite
npx jest tests/integration/test-e2e-workflow.test.ts -t "Complete Workflow"
```

### Using npm Scripts

```bash
# Run all tests (unit + integration)
npm test

# Run only integration tests
npm run test:integration
```

## Test Scenarios

### Scenario 1: New User, First Project

**User Actions:**
1. "analyze terrain in West Texas"
2. "optimize layout"
3. "run wake simulation"
4. "generate report"

**Expected Behavior:**
- Project name generated: `west-texas-wind-farm`
- Active project set in session
- Each step auto-loads previous results
- Complete project data saved

**Verification:**
- ✓ Project name contains "west-texas"
- ✓ Coordinates saved from terrain analysis
- ✓ Layout uses coordinates from terrain
- ✓ Simulation uses layout from optimization
- ✓ Report uses all previous results
- ✓ Session context maintained throughout

### Scenario 2: Returning User, Multiple Projects

**User Actions:**
1. "analyze terrain in West Texas" → Project A
2. "analyze terrain in East Texas" → Project B
3. "optimize layout" (should use Project B)
4. "run simulation for west texas" (switch to Project A)

**Expected Behavior:**
- Two unique project names generated
- Session tracks both projects in history
- Implicit references use active project
- Explicit references switch projects

**Verification:**
- ✓ Two projects with unique names
- ✓ Both in project history
- ✓ Active project switches correctly
- ✓ Each project has independent data

### Scenario 3: Error Recovery

**User Actions:**
1. "analyze terrain in West Texas"
2. S3 fails during save
3. "optimize layout" (should use cached data)

**Expected Behavior:**
- Terrain analysis completes despite S3 error
- Data cached in memory
- Layout optimization uses cached coordinates
- System continues to function

**Verification:**
- ✓ Error logged but not thrown
- ✓ Cache contains project data
- ✓ Layout optimization succeeds
- ✓ User workflow not interrupted

### Scenario 4: Ambiguous References

**User Actions:**
1. Create "west-texas-wind-farm"
2. Create "east-texas-wind-farm"
3. "run simulation for texas"

**Expected Behavior:**
- System detects ambiguity
- Returns list of matching projects
- Suggests specific queries

**Verification:**
- ✓ `isAmbiguous` flag set
- ✓ Multiple matches returned
- ✓ User prompted to clarify

## Test Data

### Mock Coordinates
```typescript
const coordinates = {
  lat: 35.067482,  // Amarillo, TX
  lon: -101.395466
};
```

### Mock Terrain Results
```typescript
const terrainResults = {
  features: [
    { type: 'road', geometry: {}, properties: {} },
    { type: 'building', geometry: {}, properties: {} }
  ],
  suitability_score: 85,
  constraints: ['protected_area']
};
```

### Mock Layout Results
```typescript
const layoutResults = {
  turbines: [
    { id: 1, x: 100, y: 200, capacity_mw: 2.5 },
    { id: 2, x: 300, y: 400, capacity_mw: 2.5 }
  ],
  total_capacity_mw: 5.0,
  turbine_count: 2
};
```

### Mock Simulation Results
```typescript
const simulationResults = {
  annual_energy_gwh: 15.5,
  capacity_factor: 0.35,
  wake_loss_percent: 5.2,
  turbine_performance: [
    { turbine_id: 1, aep_gwh: 7.8 },
    { turbine_id: 2, aep_gwh: 7.7 }
  ]
};
```

## Assertions

### Project Data Assertions
```typescript
// Verify project exists
expect(project).toBeDefined();
expect(project?.project_name).toBe(expectedName);

// Verify data merging
expect(project?.terrain_results).toEqual(terrainResults);
expect(project?.layout_results).toEqual(layoutResults);
expect(project?.simulation_results).toEqual(simulationResults);

// Verify metadata
expect(project?.coordinates).toEqual(coordinates);
expect(project?.created_at).toBeDefined();
expect(project?.updated_at).toBeDefined();
```

### Session Context Assertions
```typescript
// Verify active project
expect(sessionContext.active_project).toBe(projectName);

// Verify history
expect(sessionContext.project_history).toContain(projectName);
expect(sessionContext.project_history[0]).toBe(mostRecentProject);

// Verify TTL
expect(sessionContext.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
```

### Resolution Assertions
```typescript
// Verify project resolution
expect(result.projectName).toBe(expectedName);
expect(result.confidence).toBe('explicit' | 'implicit' | 'partial' | 'active');

// Verify ambiguity detection
expect(result.isAmbiguous).toBe(true);
expect(result.matches?.length).toBeGreaterThan(1);
```

## Mock Configuration

### S3 Mock
```typescript
s3Mock.on(GetObjectCommand).resolves({
  Body: Readable.from([JSON.stringify(projectData)])
});

s3Mock.on(PutObjectCommand).resolves({});

s3Mock.on(ListObjectsV2Command).resolves({
  Contents: [
    { Key: 'renewable/projects/project-name/project.json' }
  ]
});
```

### DynamoDB Mock
```typescript
dynamoMock.on(GetCommand).resolves({
  Item: sessionContext
});

dynamoMock.on(PutCommand).resolves({});

dynamoMock.on(UpdateCommand).resolves({
  Attributes: updatedContext
});
```

### Location Service Mock
```typescript
locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
  Results: [{
    Place: {
      Municipality: 'Amarillo',
      Region: 'TX'
    }
  }]
});
```

## Success Criteria

### All Tests Pass
- ✓ Complete workflow test passes
- ✓ Project name generation tests pass
- ✓ Session context tests pass
- ✓ Auto-loading tests pass
- ✓ Error handling tests pass
- ✓ Performance tests pass

### Code Coverage
- ✓ ProjectStore: 100% coverage
- ✓ ProjectNameGenerator: 100% coverage
- ✓ SessionContextManager: 100% coverage
- ✓ ProjectResolver: 100% coverage

### Integration Points
- ✓ All components work together
- ✓ Data flows correctly through system
- ✓ Caching reduces external calls
- ✓ Errors handled gracefully

## Troubleshooting

### Test Failures

**Problem:** Tests fail with "NoSuchKey" error
**Solution:** Verify S3 mock is configured correctly

**Problem:** Tests fail with DynamoDB errors
**Solution:** Verify DynamoDB mock is configured correctly

**Problem:** Tests timeout
**Solution:** Check for infinite loops or missing mock responses

### Mock Issues

**Problem:** Mock not returning expected data
**Solution:** Verify mock configuration matches test expectations

**Problem:** Mock called more times than expected
**Solution:** Check cache configuration and TTL settings

**Problem:** Mock not called at all
**Solution:** Verify code path reaches mocked service

## Next Steps

After integration tests pass:

1. **Deploy to Sandbox**
   ```bash
   npx ampx sandbox
   ```

2. **Test in Real Environment**
   - Create actual projects
   - Verify S3 storage
   - Verify DynamoDB persistence
   - Verify Location Service integration

3. **Monitor Performance**
   - Check S3 call frequency
   - Check DynamoDB call frequency
   - Check cache hit rates
   - Check response times

4. **User Acceptance Testing**
   - Test with real user queries
   - Verify natural language understanding
   - Verify project name generation
   - Verify session persistence

## Related Documentation

- [Requirements](../../.kiro/specs/renewable-project-persistence/requirements.md)
- [Design](../../.kiro/specs/renewable-project-persistence/design.md)
- [Tasks](../../.kiro/specs/renewable-project-persistence/tasks.md)
- [Unit Tests](../unit/UNIT_TESTS_README.md)

## Conclusion

The end-to-end integration test validates that all components of the renewable project persistence system work together correctly. It tests the complete user workflow from terrain analysis through report generation, verifying that:

- Project names are generated correctly
- Session context is maintained
- Previous results are auto-loaded
- Data is persisted and merged correctly
- Errors are handled gracefully
- Performance is optimized through caching

This test provides confidence that the system will work correctly in production.
