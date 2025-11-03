# ProjectStore New Fields - Quick Reference

## New Fields Overview

### Status Field (Top-level)
```typescript
type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

interface ProjectData {
  status?: ProjectStatus;  // NEW: Track project status
  // ... other fields
}
```

### Metadata Fields
```typescript
interface ProjectData {
  metadata?: {
    archived?: boolean;      // NEW: Is project archived?
    archived_at?: string;    // NEW: When was it archived? (ISO 8601)
    imported_at?: string;    // NEW: When was it imported? (ISO 8601)
    // ... other metadata
  };
}
```

## Quick API Reference

### Status Management
```typescript
// Update status
await projectStore.updateStatus('project-name', 'in_progress');

// Check if in progress
const inProgress = await projectStore.isInProgress('project-name');
// Returns: boolean
```

### Archive Management
```typescript
// Archive a project
await projectStore.archive('project-name');
// Sets: metadata.archived = true, metadata.archived_at = now

// Unarchive a project
await projectStore.unarchive('project-name');
// Sets: metadata.archived = false, metadata.archived_at = undefined

// Check if archived
const archived = await projectStore.isArchived('project-name');
// Returns: boolean

// List archived projects only
const archivedProjects = await projectStore.listArchived();
// Returns: ProjectData[]

// List active projects only
const activeProjects = await projectStore.listActive();
// Returns: ProjectData[]
```

### Import Tracking
```typescript
// Mark as imported
await projectStore.markAsImported('project-name');
// Sets: metadata.imported_at = now

// Check if imported
const project = await projectStore.load('project-name');
const imported = isProjectImported(project);
// Returns: boolean
```

## Helper Functions

### From projectSchema.ts
```typescript
import {
  isProjectArchived,
  isProjectInProgress,
  isProjectImported,
  getProjectCompletionPercentage,
  getProjectStatusDisplay,
  getArchivedStatusDisplay
} from './amplify/functions/shared/projectSchema';

// Check status
isProjectArchived(project);      // boolean
isProjectInProgress(project);    // boolean
isProjectImported(project);      // boolean

// Get display info
getProjectCompletionPercentage(project);  // number (0-100)
getProjectStatusDisplay(project);         // "In Progress", "Completed", etc.
getArchivedStatusDisplay(project);        // "Archived on 1/15/2024" or "Active"
```

## Common Patterns

### Prevent Deletion of In-Progress Projects
```typescript
const project = await projectStore.load(projectName);
if (project?.status === 'in_progress') {
  throw new Error(`Cannot delete '${projectName}' - project is currently being processed.`);
}
await projectStore.delete(projectName);
```

### Filter Active Projects in Listings
```typescript
// Option 1: Use listActive()
const activeProjects = await projectStore.listActive();

// Option 2: Use list(false)
const activeProjects = await projectStore.list(false);

// Option 3: Manual filter
const allProjects = await projectStore.list();
const activeProjects = allProjects.filter(p => !p.metadata?.archived);
```

### Track Import Source
```typescript
// During import
await projectStore.save(projectName, {
  project_id: importedData.project_id,
  project_name: projectName,
  metadata: {
    imported_at: new Date().toISOString(),
    import_source: 'external-system',  // Custom metadata
  },
});
```

### Update Status During Operations
```typescript
// Start operation
await projectStore.updateStatus(projectName, 'in_progress');

try {
  // Perform operation
  await performTerrainAnalysis(projectName);
  
  // Mark complete
  await projectStore.updateStatus(projectName, 'completed');
} catch (error) {
  // Mark failed
  await projectStore.updateStatus(projectName, 'failed');
  throw error;
}
```

## Validation

### Valid Status Values
- `'not_started'` - Default for new projects
- `'in_progress'` - Operation in progress
- `'completed'` - Operation completed successfully
- `'failed'` - Operation failed

### Date Format
All timestamp fields must be ISO 8601 format:
```typescript
const timestamp = new Date().toISOString();
// Example: "2024-01-15T10:30:00.000Z"
```

### Validation Functions
```typescript
import { validateProjectData, validatePartialProjectData } from './projectSchema';

// Validate complete project
const result = validateProjectData(projectData);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate partial update
const result = validatePartialProjectData({ status: 'in_progress' });
```

## Migration Notes

### Backward Compatibility
- All new fields are optional
- Existing projects work without modification
- Old projects will have `status: undefined` (treated as 'not_started')
- Old projects will have `metadata.archived: undefined` (treated as false)

### Updating Existing Projects
```typescript
// Projects created before this update will work as-is
const oldProject = await projectStore.load('old-project');
// oldProject.status === undefined (OK)
// oldProject.metadata?.archived === undefined (OK)

// You can update them if needed
await projectStore.updateStatus('old-project', 'not_started');
```

## Testing

### Run Tests
```bash
npm test -- tests/unit/test-project-store-new-fields.test.ts
```

### Test Coverage
- ✅ Status field operations
- ✅ Archive/unarchive operations
- ✅ Import tracking
- ✅ Validation rules
- ✅ Helper functions
- ✅ List filtering

## Related Files

- `amplify/functions/shared/projectStore.ts` - Main implementation
- `amplify/functions/shared/projectSchema.ts` - Validation and helpers
- `tests/unit/test-project-store-new-fields.test.ts` - Test suite
- `tests/TASK_16_PROJECT_STORE_SCHEMA_UPDATE_COMPLETE.md` - Full documentation

## Requirements Satisfied

- ✅ Requirement 2.7: Status field for in_progress tracking
- ✅ Requirement 8.1: Archived boolean and archived_at timestamp
- ✅ Requirement 9.5: Imported_at timestamp field
