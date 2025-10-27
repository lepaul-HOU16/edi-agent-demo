# Archive/Unarchive Quick Reference

## Overview

Archive/unarchive functionality allows users to hide old or inactive projects from default listings without deleting them. Archived projects can be restored at any time.

## Requirements Coverage

- **8.1**: Archive a project
- **8.2**: Archived projects filtered from default listings
- **8.3**: List archived projects explicitly
- **8.4**: Unarchive a project
- **8.5**: Clear active project when archiving
- **8.6**: Archived projects accessible by explicit name

## API Methods

### Archive a Project

```typescript
const result = await lifecycleManager.archiveProject(
  projectName: string,
  sessionId?: string  // Optional, for clearing active project
);

// Result
{
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}
```

**Behavior:**
- Sets `metadata.archived = true`
- Sets `metadata.archived_at` to current timestamp
- Clears active project if it matches the archived project
- Clears resolver cache

### Unarchive a Project

```typescript
const result = await lifecycleManager.unarchiveProject(
  projectName: string
);

// Result
{
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}
```

**Behavior:**
- Sets `metadata.archived = false`
- Removes `metadata.archived_at`
- Clears resolver cache

### List Active Projects

```typescript
const projects = await lifecycleManager.listActiveProjects();
// Returns: ProjectData[] (excludes archived projects)
```

**Behavior:**
- Returns only projects where `metadata.archived !== true`
- Default listing method (Requirement 8.2)

### List Archived Projects

```typescript
const projects = await lifecycleManager.listArchivedProjects();
// Returns: ProjectData[] (only archived projects)
```

**Behavior:**
- Returns only projects where `metadata.archived === true`
- Explicit listing method (Requirement 8.3)

### Search with Archive Filter

```typescript
const projects = await lifecycleManager.searchProjects({
  archived: false,  // Only active projects
  // OR
  archived: true,   // Only archived projects
  // OR omit for all projects
});
```

## Data Model

### ProjectData with Archive Fields

```typescript
interface ProjectData {
  project_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  coordinates?: { latitude: number; longitude: number };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
  report_results?: any;
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
    archived?: boolean;        // NEW: Archive flag
    archived_at?: string;      // NEW: Archive timestamp
    imported_at?: string;
    status?: string;
    [key: string]: any;
  };
}
```

## Usage Examples

### Example 1: Archive Old Project

```typescript
// Archive a project that's no longer active
const result = await lifecycleManager.archiveProject(
  'old-texas-wind-farm',
  'session-123'  // Will clear if this is the active project
);

if (result.success) {
  console.log('Project archived successfully');
} else {
  console.error('Failed to archive:', result.message);
}
```

### Example 2: List Only Active Projects

```typescript
// Get active projects for dashboard
const activeProjects = await lifecycleManager.listActiveProjects();

console.log(`Found ${activeProjects.length} active projects`);
activeProjects.forEach(project => {
  console.log(`- ${project.project_name}`);
});
```

### Example 3: View Archived Projects

```typescript
// Show user their archived projects
const archivedProjects = await lifecycleManager.listArchivedProjects();

console.log(`Found ${archivedProjects.length} archived projects`);
archivedProjects.forEach(project => {
  console.log(`- ${project.project_name} (archived ${project.metadata?.archived_at})`);
});
```

### Example 4: Restore Archived Project

```typescript
// User wants to work on an old project again
const result = await lifecycleManager.unarchiveProject('old-texas-wind-farm');

if (result.success) {
  console.log('Project restored successfully');
  
  // Now it will appear in active listings
  const activeProjects = await lifecycleManager.listActiveProjects();
  // Contains 'old-texas-wind-farm'
}
```

### Example 5: Search Active Projects Only

```typescript
// Search for active projects in Texas
const texasProjects = await lifecycleManager.searchProjects({
  location: 'texas',
  archived: false  // Only active projects
});

console.log(`Found ${texasProjects.length} active Texas projects`);
```

### Example 6: Access Archived Project by Name

```typescript
// Even though archived, can still load by explicit name
const project = await projectStore.load('archived-project-name');

if (project) {
  console.log('Project found:', project.project_name);
  console.log('Archived:', project.metadata?.archived);
  console.log('Archived at:', project.metadata?.archived_at);
}
```

## Testing

### Run Unit Tests

```bash
npm test tests/unit/test-archive-unarchive.test.ts
```

### Run Integration Tests

```bash
npm test tests/integration/test-archive-unarchive-integration.test.ts
```

### Run Verification Script

```bash
npx ts-node tests/verify-archive-unarchive.ts
```

## Common Scenarios

### Scenario 1: Clean Up Old Projects

