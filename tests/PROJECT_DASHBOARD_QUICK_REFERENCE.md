# Project Dashboard Quick Reference

## Overview

The Project Dashboard Artifact provides a comprehensive view of all renewable energy projects with status indicators, completion tracking, duplicate detection, and quick actions.

## Requirements Covered

- **7.1**: Display project list with status indicators
- **7.2**: Show completion percentage
- **7.3**: Highlight duplicate projects
- **7.4**: Show active project marker
- **7.5**: Provide quick actions (view, continue, delete, rename)
- **7.6**: Sortable by name, date, location, completion status

## Testing the Dashboard

### 1. Trigger Dashboard Display

**Natural Language Queries:**
```
"show project dashboard"
"project dashboard"
"show all projects"
"list all projects"
"my projects"
"view all projects"
```

### 2. Expected Behavior

#### Dashboard Components

1. **Summary Statistics**
   - Total Projects count
   - Complete projects count
   - In Progress projects count
   - Duplicates count

2. **Active Project Alert**
   - Shows currently active project (if any)
   - Green success alert with project name

3. **Duplicate Groups Warning**
   - Shows number of duplicate groups found
   - Lists locations with duplicate counts
   - Orange warning alert

4. **Projects Table**
   - Project name with badges (Active, Duplicate)
   - Location
   - Completion percentage with progress bar
   - Status label (Complete, Simulation Complete, etc.)
   - Last updated timestamp
   - Actions dropdown

#### Project Status Indicators

- **✓ Complete**: All 4 steps done (100%)
- **⚡ Simulation Complete**: 3 steps done (75%)
- **📐 Layout Complete**: 2 steps done (50%)
- **🗺️ Terrain Complete**: 1 step done (25%)
- **○ Not Started**: 0 steps done (0%)

#### Badges

- **Active** (Green): Currently active project
- **Duplicate** (Red): Project at same location as another

### 3. Quick Actions

Each project has an Actions dropdown with:
- **View Details**: View project information
- **Continue Analysis**: Resume work on project
- **Rename**: Change project name
- **Delete**: Remove project

### 4. Sorting

Click column headers to sort by:
- Project Name (alphabetical)
- Location (alphabetical)
- Completion (percentage)
- Last Updated (date)

### 5. Test Scenarios

#### Scenario 1: View Dashboard with Multiple Projects
```
User: "show project dashboard"

Expected:
- Dashboard displays with all projects
- Summary statistics show correct counts
- Active project highlighted
- Duplicates marked
```

#### Scenario 2: Dashboard with Duplicates
```
Given: 2+ projects at same coordinates
User: "show project dashboard"

Expected:
- Duplicate warning alert appears
- Duplicate projects have red "Duplicate" badge
- Duplicate groups section shows location and count
```

#### Scenario 3: Empty Dashboard
```
Given: No projects exist
User: "show project dashboard"

Expected:
- Info alert: "No renewable energy projects found"
- Suggestion to start by analyzing terrain
```

#### Scenario 4: Dashboard with Active Project
```
Given: User has active project "west-texas-wind-farm"
User: "show project dashboard"

Expected:
- Green alert: "Currently working on: west-texas-wind-farm"
- Project row has green "Active" badge
```

## Testing Commands

### Run Unit Tests
```bash
npm test -- test-project-dashboard-artifact.test.tsx
```

### Run Integration Tests
```bash
npm test -- test-project-dashboard-integration.test.ts
```

### Run All Dashboard Tests
```bash
npm test -- project-dashboard
```

## Verification Checklist

### Visual Verification

- [ ] Dashboard renders without errors
- [ ] Summary statistics display correctly
- [ ] Active project alert shows (if applicable)
- [ ] Duplicate warning shows (if applicable)
- [ ] All projects listed in table
- [ ] Badges display correctly (Active, Duplicate)
- [ ] Progress bars show correct percentages
- [ ] Status labels match completion level
- [ ] Timestamps formatted correctly
- [ ] Actions dropdown works for each project
- [ ] Sorting works for all columns
- [ ] Refresh button works
- [ ] New Project button works

### Functional Verification

- [ ] Intent detection recognizes dashboard queries
- [ ] Orchestrator calls generateDashboard method
- [ ] Dashboard data includes all required fields
- [ ] Artifact created with correct type
- [ ] Frontend renders artifact correctly
- [ ] Duplicate detection works (1km radius)
- [ ] Completion percentage calculated correctly
- [ ] Active project marked correctly
- [ ] Actions trigger appropriate handlers

### Edge Cases

- [ ] Empty project list handled gracefully
- [ ] No active project handled correctly
- [ ] No duplicates handled correctly
- [ ] Single project displays correctly
- [ ] Large number of projects (50+) performs well
- [ ] Projects with missing data handled gracefully

## Common Issues

### Issue: Dashboard not displaying

**Check:**
1. Intent classifier recognizes query
2. Orchestrator routes to handleLifecycleIntent
3. generateDashboard method called
4. Artifact created with correct type
5. ChatMessage component has ProjectDashboardArtifact import
6. Artifact type check includes 'project_dashboard'

### Issue: Duplicates not detected

**Check:**
1. Projects have coordinates field
2. ProximityDetector using 1km radius
3. groupDuplicates method working correctly
4. Dashboard marks isDuplicate flag

### Issue: Completion percentage incorrect

**Check:**
1. Project has terrain_results, layout_results, simulation_results, report_results
2. calculateCompletionPercentage logic correct
3. Each step counts as 25%

## Example Dashboard Data Structure

```typescript
{
  projects: [
    {
      name: 'west-texas-wind-farm',
      location: 'West Texas',
      completionPercentage: 100,
      lastUpdated: '2025-01-15T10:30:00Z',
      isActive: true,
      isDuplicate: false,
      status: 'Complete'
    }
  ],
  totalProjects: 1,
  activeProject: 'west-texas-wind-farm',
  duplicateGroups: []
}
```

## Integration Points

### Backend
- `ProjectLifecycleManager.generateDashboard()`
- `RenewableIntentClassifier` (project_dashboard intent)
- `handler.ts` (handleLifecycleIntent case)

### Frontend
- `ProjectDashboardArtifact.tsx` (component)
- `ChatMessage.tsx` (artifact rendering)
- `renewable/index.ts` (export)

## Success Criteria

✅ Dashboard displays all projects with correct information
✅ Summary statistics accurate
✅ Active project clearly marked
✅ Duplicates highlighted with warning
✅ Completion percentages correct
✅ Quick actions available
✅ Sorting works on all columns
✅ Responsive and performant
✅ Handles edge cases gracefully
✅ Natural language queries work

## Next Steps

After verifying dashboard works:
1. Test with real project data
2. Verify performance with many projects
3. Test action buttons integration
4. Add sorting preferences persistence
5. Consider adding filters (archived, incomplete, etc.)
