# Find Duplicates - Quick Reference

## Overview

The `findDuplicates` method identifies groups of renewable energy projects that are located within a specified radius of each other, helping users identify and manage duplicate projects.

## Quick Start

```typescript
import { ProjectLifecycleManager } from './projectLifecycleManager';

// Initialize lifecycle manager
const lifecycleManager = new ProjectLifecycleManager(
  projectStore,
  projectResolver,
  projectNameGenerator,
  sessionContextManager
);

// Find duplicates (default 1km radius)
const duplicates = await lifecycleManager.findDuplicates();

// Find duplicates with custom radius
const duplicates5km = await lifecycleManager.findDuplicates(5.0);
```

## Method Signature

```typescript
async findDuplicates(radiusKm: number = 1.0): Promise<DuplicateGroup[]>
```

### Parameters
- `radiusKm` (optional): Search radius in kilometers (default: 1.0)

### Returns
Array of `DuplicateGroup` objects:
```typescript
interface DuplicateGroup {
  centerCoordinates: Coordinates;  // Center point of the group
  projects: ProjectData[];         // Projects in the group
  count: number;                   // Number of projects
  averageDistance: number;         // Average distance in km
}
```

## Use Cases

### 1. Show Duplicate Projects to User

```typescript
const duplicates = await lifecycleManager.findDuplicates();

if (duplicates.length === 0) {
  console.log('No duplicate projects found.');
} else {
  console.log(`Found ${duplicates.length} group(s) of duplicate projects:`);
  
  duplicates.forEach((group, index) => {
    console.log(`\nGroup ${index + 1}:`);
    console.log(`  Location: (${group.centerCoordinates.latitude}, ${group.centerCoordinates.longitude})`);
    console.log(`  Projects: ${group.count}`);
    group.projects.forEach(p => {
      console.log(`    - ${p.project_name}`);
    });
  });
}
```

### 2. Dashboard Integration

```typescript
const dashboard = await lifecycleManager.generateDashboard(sessionContext);

// Dashboard includes duplicate groups
console.log(`Total projects: ${dashboard.totalProjects}`);
console.log(`Duplicate groups: ${dashboard.duplicateGroups.length}`);

// Mark duplicate projects in UI
dashboard.projects.forEach(project => {
  if (project.isDuplicate) {
    console.log(`⚠️ ${project.name} is part of a duplicate group`);
  }
});
```

### 3. Cleanup Workflow

```typescript
// Find duplicates
const duplicates = await lifecycleManager.findDuplicates();

// For each group, let user choose which to keep
for (const group of duplicates) {
  console.log(`Found ${group.count} projects at same location:`);
  group.projects.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.project_name}`);
  });
  
  // User selects which to keep
  const keepIndex = await getUserChoice();
  const keepProject = group.projects[keepIndex];
  
  // Delete others
  for (let i = 0; i < group.projects.length; i++) {
    if (i !== keepIndex) {
      await lifecycleManager.deleteProject(
        group.projects[i].project_name,
        true // skip confirmation
      );
    }
  }
}
```

### 4. Merge Duplicates

```typescript
const duplicates = await lifecycleManager.findDuplicates();

for (const group of duplicates) {
  if (group.count === 2) {
    // Merge two projects
    const [project1, project2] = group.projects;
    
    await lifecycleManager.mergeProjects(
      project1.project_name,
      project2.project_name,
      project1.project_name // keep first project's name
    );
  }
}
```

## Response Format

### Example Response

```json
[
  {
    "centerCoordinates": {
      "latitude": 35.067482,
      "longitude": -101.395466
    },
    "projects": [
      {
        "project_id": "proj-1",
        "project_name": "texas-wind-farm-1",
        "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      },
      {
        "project_id": "proj-2",
        "project_name": "texas-wind-farm-2",
        "coordinates": { "latitude": 35.068000, "longitude": -101.396000 },
        "created_at": "2024-01-02T00:00:00Z",
        "updated_at": "2024-01-02T00:00:00Z"
      }
    ],
    "count": 2,
    "averageDistance": 0.071
  }
]
```

## User-Friendly Display

```typescript
function formatDuplicatesForUser(groups: DuplicateGroup[]): string {
  if (groups.length === 0) {
    return 'No duplicate projects found.';
  }

  let output = `Found ${groups.length} group(s) of duplicate projects:\n\n`;
  
  groups.forEach((group, index) => {
    output += `📍 Group ${index + 1}: ${group.count} projects\n`;
    output += `   Location: ${group.centerCoordinates.latitude.toFixed(4)}, ${group.centerCoordinates.longitude.toFixed(4)}\n`;
    output += `   Spread: ${group.averageDistance.toFixed(3)}km average distance\n`;
    output += `   Projects:\n`;
    
    group.projects.forEach((p, i) => {
      const status = getProjectStatus(p);
      output += `   ${i + 1}. ${p.project_name} - ${status}\n`;
    });
    
    output += '\n';
  });

  return output;
}

function getProjectStatus(project: ProjectData): string {
  if (project.report_results) return '✓ Complete';
  if (project.simulation_results) return '⚙️ Simulation done';
  if (project.layout_results) return '📐 Layout done';
  if (project.terrain_results) return '🗺️ Terrain done';
  return '⏳ Not started';
}
```

## Performance Notes

- **Time Complexity**: O(n²) where n is number of projects
- **Recommended**: Works well for up to 1,000 projects
- **Optimization**: For >1,000 projects, consider bounding box pre-filtering

## Error Handling

The method returns an empty array on error:

```typescript
try {
  const duplicates = await lifecycleManager.findDuplicates();
  // Process duplicates
} catch (error) {
  // Method already handles errors internally
  // Returns [] on error
}
```

## Testing

```bash
# Run unit tests
npm test -- tests/unit/test-project-lifecycle-manager.test.ts -t "findDuplicates"

# Run verification
npm test -- tests/verify-find-duplicates.test.ts
```

## Related Methods

- `detectDuplicates(coordinates, radiusKm)` - Check for duplicates at specific coordinates
- `checkForDuplicates(coordinates, radiusKm)` - Detect duplicates and generate user prompt
- `mergeProjects(source, target, keepName)` - Merge duplicate projects
- `deleteProject(name, skipConfirmation)` - Delete duplicate projects
- `generateDashboard(sessionContext)` - Dashboard includes duplicate information

## Requirements

- **Requirement 4.1**: Groups projects by location within configurable radius
- **Requirement 4.2**: Filters to only groups with 2+ projects

## Status

✓ Implemented and tested
✓ All requirements met
✓ Ready for production use
