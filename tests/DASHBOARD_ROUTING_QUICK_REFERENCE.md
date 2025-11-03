# Dashboard Routing Quick Reference

## Query Routing Order

The orchestrator checks queries in this order:

1. **Dashboard Query** (line 221) - `isProjectDashboardQuery()`
2. **List Query** (line 266) - `isProjectListQuery()`
3. **Details Query** (line 307) - `isProjectDetailsQuery()`

This ensures proper precedence: dashboard > list > details

## Dashboard Query Examples

### ✅ Triggers Dashboard Artifact
- "show my project dashboard"
- "project dashboard"
- "dashboard"
- "view dashboard"
- "open dashboard"
- "my dashboard"

### ❌ Does NOT Trigger Dashboard
- "list my projects" → Returns text
- "show my projects" → Returns text
- "show project WindFarm-TX" → Returns project details

## Response Structure

### Dashboard Response
```typescript
{
  success: true,
  message: "Found 5 renewable energy projects.",
  artifacts: [
    {
      type: 'project_dashboard',
      title: 'Renewable Energy Projects Dashboard',
      data: {
        projects: [...],
        totalProjects: 5,
        activeProject: "WindFarm-TX",
        duplicateGroups: [...]
      }
    }
  ],
  thoughtSteps: [
    {
      step: 1,
      action: 'Loading project dashboard',
      reasoning: 'Generating interactive dashboard with all projects',
      status: 'complete',
      duration: 150,
      result: 'Generated dashboard with 5 project(s)'
    }
  ],
  responseComplete: true,
  metadata: {
    executionTime: 150,
    toolsUsed: ['project_dashboard'],
    projectCount: 5
  }
}
```

### List Response (Text-Only)
```typescript
{
  success: true,
  message: "You have 5 renewable energy projects:\n\n1. WindFarm-TX...",
  artifacts: [], // Empty - no UI component
  thoughtSteps: [...],
  responseComplete: true,
  metadata: {
    executionTime: 100,
    toolsUsed: ['project_list'],
    projectCount: 5,
    activeProject: "WindFarm-TX"
  }
}
```

## Testing Commands

### Manual Testing
```bash
# Test dashboard query
curl -X POST https://your-api/orchestrator \
  -d '{"query": "show my project dashboard", "sessionId": "test-123"}'

# Test list query (should still work)
curl -X POST https://your-api/orchestrator \
  -d '{"query": "list my projects", "sessionId": "test-123"}'
```

### Integration Testing
```bash
# Run orchestrator tests
npm test -- test-orchestrator-dashboard-routing

# Run end-to-end tests
npm test -- test-dashboard-e2e
```

## Debugging

### Check Query Detection
```typescript
// In handler.ts, add logging:
console.log('Dashboard check:', ProjectListHandler.isProjectDashboardQuery(event.query));
console.log('List check:', ProjectListHandler.isProjectListQuery(event.query));
```

### Check Response Structure
```typescript
// Verify artifacts array is populated
console.log('Artifacts:', response.artifacts.length);
console.log('Artifact types:', response.artifacts.map(a => a.type));
```

### Common Issues

**Issue**: Dashboard query returns text instead of artifact
- **Cause**: Dashboard check not running or returning false
- **Fix**: Verify query matches dashboard patterns
- **Debug**: Check `isProjectDashboardQuery()` return value

**Issue**: List query returns artifact instead of text
- **Cause**: Dashboard check catching list queries
- **Fix**: Verify exclusion patterns in `isProjectDashboardQuery()`
- **Debug**: Check pattern matching logic

**Issue**: No artifacts in response
- **Cause**: `generateDashboardArtifact()` returning empty array
- **Fix**: Check ProjectStore has projects
- **Debug**: Log `dashboardResponse.artifacts` length

## Files to Check

1. `amplify/functions/renewableOrchestrator/handler.ts` - Routing logic
2. `amplify/functions/shared/projectListHandler.ts` - Detection methods
3. `src/components/ChatMessage.tsx` - Frontend rendering
4. `src/components/renewable/ProjectDashboardArtifact.tsx` - UI component

## Next Steps

After verifying orchestrator routing:
1. Test frontend artifact rendering (Task 4)
2. Verify backward compatibility (Task 5)
3. Add helper methods (Task 6)
4. Write comprehensive tests (Tasks 7-10)