User has 50 projects but only actively works on 5:

```typescript
// Get all projects
const allProjects = await projectStore.list();

// Archive projects older than 30 days with no recent activity
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

for (const project of allProjects) {
  const lastUpdated = new Date(project.updated_at);
  if (lastUpdated < thirtyDaysAgo) {
    await lifecycleManager.archiveProject(project.project_name);
  }
}

// Now active list only shows recent projects
const activeProjects = await lifecycleManager.listActiveProjects();
console.log(`Reduced to ${activeProjects.length} active projects`);
```

### Scenario 2: Seasonal Projects

User has seasonal wind farm projects:

```typescript
// Archive winter projects in summer
const winterProjects = await lifecycleManager.searchProjects({
  location: 'winter',
  archived: false
});

for (const project of winterProjects) {
  await lifecycleManager.archiveProject(project.project_name);
}

// Restore them in winter
const archivedWinterProjects = await lifecycleManager.searchProjects({
  location: 'winter',
  archived: true
});

for (const project of archivedWinterProjects) {
  await lifecycleManager.unarchiveProject(project.project_name);
}
```

### Scenario 3: Project Lifecycle

Complete project lifecycle from creation to archive:

```typescript
// 1. Create project
const projectData = {
  project_id: 'proj-123',
  project_name: 'new-wind-farm',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  coordinates: { latitude: 35.0, longitude: -101.0 }
};
await projectStore.save('new-wind-farm', projectData);

// 2. Work on project (appears in active list)
const activeProjects = await lifecycleManager.listActiveProjects();
// Contains 'new-wind-farm'

// 3. Complete project and archive
await lifecycleManager.archiveProject('new-wind-farm');

// 4. Project no longer in active list
const updatedActiveProjects = await lifecycleManager.listActiveProjects();
// Does NOT contain 'new-wind-farm'

// 5. Can still access if needed
const project = await projectStore.load('new-wind-farm');
// Returns project data with archived flag

// 6. Restore if needed
await lifecycleManager.unarchiveProject('new-wind-farm');
// Back in active list
```

## Error Handling

### Common Errors

1. **PROJECT_NOT_FOUND**: Project doesn't exist
   ```typescript
   const result = await lifecycleManager.archiveProject('nonexistent');
   // result.success = false
   // result.error = 'PROJECT_NOT_FOUND'
   ```

2. **S3 Error**: Storage operation failed
   ```typescript
   // Handled gracefully with error message
   // Falls back to cache if available
   ```

### Best Practices

1. **Always check result.success** before proceeding
2. **Handle errors gracefully** with user-friendly messages
3. **Clear active project** when archiving (pass sessionId)
4. **Use archived filter** in searches to avoid confusion
5. **Provide unarchive option** in UI for archived projects

## Performance Considerations

- **Caching**: Archived status is cached with project data (5-minute TTL)
- **Filtering**: Filtering happens in-memory after loading from S3
- **Listing**: Use `listActiveProjects()` for better performance (filters early)
- **Search**: Archived filter applied after other filters

## UI Integration

### Recommended UI Elements

1. **Archive Button**: On project details page
2. **Archived Badge**: Visual indicator on archived projects
3. **Show Archived Toggle**: In project list view
4. **Unarchive Action**: In archived project context menu
5. **Archive Confirmation**: Warn user before archiving

### Example UI Flow

```
Project List View
├── Active Projects (default)
│   ├── Project 1
│   ├── Project 2
│   └── [Show Archived] button
│
└── Archived Projects (when toggled)
    ├── Old Project 1 [Unarchive]
    ├── Old Project 2 [Unarchive]
    └── [Show Active] button
```

## Troubleshooting

### Issue: Archived project still appears in active list

**Solution**: Clear cache and reload
```typescript
projectStore.clearCache();
projectResolver.clearCache();
const activeProjects = await lifecycleManager.listActiveProjects();
```

### Issue: Cannot find archived project

**Solution**: Use explicit load or archived list
```typescript
// Option 1: Load by name
const project = await projectStore.load('project-name');

// Option 2: List all archived
const archivedProjects = await lifecycleManager.listArchivedProjects();
```

### Issue: Active project not cleared when archiving

**Solution**: Pass sessionId to archiveProject
```typescript
await lifecycleManager.archiveProject('project-name', 'session-id');
```

## Summary

Archive/unarchive functionality provides a clean way to manage project lifecycle without data loss:

- ✅ Hide old projects from default views
- ✅ Keep data accessible when needed
- ✅ Restore projects easily
- ✅ Maintain clean project lists
- ✅ No data deletion required

All requirements (8.1-8.6) are fully implemented and tested.
