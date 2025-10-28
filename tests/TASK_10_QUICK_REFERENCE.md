# Task 10 Quick Reference: Agent Router Unit Tests

## Running the Tests

### Run All Agent Router Tests
```bash
npx jest tests/unit/test-agent-router-edicraft.test.ts
```

### Run with Verbose Output
```bash
npx jest tests/unit/test-agent-router-edicraft.test.ts --verbose
```

### Run Specific Test Suite
```bash
# Pattern matching tests
npx jest tests/unit/test-agent-router-edicraft.test.ts -t "EDIcraft Pattern Matching"

# Priority handling tests
npx jest tests/unit/test-agent-router-edicraft.test.ts -t "Priority Handling"

# Confidence scoring tests
npx jest tests/unit/test-agent-router-edicraft.test.ts -t "Confidence Scoring"

# Routing decision logging tests
npx jest tests/unit/test-agent-router-edicraft.test.ts -t "Routing Decision Logging"
```

### Run with Coverage
```bash
npx jest tests/unit/test-agent-router-edicraft.test.ts --coverage
```

## Test Structure

### Test Suites (3)
1. **AgentRouter - EDIcraft Pattern Matching** (51 tests)
   - Core Minecraft Patterns
   - Wellbore Trajectory Patterns
   - Horizon Surface Patterns
   - Coordinate and Position Patterns
   - Visualization Patterns
   - Priority Handling - Well Log + Minecraft
   - Non-EDIcraft Queries
   - Routing Decision Logging
   - Confidence Scoring
   - Complex Query Scenarios
   - Edge Cases

2. **AgentRouter - Pattern Priority Order** (5 tests)
   - EDIcraft vs Maintenance
   - EDIcraft vs Renewable
   - EDIcraft vs Petrophysics
   - Maintenance vs Renewable
   - Renewable vs Petrophysics

3. **AgentRouter - Matched Patterns Tracking** (3 tests)
   - Track all matched patterns
   - Empty array for non-matches
   - Pattern sources as strings

## Key Test Scenarios

### EDIcraft Pattern Matching
```typescript
// Should route to EDIcraft
"Show me data in Minecraft"
"Show wellbore trajectory"
"Build horizon surface"
"Track player position"
"Transform coordinates to UTM"
"Create minecraft visualization"
```

### Priority Handling
```typescript
// Should route to EDIcraft (not petrophysics)
"Show well log data in minecraft"
"Display log curves in minecraft"

// Should route to petrophysics (no minecraft)
"Show well log data for Well-001"
"Analyze log curves for Well-002"
```

### Confidence Scoring
```typescript
// Higher confidence for multiple matches
"Show wellbore trajectory in minecraft with player position"

// Lower confidence for single match
"minecraft"

// Default confidence for general queries
"Hello"
```

## Expected Results

### All Tests Should Pass
```
Test Suites: 1 passed, 1 total
Tests:       60 passed, 60 total
Time:        < 1 second
```

### No TypeScript Errors
```bash
npx tsc --noEmit tests/unit/test-agent-router-edicraft.test.ts
# Should complete with no errors
```

## Troubleshooting

### If Tests Fail

1. **Check Pattern Definitions**
   - Verify patterns in `TestableAgentRouter` match actual `AgentRouter`
   - Ensure regex patterns are correct

2. **Check Priority Order**
   - EDIcraft should have highest priority
   - Verify priority order: EDIcraft > Maintenance > Renewable > Petrophysics

3. **Check Confidence Calculation**
   - Confidence should be between 0.5 and 1.0
   - Multiple matches should increase confidence

### Common Issues

**Issue**: Tests fail with "pattern not matched"
**Solution**: Check that pattern regex is correct and case-insensitive

**Issue**: Priority tests fail
**Solution**: Verify EDIcraft patterns are checked first in determineAgentType

**Issue**: Confidence tests fail
**Solution**: Check confidence calculation formula and bounds

## Integration with CI/CD

### Add to Test Suite
```bash
# In package.json scripts
"test:agent-router": "jest tests/unit/test-agent-router-edicraft.test.ts"
```

### Run in CI Pipeline
```yaml
# In .github/workflows/test.yml
- name: Run Agent Router Tests
  run: npm run test:agent-router
```

## Next Steps

After Task 10 completion:
- [ ] Task 11: Create Unit Tests for Handler
- [ ] Task 12: Create Unit Tests for MCP Client
- [ ] Task 13: Create Integration Tests
- [ ] Task 14: Manual Testing and Validation
- [ ] Task 15: Update Documentation

## Related Files

- **Test File**: `tests/unit/test-agent-router-edicraft.test.ts`
- **Implementation**: `amplify/functions/agents/agentRouter.ts`
- **Requirements**: `.kiro/specs/fix-edicraft-agent-integration/requirements.md`
- **Design**: `.kiro/specs/fix-edicraft-agent-integration/design.md`
- **Tasks**: `.kiro/specs/fix-edicraft-agent-integration/tasks.md`
