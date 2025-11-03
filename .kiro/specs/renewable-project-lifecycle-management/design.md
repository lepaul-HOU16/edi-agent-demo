# Design Document: Renewable Project Lifecycle Management

## Overview

This design extends the existing renewable project persistence system with lifecycle management capabilities including deduplication, deletion, renaming, bulk operations, and enhanced search. The design leverages existing components (`ProjectStore`, `ProjectResolver`, `ProjectNameGenerator`) and adds new modules for lifecycle operations.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface (Frontend)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Renewable Orchestrator (Lambda)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ProjectLifecycleManager (NEW)                │  │
│  │  - detectDuplicates()                                │  │
│  │  - deleteProject()                                   │  │
│  │  - renameProject()                                   │  │
│  │  - mergeProjects()                                   │  │
│  │  - archiveProject()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────┼────────────────────────────────┐  │
│  │                      │                                 │  │
│  ▼                      ▼                                 ▼  │
│  ProjectStore      ProjectResolver      ProjectNameGenerator│
│  (Existing)        (Existing)           (Existing)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    S3 Storage                                │
│  renewable/projects/{project-name}/project.json              │
│  renewable/projects/.index.json (NEW - for fast lookups)    │
│  renewable/projects/.archive/{project-name}/ (NEW)           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Deduplication Flow
```
User Query: "Analyze terrain at 35.067482, -101.395466"
    ↓
Orchestrator extracts coordinates
    ↓
ProjectLifecycleManager.detectDuplicates(coordinates)
    ↓
Searches S3 for projects within 1km radius
    ↓
If found: Prompt user with options
    ↓
User selects: Continue | Create New | View Details
    ↓
Execute selected action
```

#### 2. Deletion Flow
```
User Query: "delete project texas-wind-farm-10"
    ↓
ProjectResolver identifies project
    ↓
ProjectLifecycleManager.deleteProject(projectName)
    ↓
Confirm with user
    ↓
Delete from S3: renewable/projects/{name}/
    ↓
Update index
    ↓
Clear caches
    ↓
Return confirmation
```

#### 3. Rename Flow
```
User Query: "rename project texas-10 to amarillo-pilot"
    ↓
ProjectResolver identifies old project
    ↓
ProjectLifecycleManager.renameProject(oldName, newName)
    ↓
Check if newName exists
    ↓
Copy S3 data: {oldName}/ → {newName}/
    ↓
Update project.json with new name
    ↓
Delete old S3 path
    ↓
Update index
    ↓
Clear caches
    ↓
Return confirmation
```

## Components and Interfaces

### 1. ProjectLifecycleManager (NEW)

**Location:** `amplify/functions/shared/projectLifecycleManager.ts`

**Purpose:** Manages project lifecycle operations including deduplication, deletion, renaming, merging, and archiving.

**Interface:**
```typescript
export class ProjectLifecycleManager {
  constructor(
    projectStore: ProjectStore,
    projectResolver: ProjectResolver,
    projectNameGenerator: ProjectNameGenerator
  );

  // Deduplication
  async detectDuplicates(
    coordinates: Coordinates,
    radiusKm?: number
  ): Promise<DuplicateDetectionResult>;

  async promptForDuplicateResolution(
    existingProjects: ProjectData[],
    newCoordinates: Coordinates
  ): Promise<DuplicateResolutionChoice>;

  // Deletion
  async deleteProject(
    projectName: string,
    skipConfirmation?: boolean
  ): Promise<DeleteResult>;

  async bulkDelete(
    pattern: string,
    skipConfirmation?: boolean
  ): Promise<BulkDeleteResult>;

  // Renaming
  async renameProject(
    oldName: string,
    newName: string
  ): Promise<RenameResult>;

  // Merging
  async mergeProjects(
    sourceProject: string,
    targetProject: string,
    keepName?: string
  ): Promise<MergeResult>;

  // Archiving
  async archiveProject(
    projectName: string
  ): Promise<ArchiveResult>;

  async unarchiveProject(
    projectName: string
  ): Promise<UnarchiveResult>;

  async listArchivedProjects(): Promise<ProjectData[]>;

  // Search and filtering
  async searchProjects(
    filters: ProjectSearchFilters
  ): Promise<ProjectData[]>;

  // Dashboard
  async generateDashboard(): Promise<ProjectDashboard>;
}
```

