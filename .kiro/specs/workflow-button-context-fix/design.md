# Design Document

## Overview

This design implements a robust project context management system for the renewable energy workflow. The solution introduces a React Context provider that tracks the active project across the chat session, ensuring that all workflow buttons and actions operate on the correct project. The design includes automatic project extraction from artifacts, session persistence, visual feedback, and prerequisite validation.

## Architecture

### Component Hierarchy

```
ChatPage
├── ProjectContextProvider (NEW)
│   └── Context: { activeProject, setActiveProject, projectHistory }
├── ChatBox
│   └── ChatMessage
│       ├── Artifacts (TerrainMap, LayoutMap, etc.)
│       │   └── WorkflowButtons (consume ProjectContext)
│       └── ProjectDashboard
│           └── ActionButtons (update ProjectContext)
```

### Data Flow

1. **Artifact Rendering**: When an artifact is rendered, it extracts project information from its data and updates the ProjectContext
2. **Button Click**: When a workflow button is clicked, it reads the active project from ProjectContext
3. **Query Generation**: The button generates a query string with the project identifier embedded
4. **Backend Execution**: The backend receives the query with explicit project context
5. **Result Rendering**: New artifacts update the ProjectContext, maintaining continuity

## Components and Interfaces

### 1. ProjectContext (NEW)

**Purpose**: Centralized state management for active project tracking

**Interface**:
```typescript
interface ProjectInfo {
  projectId: string;        // Unique project identifier (e.g., "for-wind-farm-12")
  projectName: string;      // Human-readable name (e.g., "West Texas Wind Farm")
  location?: string;        // Location description
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;      // Timestamp of last interaction
}

interface ProjectContextValue {
  activeProject: ProjectInfo | null;
  setActiveProject: (project: ProjectInfo | null) => void;
  projectHistory: ProjectInfo[];  // Recent projects (max 10)
  getProjectById: (projectId: string) => ProjectInfo | null;
}
```

**Implementation**:
```typescript
// src/contexts/ProjectContext.tsx
export const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<ProjectInfo | null>(null);
  const [projectHistory, setProjectHistory] = useState<ProjectInfo[]>([]);

  const setActiveProject = useCallback((project: ProjectInfo | null) => {
    console.log('🎯 [ProjectContext] Setting active project:', project);
    setActiveProjectState(project);
    
    if (project) {
      // Add to history (keep last 10)
      setProjectHistory(prev => {
        const filtered = prev.filter(p => p.projectId !== project.projectId);
        return [project, ...filtered].slice(0, 10);
      });
      
      // Persist to sessionStorage
      sessionStorage.setItem('activeProject', JSON.stringify(project));
    }
  }, []);

  const getProjectById = useCallback((projectId: string) => {
    return projectHistory.find(p => p.projectId === projectId) || null;
  }, [projectHistory]);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('activeProject');
    if (stored) {
      try {
        const project = JSON.parse(stored);
        setActiveProjectState(project);
        console.log('🔄 [ProjectContext] Restored active project from session:', project);
      } catch (e) {
        console.error('Failed to restore active project:', e);
      }
    }
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, projectHistory, getProjectById }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectContextProvider');
  }
  return context;
};
```

### 2. Enhanced Artifact Components

**Purpose**: Extract and update project context when artifacts are rendered

**Changes to Existing Components**:

Each artifact component (TerrainMapArtifact, LayoutMapArtifact, etc.) will:
1. Extract project information from its data prop
2. Call `setActiveProject` when mounted or when data changes
3. Pass project context to child workflow buttons

**Example for LayoutMapArtifact**:
```typescript
const LayoutMapArtifact: React.FC<LayoutMapArtifactProps> = ({ data, onFollowUpAction }) => {
  const { setActiveProject } = useProjectContext();

  // Extract and set project context when data changes
  useEffect(() => {
    if (data.projectId || data.project_id) {
      const projectInfo: ProjectInfo = {
        projectId: data.projectId || data.project_id,
        projectName: data.projectName || data.project_name || 'Unknown Project',
        location: data.location,
        coordinates: data.coordinates,
        lastUpdated: Date.now()
      };
      
      console.log('🎨 [LayoutMapArtifact] Setting active project:', projectInfo);
      setActiveProject(projectInfo);
    }
  }, [data, setActiveProject]);

  // ... rest of component
};
```

