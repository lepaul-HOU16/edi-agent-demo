# Task 3: Context-Aware Error Messages - COMPLETE ✅

## Implementation Summary

Successfully enhanced error messages for missing context scenarios with intent-specific guidance and active project name inclusion.

## Changes Made

### 1. Enhanced Error Message Templates (`amplify/functions/shared/errorMessageTemplates.ts`)

Added `formatMissingContextError()` function that provides:
- Intent-specific guidance for `layout_optimization`, `wake_simulation`, and `report_generation`
- Clear suggestions for how to provide missing information
- Active project name inclusion when available

**Example Output:**
```
Missing required information: latitude, longitude.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'

Active project: west-texas-site
```

### 2. Updated Parameter Validator (`amplify/functions/renewableOrchestrator/parameterValidator.ts`)

Enhanced `formatValidationError()` function to:
- Accept optional `projectContext` parameter
- Detect when missing parameters could be satisfied by context
- Use context-aware error messages when appropriate
- Handle both missing and invalid parameters
- Include active project name in error messages

Added `formatMissingContextError()` helper function for local use.

### 3. Updated Orchestrator Handler (`amplify/functions/renewableOrchestrator/handler.ts`)

Modified validation error handling to:
- Pass `projectContext` to `formatValidationError()`
- Pass `projectContext` to `logValidationFailure()`
- Ensure context information is available for error formatting

## Intent-Specific Guidance

### Layout Optimization
When coordinates are missing:
```
Missing required information: latitude, longitude.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'
```

### Wake Simulation
When project ID is missing:
```
Missing required information: project_id.

To run wake simulation, first:
• Create a layout: 'optimize layout'
• Or specify a project: 'run wake simulation for project-name'
```

### Report Generation
When project ID is missing:
```
Missing required information: project_id.

To generate a report, first:
• Complete terrain analysis and layout optimization
• Or specify a project: 'generate report for project-name'
```

## Test Coverage

Created comprehensive unit tests in `tests/unit/test-context-aware-error-messages.test.ts`:

### Test Categories
1. **formatMissingContextError Tests** (4 tests)
   - Layout optimization guidance without context
   - Active project name inclusion
   - Wake simulation guidance
   - Report generation guidance

2. **formatValidationError with Context Tests** (5 tests)
   - Context-aware message when context available but missing data
   - Context-aware message when parameters could be satisfied by context
   - Basic message when no context available
   - Invalid values handling
   - Both missing and invalid parameters

3. **Intent-Specific Guidance Tests** (3 tests)
   - Terrain analysis guidance
   - Wake simulation guidance
   - Report generation guidance

4. **Active Project Name Inclusion Tests** (2 tests)
   - Include project name when available
   - Exclude project name when not available

5. **Suggestions for Missing Information Tests** (3 tests)
   - Coordinates or terrain analysis suggestions
   - Layout or project specification suggestions
   - Workflow completion or project specification suggestions

### Test Results
```
✓ 17 tests passed
✓ 0 tests failed
✓ All test suites passed
```

## Requirements Satisfied

✅ **Requirement 3.1**: Layout optimization error messages suggest providing coordinates or running terrain analysis first

✅ **Requirement 3.2**: Wake simulation error messages suggest creating a layout or providing a project name

✅ **Requirement 3.3**: Report generation error messages suggest completing the workflow or providing a project name

✅ **Requirement 3.4**: Error messages include active project name when available

## Error Message Examples

### Example 1: Layout Optimization Without Context
**User Query:** "optimize layout"
**Error Message:**
```
Missing required information: latitude, longitude.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'
```

### Example 2: Layout Optimization With Active Project
**User Query:** "optimize layout"
**Active Project:** "west-texas-wind-farm"
**Error Message:**
```
Missing required information: latitude, longitude.

To optimize layout, either:
• Provide coordinates: 'optimize layout at 35.067482, -101.395466'
• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'

Active project: west-texas-wind-farm
```

### Example 3: Wake Simulation Without Layout
**User Query:** "run wake simulation"
**Error Message:**
```
Missing required information: project_id.

To run wake simulation, first:
• Create a layout: 'optimize layout'
• Or specify a project: 'run wake simulation for project-name'
```

### Example 4: Report Generation Without Analysis
**User Query:** "generate report"
**Error Message:**
```
Missing required information: project_id.

To generate a report, first:
• Complete terrain analysis and layout optimization
• Or specify a project: 'generate report for project-name'
```

## Benefits

1. **Clear Guidance**: Users understand exactly what they need to do next
2. **Context Awareness**: Error messages adapt based on available project context
3. **Actionable Suggestions**: Specific examples of valid queries
4. **Project Visibility**: Active project name helps users understand their current context
5. **Reduced Frustration**: Users don't need to guess what went wrong

## Integration Points

The enhanced error messages integrate with:
- Parameter validation in orchestrator
- Project context resolution
- CloudWatch logging (includes context information)
- Frontend error display

## Next Steps

This task is complete. The next task is:
- **Task 4**: Update validation logging to include project context information

## Verification

To verify the implementation:

1. **Run Unit Tests:**
   ```bash
   npm test -- tests/unit/test-context-aware-error-messages.test.ts
   ```

2. **Test in UI:**
   - Try "optimize layout" without prior terrain analysis
   - Verify error message includes helpful guidance
   - Try "run wake simulation" without prior layout
   - Verify error message suggests creating a layout first

3. **Check CloudWatch Logs:**
   - Verify validation failures include project context
   - Verify error messages are properly formatted

## Status: ✅ COMPLETE

All requirements satisfied, tests passing, no TypeScript errors.