**Types:**
```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    project: ProjectData;
    distanceKm: number;
  }>;
}

interface DuplicateResolutionChoice {
  action: 'continue' | 'create_new' | 'view_details';
  selectedProject?: string;
}

interface DeleteResult {
  success: boolean;
  projectName: string;
  message: string;
}

interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  deletedProjects: string[];
  failedProjects: Array<{ name: string; error: string }>;
}

interface RenameResult {
  success: boolean;
  oldName: string;
  newName: string;
  message: string;
}es)

interface MergeResult {
  success: boolean;
  sourceProject: string;
  targetProject: string;
  finalName: string;
  message: string;
}

interface ArchiveResult {
  success: boolean;
  projectName: string;
  archivePath: string;
  message: string;
}

interface UnarchiveResult {
  success: boolean;
  projectName: string;
  message: string;
}

interface ProjectSearchFilters {
  location?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  completionStatus?: 'complete' | 'incomplete' | 'partial';
  coordinates?: {
    center: Coordinates;
    radiusKm: number;
  };
  archived?: boolean;
}

interface ProjectDashboard {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  duplicateGroups: Array<{
    location: string;
    projects: string[];
    count: number;
  }>;
  recentProjects: ProjectData[];
  incompleteProjects: ProjectData[];
  activeProject?: string;
}
```

### 2. ProjectIndex (NEW)

**Location:** `amplify/functions/shared/projectIndex.ts`

**Purpose:** Fast lookup index for project metadata stored in S3 at `renewable/projects/.index.json`. Reduces need to list all S3 objects for searches.

**Interface:**
```typescript
export class ProjectIndex {
  constructor(s3Client: S3Client, bucketName: string);

  // Index management
  async rebuild(): Promise<void>;
  async addProject(projectData: ProjectData): Promise<void>;
  async removeProject(projectName: string): Promise<void>;
  async updateProject(projectName: string, updates: Partial<ProjectData>): Promise<void>;

  // Queries
  async findByCoordinates(
    coordinates: Coordinates,
    radiusKm: number
  ): Promise<ProjectData[]>;

  async findByLocation(location: string): Promise<ProjectData[]>;
  async findByDateRange(start: Date, end: Date): Promise<ProjectData[]>;
  async findIncomplete(): Promise<ProjectData[]>;
  async getAll(): Promise<ProjectData[]>;
}
```

**Index Structure:**
```json
{
  "version": "1.0",
  "lastUpdated": "2025-01-20T10:30:00Z",
  "projects": [
    {
      "project_name": "texas-wind-farm",
      "project_id": "proj-123",
      "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z",
      "completion": {
        "terrain": true,
        "layout": true,
        "simulation": false,
        "report": false
      },
      "archived": false
    }
  ]
}
```

### 3. Intent Detection Updates

**Location:** `amplify/functions/renewableOrchestrator/intentDetector.ts`

**New Intents:**
```typescript
// Lifecycle management intents
'delete_project'
'rename_project'
'merge_projects'
'archive_project'
'unarchive_project'
'list_projects'
'show_dashboard'
'search_projects'
'show_duplicates'
```