### 3. Enhanced WorkflowCTAButtons

**Purpose**: Use project context when generating action queries

**Changes**:
```typescript
export const WorkflowCTAButtons: React.FC<WorkflowCTAButtonsProps> = ({
  messages,
  onAction
}) => {
  const { activeProject } = useProjectContext();

  // ... existing logic ...

  return (
    <>
      {activeProject && (
        <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
          Active Project: <strong>{activeProject.projectName}</strong>
        </Box>
      )}
      
      <SpaceBetween direction="horizontal" size="xs">
        {allButtons.map((button, index) => {
          return (
            <Button
              key={index}
              variant={variant}
              iconName={button.icon as any}
              disabled={!activeProject} // Disable if no active project
              onClick={() => {
                if (!activeProject) {
                  console.error('❌ [WorkflowCTA] No active project set');
                  return;
                }
                
                // Replace {project_id} with actual project ID
                const query = button.action
                  .replace('{project_id}', activeProject.projectId)
                  .replace('{project_name}', activeProject.projectName);
                
                console.log(`🚀 [WorkflowCTA] Executing: ${query}`);
                console.log(`🎯 [WorkflowCTA] Project context:`, activeProject);
                
                onAction(query);
              }}
              ariaLabel={`${button.label} for ${activeProject?.projectName || 'unknown project'}`}
            >
              {button.label}
            </Button>
          );
        })}
      </SpaceBetween>
      
      {!activeProject && (
        <Alert type="warning" header="No Active Project">
          Please start by analyzing terrain at a location to create a project.
        </Alert>
      )}
    </>
  );
};
```

### 4. Enhanced ProjectDashboardArtifact

**Purpose**: Update active project when user clicks "Continue" or "View"

**Changes**:
```typescript
const ProjectDashboardArtifact: React.FC<ProjectDashboardArtifactProps> = ({
  data,
  onAction
}) => {
  const { setActiveProject } = useProjectContext();

  const handleAction = async (action: string, projectName: string) => {
    console.log(`[ProjectDashboard] Action: ${action} on project: ${projectName}`);
    
    // Find the project in the data
    const project = data.projects.find(p => p.name === projectName);
    
    if (project && (action === 'continue' || action === 'view')) {
      // Set as active project
      const projectInfo: ProjectInfo = {
        projectId: project.name, // Use name as ID for now
        projectName: project.name,
        location: project.location,
        lastUpdated: Date.now()
      };
      
      console.log('🎯 [ProjectDashboard] Setting active project:', projectInfo);
      setActiveProject(projectInfo);
    }
    
    // ... rest of existing logic ...
  };

  // ... rest of component ...
};
```

## Data Models

### ProjectInfo

```typescript
interface ProjectInfo {
  projectId: string;        // Unique identifier (e.g., "for-wind-farm-12")
  projectName: string;      // Display name (e.g., "West Texas Wind Farm")
  location?: string;        // Human-readable location
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;      // Timestamp for sorting/history
}
```

### Project Identifier Format

The system uses a consistent format for project identifiers:
- Format: `for-wind-farm-{location-slug}`
- Example: `for-wind-farm-west-texas`
- Extraction: Parse from artifact data fields like `project_id`, `projectId`, or `project_name`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project Context Extraction

*For any* artifact with project data, when the artifact is rendered, the active project context should be updated to match the artifact's project information.

**Validates: Requirements 1.1, 2.1**

### Property 2: Button Query Generation

*For any* workflow button click with an active project set, the generated query string should contain the active project's identifier.

**Validates: Requirements 1.3, 2.2**

### Property 3: Context Persistence

*For any* project set as active, reloading the page within the same session should restore that project as the active project.

**Validates: Requirements 2.5**

### Property 4: Context Update Propagation

*For any* change to the active project, all components consuming the ProjectContext should receive the updated project information.

**Validates: Requirements 5.2**

### Property 5: Project History Uniqueness

*For any* project added to the history, the history should contain at most one entry for that project ID (most recent).

**Validates: Requirements 2.4**

## Error Handling

### Missing Project Context

**Scenario**: User clicks a workflow button when no active project is set

**Handling**:
1. Disable the button (visual feedback)
2. Show an Alert component explaining that a project must be selected
3. Log a warning to console for debugging
4. Do not execute the action

