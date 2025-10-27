# Design Document

## Overview

This design addresses the issue where "show my project dashboard" returns text-only responses instead of rendering the interactive ProjectDashboardArtifact UI component. The solution involves distinguishing between dashboard requests (which should return artifacts) and simple list requests (which should return text), then generating the appropriate artifact structure for the frontend to render.

## Architecture

### Current Flow (Broken)
```
User: "show my project dashboard"
    ↓
Orchestrator handler.ts
    ↓
ProjectListHandler.isProjectListQuery() → TRUE (incorrect)
    ↓
ProjectListHandler.listProjects() → Text response
    ↓
Frontend receives text → Renders as markdown
    ↓
User sees: Plain text list (not interactive UI)
```

### Fixed Flow
```
User: "show my project dashboard"
    ↓
Orchestrator handler.ts
    ↓
Check: ProjectListHandler.isProjectDashboardQuery() → TRUE
    ↓
Generate project_dashboard artifact with full data
    ↓
Frontend receives artifact → Renders ProjectDashboardArtifact
    ↓
User sees: Interactive table with action buttons
```

## Components and Interfaces

### 1. Intent Detection Enhancement

**Location:** `amplify/functions/renewableOrchestrator/handler.ts`

Add dashboard detection before project list detection:

```typescript
// Check if this is a "show project dashboard" query
if (ProjectListHandler.isProjectDashboardQuery(event.query)) {
  console.log('📊 Detected project dashboard query');
  
  // Generate dashboard artifact instead of text response
  const dashboardResponse = await projectListHandler.generateDashboardArtifact(event.sessionId);
  
  return {
    success: dashboardResponse.success,
    message: dashboardResponse.message,
    artifacts: dashboardResponse.artifacts, // Contains project_dashboard artifact
    thoughtSteps,
    responseComplete: true,
    metadata: {
      executionTime: Date.now() - startTime,
      toolsUsed: ['project_dashboard'],
      projectCount: dashboardResponse.projectCount
    }
  };
}

// Check if this is a "list my projects" query (text-only)
if (ProjectListHandler.isProjectListQuery(event.query)) {
  // ... existing text-only logic
}
```

### 2. ProjectListHandler Enhancement

**Location:** `amplify/functions/shared/projectListHandler.ts`

Add new methods:

```typescript
/**
 * Check if query is a dashboard request (requires UI artifact)
 */
static isProjectDashboardQuery(query: string): boolean {
  const patterns = [
    /\bshow\b.*\bproject\b.*\bdashboard\b/i,
    /\bproject\b.*\bdashboard\b/i,
    /\bdashboard\b/i,
    /\bshow\b.*\bdashboard\b/i,
    /\bview\b.*\bdashboard\b/i,
    /\bopen\b.*\bdashboard\b/i
  ];
  
  return patterns.some(pattern => pattern.test(query));
}

/**
 * Generate dashboard artifact for UI rendering
 */
async generateDashboardArtifact(sessionId?: string): Promise<{
  success: boolean;
  message: string;
  artifacts: any[];
  projectCount: number;
}> {
  try {
    // Get all projects
    const allProjects = await this.projectStore.list();
    
    if (allProjects.length === 0) {
      return {
        success: true,
        message: 'You don\'t have any renewable energy projects yet.',
        artifacts: [],
        projectCount: 0
      };
    }
    
    // Get active project
    let activeProjectName: string | undefined;
    if (sessionId) {
      activeProjectName = await this.sessionContextManager.getActiveProject(sessionId);
    }
    
    // Detect duplicates
    const duplicateGroups = await this.detectDuplicates(allProjects);
    
    // Create dashboard data
    const dashboardData = {
      projects: allProjects.map(project => ({
        name: project.project_name,
        location: this.formatLocation(project.coordinates),
        completionPercentage: this.calculateCompletionPercentage(project),
        lastUpdated: project.updated_at,
        isActive: project.project_name === activeProjectName,
        isDuplicate: this.isProjectDuplicate(project, duplicateGroups),
        status: this.getProjectStatusLabel(project)
      })),
      totalProjects: allProjects.length,
      activeProject: activeProjectName || null,
      duplicateGroups: duplicateGroups.map(group => ({
        location: this.formatLocation(group.coordinates),
        count: group.projects.length,
        projects: group.projects.map(p => ({
          project_name: p.project_name,
          coordinates: p.coordinates
        }))
      }))
    };
    
    // Create artifact
    const artifact = {
      type: 'project_dashboard',
      title: 'Renewable Energy Projects Dashboard',
      data: dashboardData
    };
    
    return {
      success: true,
      message: `Found ${allProjects.length} renewable energy project${allProjects.length !== 1 ? 's' : ''}.`,
      artifacts: [artifact],
      projectCount: allProjects.length
    };
    
  } catch (error) {
    console.error('[ProjectListHandler] Error generating dashboard artifact:', error);
    return {
      success: false,
      message: 'Failed to load project dashboard.',
      artifacts: [],
      projectCount: 0
    };
  }
}

/**
 * Detect duplicate projects within 1km radius
 */
private async detectDuplicates(projects: ProjectData[]): Promise<Array<{
  coordinates: { latitude: number; longitude: number };
  projects: ProjectData[];
}>> {
  const duplicateGroups: Array<{
    coordinates: { latitude: number; longitude: number };
    projects: ProjectData[];
  }> = [];
  
  const processed = new Set<string>();
  
  for (const project of projects) {
    if (!project.coordinates || processed.has(project.project_name)) {
      continue;
    }
    
    // Find all projects within 1km
    const nearby = projects.filter(p => {
      if (!p.coordinates || p.project_name === project.project_name) {
        return false;
      }
      
      const distance = this.calculateDistance(
        project.coordinates.latitude,
        project.coordinates.longitude,
        p.coordinates.latitude,
        p.coordinates.longitude
      );
      
      return distance <= 1.0; // 1km radius
    });
    
    if (nearby.length > 0) {
      // Found duplicates
      const group = [project, ...nearby];
      duplicateGroups.push({
        coordinates: project.coordinates,
        projects: group
      });
      
      // Mark all as processed
      group.forEach(p => processed.add(p.project_name));
    }
  }
  
  return duplicateGroups;
}

/**
 * Calculate distance between two coordinates in km
 */
private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format location for display
 */
private formatLocation(coordinates?: { latitude: number; longitude: number }): string {
  if (!coordinates) return 'Unknown';
  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}

/**
 * Calculate completion percentage
 */
private calculateCompletionPercentage(project: ProjectData): number {
  const steps = [
    !!project.terrain_results,
    !!project.layout_results,
    !!project.simulation_results,
    !!project.report_results
  ];
  const completed = steps.filter(Boolean).length;
  return Math.round((completed / 4) * 100);
}

/**
 * Check if project is in duplicate groups
 */
private isProjectDuplicate(
  project: ProjectData,
  duplicateGroups: Array<{ projects: ProjectData[] }>
): boolean {
  return duplicateGroups.some(group =>
    group.projects.some(p => p.project_name === project.project_name)
  );
}

/**
 * Get project status label
 */
private getProjectStatusLabel(project: ProjectData): string {
  if (project.report_results) return 'Complete';
  if (project.simulation_results) return 'Simulation Complete';
  if (project.layout_results) return 'Layout Complete';
  if (project.terrain_results) return 'Terrain Complete';
  return 'Not Started';
}
```

### 3. Frontend Artifact Rendering

**Location:** `src/components/ChatMessage.tsx`

Add artifact type mapping:

```typescript
import ProjectDashboardArtifact from './renewable/ProjectDashboardArtifact';

// In renderArtifact function
case 'project_dashboard':
  return (
    <ProjectDashboardArtifact
      key={index}
      data={artifact.data}
      darkMode={darkMode}
      onAction={(action, projectName) => {
        console.log(`Dashboard action: ${action} on ${projectName}`);
        // Handle actions like view, continue, rename, delete
        if (action === 'view') {
          // Send query to show project details
          handleSendMessage(`show project ${projectName}`);
        } else if (action === 'continue') {
          // Set as active and suggest next step
          handleSendMessage(`continue with project ${projectName}`);
        } else if (action === 'rename') {
          // Prompt for new name
          handleSendMessage(`rename project ${projectName} to `);
        } else if (action === 'delete') {
          // Confirm deletion
          handleSendMessage(`delete project ${projectName}`);
        }
      }}
    />
  );
```

## Data Models