**Pattern Examples:**
```typescript
{
  intent: 'delete_project',
  patterns: [
    /delete\s+project\s+([a-z0-9\-]+)/i,
    /remove\s+project\s+([a-z0-9\-]+)/i,
    /get\s+rid\s+of\s+([a-z0-9\-]+)/i,
  ]
},
{
  intent: 'rename_project',
  patterns: [
    /rename\s+project\s+([a-z0-9\-]+)\s+to\s+([a-z0-9\-\s]+)/i,
    /change\s+name\s+of\s+([a-z0-9\-]+)\s+to\s+([a-z0-9\-\s]+)/i,
  ]
},
{
  intent: 'show_duplicates',
  patterns: [
    /show\s+duplicate\s+projects/i,
    /list\s+duplicates/i,
    /find\s+duplicate\s+projects/i,
  ]
}
```

### 4. Orchestrator Integration

**Location:** `amplify/functions/renewableOrchestrator/handler.ts`

**Updates:**
```typescript
// Add lifecycle manager
const lifecycleManager = new ProjectLifecycleManager(
  projectStore,
  projectResolver,
  projectNameGenerator
);

// Handle lifecycle intents
switch (intent) {
  case 'delete_project':
    return await handleDeleteProject(lifecycleManager, params);
  
  case 'rename_project':
    return await handleRenameProject(lifecycleManager, params);
  
  case 'show_duplicates':
    return await handleShowDuplicates(lifecycleManager);
  
  case 'show_dashboard':
    return await handleShowDashboard(lifecycleManager);
  
  // ... other cases
}

// Deduplication check before terrain analysis
if (intent === 'terrain_analysis') {
  const duplicates = await lifecycleManager.detectDuplicates(
    params.coordinates,
    1 // 1km radius
  );
  
  if (duplicates.hasDuplicates) {
    return await promptForDuplicateResolution(duplicates);
  }
}
```

## Data Models

### ProjectData (Extended)

```typescript
export interface ProjectData {
  // Existing fields
  project_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
  report_results?: any;
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };

  // NEW fields for lifecycle management
  archived?: boolean;
  archived_at?: string;
  original_name?: string; // Track renames
  rename_history?: Array<{
    old_name: string;
    new_name: string;
    renamed_at: string;
  }>;
  merged_from?: string[]; // Track merges
  tags?: string[]; // User-defined tags
  notes?: string; // User notes
}
```

### S3 Storage Structure

```
renewable/
├── projects/
│   ├── .index.json                    # Fast lookup index (NEW)
│   ├── texas-wind-farm/
│   │   └── project.json
│   ├── amarillo-pilot/
│   │   └── project.json
│   └── .archive/                      # Archived projects (NEW)
│       ├── old-project-1/
│       │   └── project.json
│       └── old-project-2/
│           └── project.json
└── artifacts/
    └── ... (existing artifact storage)
```

## Error Handling

### Deletion Errors

```typescript
// Project not found
if (!project) {
  throw new Error(
    `Project '${projectName}' not found. Use 'list projects' to see available projects.`
  );
}

// Project in use
if (project.status === 'in_progress') {
  throw new Error(
    `Cannot delete project '${projectName}' while analysis is in progress. Please wait for completion.`
  );
}

// S3 deletion failure
try {
  await s3Client.send(deleteCommand);
} catch (error) {
  throw new Error(
    `Failed to delete project '${projectName}' from storage: ${error.message}`
  );
}
```

### Rename Errors

```typescript
// Target name exists
const existing = await projectStore.load(newName);
if (existing) {
  throw new Error(
    `Project name '${newName}' already exists. Please choose a different name.`
  );
}

// Invalid name format
if (!isValidProjectName(newName)) {
  throw new Error(
    `Invalid project name '${newName}'. Use lowercase letters, numbers, and hyphens only.`
  );
}
```

### Deduplication Errors

```typescript
// Coordinates required
if (!coordinates) {
  throw new Error(
    'Coordinates required for duplicate detection. Please provide latitude and longitude.'
  );
}

// Invalid radius
if (radiusKm <= 0 || radiusKm > 100) {
  throw new Error(
    `Invalid search radius: ${radiusKm}km. Must be between 0 and 100km.`
  );
}
```