### Invalid Project Data

**Scenario**: Artifact contains malformed or incomplete project data

**Handling**:
1. Log an error with the malformed data
2. Attempt to extract partial information (e.g., just the name)
3. If extraction fails completely, do not update active project
4. Continue rendering the artifact (don't crash)

### Session Storage Failure

**Scenario**: sessionStorage is unavailable or throws an error

**Handling**:
1. Catch the error and log it
2. Fall back to in-memory state only
3. Continue functioning without persistence
4. Show a warning that context won't persist across page reloads

## Testing Strategy

### Unit Tests

1. **ProjectContext Provider**
   - Test that setActiveProject updates state correctly
   - Test that projectHistory maintains max 10 items
   - Test that getProjectById returns correct project
   - Test sessionStorage persistence and restoration

2. **useProjectContext Hook**
   - Test that hook throws error when used outside provider
   - Test that hook returns correct context value

3. **Artifact Project Extraction**
   - Test extraction from various artifact data formats
   - Test handling of missing or malformed project data
   - Test that setActiveProject is called with correct data

4. **WorkflowCTAButtons**
   - Test that buttons are disabled when no active project
   - Test that query generation includes project ID
   - Test that button labels/tooltips show project name

### Property-Based Tests

Each property-based test should run a minimum of 100 iterations.

1. **Property 1 Test: Project Context Extraction**
   - **Feature: workflow-button-context-fix, Property 1: Project Context Extraction**
   - Generate random artifact data with project information
   - Render artifact component
   - Verify activeProject matches the artifact's project data

2. **Property 2 Test: Button Query Generation**
   - **Feature: workflow-button-context-fix, Property 2: Button Query Generation**
   - Generate random project contexts
   - Generate random workflow button actions
   - Click button and verify query contains project ID

3. **Property 3 Test: Context Persistence**
   - **Feature: workflow-button-context-fix, Property 3: Context Persistence**
   - Generate random project information
   - Set as active project
   - Simulate page reload (clear state, restore from sessionStorage)
   - Verify restored project matches original

4. **Property 4 Test: Context Update Propagation**
   - **Feature: workflow-button-context-fix, Property 4: Context Update Propagation**
   - Create multiple components consuming ProjectContext
   - Update active project
   - Verify all components receive the update

5. **Property 5 Test: Project History Uniqueness**
   - **Feature: workflow-button-context-fix, Property 5: Project History Uniqueness**
   - Generate random sequence of project updates (including duplicates)
   - Verify history contains at most one entry per project ID
   - Verify history maintains chronological order (most recent first)

### Integration Tests

1. **End-to-End Workflow Test**
   - Start with terrain analysis
   - Verify active project is set
   - Click "Generate Turbine Layout" button
   - Verify query includes correct project ID
   - Verify layout artifact updates active project
   - Click "Run Wake Simulation" button
   - Verify query includes same project ID

2. **Multi-Project Test**
   - Create two different projects
   - Switch between them using dashboard "Continue" button
   - Verify active project updates correctly
   - Verify workflow buttons operate on correct project

3. **Session Persistence Test**
   - Set active project
   - Reload page
   - Verify active project is restored
   - Verify workflow buttons still work correctly

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Add ProjectContextProvider to ChatPage
2. **Phase 2**: Update artifact components to extract and set project context
3. **Phase 3**: Update WorkflowCTAButtons to use project context
4. **Phase 4**: Update ProjectDashboardArtifact to set active project
5. **Phase 5**: Add visual feedback and error handling
6. **Phase 6**: Add logging for debugging

### Backward Compatibility

- Existing artifacts without project data will continue to work
- Workflow buttons will be disabled if no project context is available
- Legacy code paths that don't use ProjectContext will continue to function

### Performance Considerations

- ProjectContext uses React.memo and useCallback to prevent unnecessary re-renders
- sessionStorage operations are wrapped in try-catch to handle errors gracefully
- Project history is limited to 10 items to prevent memory issues

### Debugging Support

All project context operations include console logging with emoji prefixes:
- 🎯 = Setting active project
- 🔄 = Restoring from session
- 🚀 = Executing action with project context
- ❌ = Error or missing context
- 🎨 = Artifact updating context