### Dashboard Artifact Structure

```typescript
interface ProjectDashboardArtifact {
  type: 'project_dashboard';
  title: string;
  data: {
    projects: Array<{
      name: string;
      location: string;
      completionPercentage: number;
      lastUpdated: string; // ISO 8601
      isActive: boolean;
      isDuplicate: boolean;
      status: string; // 'Complete' | 'Simulation Complete' | 'Layout Complete' | 'Terrain Complete' | 'Not Started'
    }>;
    totalProjects: number;
    activeProject: string | null;
    duplicateGroups: Array<{
      location: string;
      count: number;
      projects: Array<{
        project_name: string;
        coordinates: {
          latitude: number;
          longitude: number;
        };
      }>;
    }>;
  };
}
```

## Error Handling

### No Projects Found
- Return success with empty artifacts array
- Display friendly message: "You don't have any renewable energy projects yet."
- Suggest starting with terrain analysis

### Session Context Unavailable
- Continue without active project marker
- Log warning but don't fail
- Dashboard still displays all projects

### Duplicate Detection Failure
- Continue without duplicate highlighting
- Log error for debugging
- Dashboard still displays all projects

### Frontend Rendering Error
- Fallback to text-only response
- Log error to console
- Display error message to user

## Testing Strategy

### Unit Tests

1. **Intent Detection Tests**
   - Test `isProjectDashboardQuery()` with various queries
   - Verify "dashboard" keyword triggers dashboard intent
   - Verify "list my projects" does NOT trigger dashboard intent
   - Test edge cases (typos, variations)

2. **Artifact Generation Tests**
   - Test `generateDashboardArtifact()` with multiple projects
   - Verify completion percentage calculation
   - Test duplicate detection algorithm
   - Test active project marking

3. **Duplicate Detection Tests**
   - Test with projects at same location
   - Test with projects 0.5km apart (should be duplicates)
   - Test with projects 2km apart (should NOT be duplicates)
   - Test with no coordinates

### Integration Tests

1. **End-to-End Dashboard Flow**
   - Send "show my project dashboard" query
   - Verify artifact is generated (not text)
   - Verify artifact contains all projects
   - Verify frontend renders ProjectDashboardArtifact

2. **Backward Compatibility**
   - Send "list my projects" query
   - Verify text response is returned (not artifact)
   - Verify text formatting is preserved

3. **Action Button Integration**
   - Click "View" button on project
   - Verify "show project {name}" query is sent
   - Click "Continue" button
   - Verify project is set as active

### Manual Testing

1. **Dashboard Display**
   - Create 5+ projects with varying completion
   - Request dashboard
   - Verify all projects displayed
   - Verify sorting works
   - Verify action buttons work

2. **Duplicate Detection**
   - Create 2 projects at same coordinates
   - Request dashboard
   - Verify duplicate warning displayed
   - Verify both projects marked as duplicates

3. **Active Project Marker**
   - Set active project in session
   - Request dashboard
   - Verify active project has green badge
   - Verify only one project marked as active

## Performance Considerations

- Dashboard generation should complete in < 500ms for 100 projects
- Duplicate detection uses O(n²) algorithm - acceptable for < 1000 projects
- Frontend rendering should be instant with React memoization
- No pagination needed for < 100 projects (typical use case)

## Security Considerations

- Dashboard only shows projects owned by authenticated user
- Session context validated before marking active project
- No sensitive data exposed in artifact (coordinates are public)
- Action buttons require confirmation for destructive operations

## Deployment Strategy

1. Deploy backend changes (handler.ts, projectListHandler.ts)
2. Verify dashboard artifact generation in CloudWatch logs
3. Deploy frontend changes (ChatMessage.tsx)
4. Test in sandbox environment
5. Validate with multiple test projects
6. Deploy to production

## Rollback Plan

If dashboard rendering fails:
1. Revert frontend changes
2. Dashboard queries will fall back to text responses
3. No data loss or functionality impact
4. Users can still list projects with text

## Success Metrics

- Dashboard artifact generated in < 500ms
- 100% of "dashboard" queries return artifacts (not text)
- 0% of "list" queries return artifacts (should be text)
- Frontend renders dashboard in < 100ms
- Zero console errors during rendering
- User can perform all CRUD operations from dashboard