## Testing Strategy

### Unit Tests

**ProjectLifecycleManager Tests:**
```typescript
describe('ProjectLifecycleManager', () => {
  describe('detectDuplicates', () => {
    it('should find projects within 1km radius');
    it('should return empty array when no duplicates');
    it('should calculate distance correctly');
    it('should sort by distance (closest first)');
  });

  describe('deleteProject', () => {
    it('should delete project from S3');
    it('should update index after deletion');
    it('should clear caches');
    it('should throw error if project not found');
    it('should prevent deletion of in-progress projects');
  });

  describe('renameProject', () => {
    it('should rename project in S3');
    it('should preserve all project data');
    it('should update index');
    it('should throw error if target name exists');
    it('should track rename history');
  });

  describe('mergeProjects', () => {
    it('should merge two projects');
    it('should keep most complete data');
    it('should delete source project');
    it('should track merge history');
  });
});
```

**ProjectIndex Tests:**
```typescript
describe('ProjectIndex', () => {
  describe('findByCoordinates', () => {
    it('should find projects within radius');
    it('should use Haversine formula for distance');
    it('should return empty array if none found');
  });

  describe('rebuild', () => {
    it('should scan all S3 projects');
    it('should create new index file');
    it('should handle large project counts');
  });
});
```

### Integration Tests

```typescript
describe('Project Lifecycle Integration', () => {
  it('should detect duplicate when creating project at same location');
  it('should delete project and remove from all listings');
  it('should rename project and update all references');
  it('should merge projects and combine data');
  it('should archive project and exclude from active listings');
});
```

### End-to-End Tests

```typescript
describe('User Workflows', () => {
  it('should handle: create duplicate → detect → continue with existing');
  it('should handle: list projects → delete multiple → confirm');
  it('should handle: rename project → verify new name in listings');
  it('should handle: show dashboard → view duplicates → merge');
});
```

## Performance Considerations

### 1. Index-Based Lookups

- **Problem:** Listing all S3 objects is slow (100+ projects = 5+ seconds)
- **Solution:** Maintain `.index.json` with project metadata
- **Benefit:** Fast lookups (< 100ms) for searches and duplicate detection

### 2. Caching Strategy

```typescript
// Cache layers
1. In-memory cache (5 min TTL) - ProjectStore
2. Index cache (5 min TTL) - ProjectIndex
3. S3 storage (permanent) - Source of truth

// Cache invalidation
- On create: Invalidate list cache, update index
- On delete: Invalidate all caches, update index
- On rename: Invalidate all caches, update index
- On merge: Invalidate all caches, update index
```

### 3. Batch Operations

```typescript
// Bulk delete optimization
async bulkDelete(projectNames: string[]): Promise<BulkDeleteResult> {
  // Delete in parallel (max 10 concurrent)
  const chunks = chunkArray(projectNames, 10);
  
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(name => this.deleteProject(name, true))
    );
  }
  
  // Single index update at end
  await projectIndex.rebuild();
}
```

### 4. Geospatial Queries

```typescript
// Haversine formula for distance calculation
function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) * 
    Math.cos(toRad(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bounding box optimization for large datasets
function getBoundingBox(
  center: Coordinates,
  radiusKm: number
): BoundingBox {
  // Calculate lat/lon bounds
  // Filter projects by bounds before calculating exact distance
}
```

## Security Considerations

### 1. Deletion Confirmation

```typescript
// Require explicit confirmation for destructive operations
async deleteProject(projectName: string, skipConfirmation = false) {
  if (!skipConfirmation) {
    // Return confirmation prompt to user
    return {
      requiresConfirmation: true,
      message: `Are you sure you want to delete '${projectName}'? This will remove all analysis data. Type 'yes' to confirm.`,
      confirmationToken: generateToken()
    };
  }
  
  // Proceed with deletion
}
```

### 2. IAM Permissions

```typescript
// Required S3 permissions
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::${BUCKET}/renewable/projects/*",
    "arn:aws:s3:::${BUCKET}/renewable/projects/.index.json"
  ]
}
```

### 3. Validation

```typescript
// Validate project names
function isValidProjectName(name: string): boolean {
  // Only lowercase, numbers, hyphens
  return /^[a-z0-9\-]+$/.test(name);
}

// Validate coordinates
function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 && coords.latitude <= 90 &&
    coords.longitude >= -180 && coords.longitude <= 180
  );
}
```

## Migration Strategy

### Phase 1: Add Lifecycle Manager (No Breaking Changes)

1. Create `ProjectLifecycleManager` class
2. Create `ProjectIndex` class
3. Add new intent patterns to orchestrator
4. Deploy without affecting existing functionality

### Phase 2: Enable Deduplication

1. Add deduplication check before terrain analysis
2. Prompt users when duplicates detected
3. Monitor user responses and adjust thresholds

### Phase 3: Enable Deletion & Renaming

1. Add delete and rename handlers
2. Add confirmation flows
3. Test with small user group

### Phase 4: Full Rollout

1. Enable all lifecycle features
2. Build project index from existing projects
3. Add dashboard and bulk operations
4. Monitor performance and user feedback

## Deployment Checklist

- [ ] Create `ProjectLifecycleManager` class
- [ ] Create `ProjectIndex` class
- [ ] Update orchestrator with new intents
- [ ] Add IAM permissions for S3 operations
- [ ] Create `.index.json` in S3
- [ ] Add unit tests (>80% coverage)
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Update documentation
- [ ] Deploy to sandbox
- [ ] Test all workflows
- [ ] Deploy to production
- [ ] Monitor CloudWatch logs
- [ ] Gather user feedback

## Monitoring and Observability

### CloudWatch Metrics

```typescript
// Custom metrics to track
- ProjectLifecycle.DuplicatesDetected
- ProjectLifecycle.ProjectsDeleted
- ProjectLifecycle.ProjectsRenamed
- ProjectLifecycle.ProjectsMerged
- ProjectLifecycle.IndexRebuildTime
- ProjectLifecycle.SearchLatency
```

### Logging

```typescript
// Log all lifecycle operations
console.log('[ProjectLifecycle] Operation:', {
  operation: 'delete',
  projectName: 'texas-wind-farm-10',
  userId: 'user-123',
  timestamp: new Date().toISOString(),
  success: true
});
```

### Alerts

```typescript
// Alert conditions
- Index rebuild failures
- High deletion rate (> 10/hour)
- Search latency > 1s
- S3 operation failures
```

## Future Enhancements

### 1. Project Templates

```typescript
// Save project as template
await lifecycleManager.saveAsTemplate(projectName, templateName);

// Create project from template
await lifecycleManager.createFromTemplate(templateName, newProjectName);
```

### 2. Project Sharing

```typescript
// Share project with other users
await lifecycleManager.shareProject(projectName, targetUserId);

// Export project for external sharing
const exportData = await lifecycleManager.exportProject(projectName);
```

### 3. Version Control

```typescript
// Save project snapshot
await lifecycleManager.createSnapshot(projectName, snapshotName);

// Restore from snapshot
await lifecycleManager.restoreSnapshot(projectName, snapshotName);
```

### 4. Advanced Search

```typescript
// Full-text search across project data
await lifecycleManager.searchProjects({
  query: 'high wind speed',
  fields: ['notes', 'metadata', 'results']
});
```

## Conclusion

This design provides a comprehensive project lifecycle management system that:

- **Prevents duplicates** through intelligent detection
- **Enables cleanup** through deletion and archiving
- **Improves organization** through renaming and merging
- **Enhances discovery** through advanced search
- **Maintains performance** through indexing and caching
- **Ensures safety** through confirmation flows

The design leverages existing components and follows established patterns in the codebase, making it straightforward to implement and maintain.
