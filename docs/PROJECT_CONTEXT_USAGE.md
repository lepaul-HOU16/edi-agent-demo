# ProjectContext Usage Guide

## Overview

The `ProjectContext` provides centralized state management for tracking the active renewable energy project across the chat interface. This ensures that workflow buttons and actions always operate on the correct project.

## Architecture

```
ChatPage
├── ProjectContextProvider
│   └── Context: { activeProject, setActiveProject, projectHistory, getProjectById }
├── ChatBox
│   └── ChatMessage
│       ├── Artifacts (automatically update context)
│       │   ├── TerrainMapArtifact
│       │   ├── LayoutMapArtifact
│       │   ├── WakeAnalysisArtifact
│       │   ├── WindRoseArtifact
│       │   └── FinancialAnalysisArtifact
│       ├── WorkflowCTAButtons (consume context)
│       └── ProjectDashboardArtifact (update context)
```

## Core Concepts

### ProjectInfo Interface

```typescript
interface ProjectInfo {
  projectId: string;        // Unique identifier (e.g., "west-texas-wind-farm")
  projectName: string;      // Human-readable name (e.g., "West Texas Wind Farm")
  location?: string;        // Location description
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;      // Timestamp of last interaction
}
```

### Context Value

```typescript
interface ProjectContextValue {
  activeProject: ProjectInfo | null;
  setActiveProject: (project: ProjectInfo | null) => void;
  projectHistory: ProjectInfo[];  // Recent projects (max 10)
  getProjectById: (projectId: string) => ProjectInfo | null;
}
```

## Usage

### 1. Consuming the Context

Use the `useProjectContext` hook in any component that needs access to the active project:

```typescript
import { useProjectContext } from '@/contexts/ProjectContext';

function MyComponent() {
  const { activeProject, setActiveProject } = useProjectContext();
  
  if (!activeProject) {
    return <Alert>No active project selected</Alert>;
  }
  
  return (
    <div>
      <h2>{activeProject.projectName}</h2>
      <p>{activeProject.location}</p>
    </div>
  );
}
```

### 2. Setting the Active Project

Artifacts automatically extract and set project context when rendered:

```typescript
import { useProjectContext, extractProjectFromArtifact } from '@/contexts/ProjectContext';

function MyArtifact({ data }) {
  const { setActiveProject } = useProjectContext();
  
  useEffect(() => {
    // Extract project info from artifact data
    const projectInfo = extractProjectFromArtifact(data, 'MyArtifact');
    
    if (projectInfo) {
      setActiveProject(projectInfo);
    }
  }, [data, setActiveProject]);
  
  // ... rest of component
}
```

### 3. Using Project Context in Actions

Workflow buttons use the active project to generate queries:

```typescript
import { useProjectContext } from '@/contexts/ProjectContext';

function WorkflowButton({ action, onAction }) {
  const { activeProject } = useProjectContext();
  
  const handleClick = () => {
    if (!activeProject) {
      console.error('No active project');
      return;
    }
    
    // Replace placeholders with actual project data
    const query = action
      .replace('{project_id}', activeProject.projectId)
      .replace('{project_name}', activeProject.projectName);
    
    onAction(query);
  };
  
  return (
    <Button 
      onClick={handleClick}
      disabled={!activeProject}
    >
      Execute Action
    </Button>
  );
}
```

## Helper Functions

### extractProjectFromArtifact

Safely extracts project information from artifact data with comprehensive validation:

```typescript
import { extractProjectFromArtifact } from '@/contexts/ProjectContext';

const projectInfo = extractProjectFromArtifact(artifactData, 'ArtifactName');

if (projectInfo) {
  // Project info successfully extracted
  setActiveProject(projectInfo);
} else {
  // Extraction failed (invalid or missing data)
  console.warn('Could not extract project info');
}
```

### debugProjectContext

Debug helper for troubleshooting context issues:

```typescript
import { useProjectContext, debugProjectContext } from '@/contexts/ProjectContext';

function MyComponent() {
  const context = useProjectContext();
  
  // Dump context state to console
  debugProjectContext(context, 'MyComponent');
  
  // ... rest of component
}
```

## Session Persistence

The active project is automatically persisted to `sessionStorage` and restored on page reload:

- **Storage Key**: `activeProject`
- **Format**: JSON string of `ProjectInfo` object
- **Lifetime**: Current browser session
- **Error Handling**: Gracefully handles quota exceeded and security errors

## Error Handling

### Missing Project Context

When no active project is set:

```typescript
if (!activeProject) {
  return (
    <Alert type="warning" header="No Active Project">
      Please start by analyzing terrain at a location to create a project.
    </Alert>
  );
}
```

### Invalid Project Data

The context validates all project data before accepting it:

```typescript
// Invalid data is rejected with console warnings
setActiveProject({
  projectId: '', // ❌ Empty string rejected
  projectName: 'Test'
});

// Valid data is accepted
setActiveProject({
  projectId: 'test-project',
  projectName: 'Test Project',
  lastUpdated: Date.now()
});
```

### SessionStorage Failures

Errors are caught and logged, with fallback to in-memory state:

```typescript
try {
  sessionStorage.setItem('activeProject', JSON.stringify(project));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('SessionStorage quota exceeded');
  } else if (error.name === 'SecurityError') {
    console.warn('SessionStorage access denied (private browsing)');
  }
  // Continue with in-memory state only
}
```

## Best Practices

### 1. Always Check for Active Project

Before using project data, verify it exists:

```typescript
const { activeProject } = useProjectContext();

if (!activeProject) {
  // Handle missing project case
  return <NoProjectWarning />;
}

// Safe to use activeProject here
```

### 2. Use extractProjectFromArtifact

Don't manually parse artifact data. Use the helper function:

```typescript
// ❌ Don't do this
const projectId = data.projectId || data.project_id;
const projectName = data.projectName || data.project_name;

// ✅ Do this instead
const projectInfo = extractProjectFromArtifact(data, 'MyArtifact');
```

### 3. Provide Visual Feedback

Always show users which project is active:

```typescript
{activeProject && (
  <Box variant="awsui-key-label">
    Active Project: <strong>{activeProject.projectName}</strong>
  </Box>
)}
```

### 4. Validate Prerequisites

Check that required data exists before enabling actions:

```typescript
const canRunSimulation = 
  activeProject && 
  hasTerrainData && 
  hasLayoutData;

<Button disabled={!canRunSimulation}>
  Run Simulation
</Button>
```

## Logging

All context operations include emoji-prefixed console logs for debugging:

- 🎯 = Setting active project
- 🔄 = Restoring from session
- 💾 = Persisting to sessionStorage
- 🗑️ = Clearing from sessionStorage
- 🔍 = Looking up project
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning

Example console output:

```
🎯 [ProjectContext] Setting active project: {projectId: "test-farm", ...}
💾 [ProjectContext] Persisted active project to sessionStorage
🔄 [ProjectContext] Restored active project from session: {projectId: "test-farm", ...}
```

## Testing

### Unit Tests

Test the context provider and hooks:

```typescript
import { renderHook, act } from '@testing-library/react';
import { ProjectContextProvider, useProjectContext } from '@/contexts/ProjectContext';

test('sets active project', () => {
  const wrapper = ({ children }) => (
    <ProjectContextProvider>{children}</ProjectContextProvider>
  );
  
  const { result } = renderHook(() => useProjectContext(), { wrapper });
  
  act(() => {
    result.current.setActiveProject({
      projectId: 'test',
      projectName: 'Test Project',
      lastUpdated: Date.now()
    });
  });
  
  expect(result.current.activeProject?.projectId).toBe('test');
});
```

### Integration Tests

Test the complete workflow:

```typescript
test('complete workflow maintains project context', async () => {
  // 1. Render terrain artifact
  render(<TerrainMapArtifact data={terrainData} />);
  
  // 2. Verify active project is set
  const { activeProject } = useProjectContext();
  expect(activeProject).toBeTruthy();
  
  // 3. Click workflow button
  const button = screen.getByText('Generate Turbine Layout');
  fireEvent.click(button);
  
  // 4. Verify query includes project ID
  expect(mockOnAction).toHaveBeenCalledWith(
    expect.stringContaining(activeProject.projectId)
  );
});
```

## Troubleshooting

### Context is null

**Error**: `useProjectContext must be used within ProjectContextProvider`

**Solution**: Ensure your component is wrapped in `ProjectContextProvider`:

```typescript
// ❌ Wrong
<MyComponent />

// ✅ Correct
<ProjectContextProvider>
  <MyComponent />
</ProjectContextProvider>
```

### Project not persisting

**Issue**: Active project is lost on page reload

**Possible causes**:
1. Private browsing mode (sessionStorage disabled)
2. SessionStorage quota exceeded
3. Browser security settings

**Solution**: Check console for warnings and ensure sessionStorage is available.

### Buttons not using correct project

**Issue**: Workflow buttons execute on wrong project

**Solution**: 
1. Verify artifact is calling `setActiveProject`
2. Check console logs for project context updates
3. Use `debugProjectContext` to inspect current state

## Migration Guide

### From Legacy Props to Context

**Before**:
```typescript
<WorkflowCTAButtons 
  projectId={projectId}
  completedSteps={steps}
  onAction={handleAction}
/>
```

**After**:
```typescript
// ProjectContext automatically provides projectId
<WorkflowCTAButtons 
  messages={messages}  // Detects completed steps from artifacts
  onAction={handleAction}
/>
```

### From Manual Project Tracking to Context

**Before**:
```typescript
const [currentProject, setCurrentProject] = useState(null);

// Manually track project in each component
useEffect(() => {
  if (data.projectId) {
    setCurrentProject(data.projectId);
  }
}, [data]);
```

**After**:
```typescript
const { setActiveProject } = useProjectContext();

// Automatically handled by extractProjectFromArtifact
useEffect(() => {
  const projectInfo = extractProjectFromArtifact(data, 'MyArtifact');
  if (projectInfo) {
    setActiveProject(projectInfo);
  }
}, [data, setActiveProject]);
```

## API Reference

### useProjectContext()

Returns the current project context value.

**Returns**: `ProjectContextValue`

**Throws**: Error if used outside `ProjectContextProvider`

### setActiveProject(project)

Sets the active project and updates history.

**Parameters**:
- `project: ProjectInfo | null` - Project to set as active, or null to clear

**Side effects**:
- Updates `activeProject` state
- Adds to `projectHistory` (max 10 items)
- Persists to `sessionStorage`

### getProjectById(projectId)

Retrieves a project from history by ID.

**Parameters**:
- `projectId: string` - Project ID to look up

**Returns**: `ProjectInfo | null`

### extractProjectFromArtifact(data, artifactType)

Extracts and validates project information from artifact data.

**Parameters**:
- `data: any` - Artifact data object
- `artifactType: string` - Name of artifact (for logging)

**Returns**: `ProjectInfo | null`

### debugProjectContext(context, label)

Dumps current context state to console for debugging.

**Parameters**:
- `context: ProjectContextValue | null` - Context to debug
- `label: string` - Optional label for output (default: 'ProjectContext')

**Returns**: `void`

## Examples

### Complete Artifact Implementation

```typescript
import React, { useEffect } from 'react';
import { useProjectContext, extractProjectFromArtifact } from '@/contexts/ProjectContext';

interface MyArtifactProps {
  data: {
    projectId: string;
    projectName: string;
    location?: string;
    // ... other fields
  };
}

export const MyArtifact: React.FC<MyArtifactProps> = ({ data }) => {
  const { setActiveProject } = useProjectContext();
  
  // Extract and set project context when data changes
  useEffect(() => {
    const projectInfo = extractProjectFromArtifact(data, 'MyArtifact');
    
    if (projectInfo) {
      console.log('🎨 [MyArtifact] Setting active project:', projectInfo);
      setActiveProject(projectInfo);
    }
  }, [data, setActiveProject]);
  
  return (
    <div>
      {/* Artifact content */}
    </div>
  );
};
```

### Complete Button Implementation

```typescript
import React from 'react';
import { Button, Alert } from '@cloudscape-design/components';
import { useProjectContext } from '@/contexts/ProjectContext';

interface ActionButtonProps {
  action: string;
  label: string;
  onAction: (query: string) => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  action, 
  label, 
  onAction 
}) => {
  const { activeProject } = useProjectContext();
  
  const handleClick = () => {
    if (!activeProject) {
      console.error('❌ No active project set');
      return;
    }
    
    const query = action
      .replace('{project_id}', activeProject.projectId)
      .replace('{project_name}', activeProject.projectName);
    
    console.log(`🚀 Executing: ${query}`);
    console.log(`🎯 Project context:`, activeProject);
    
    onAction(query);
  };
  
  if (!activeProject) {
    return (
      <Alert type="warning">
        No active project selected
      </Alert>
    );
  }
  
  return (
    <Button onClick={handleClick}>
      {label}
    </Button>
  );
};
```

## Support

For issues or questions:
1. Check console logs for emoji-prefixed messages
2. Use `debugProjectContext` to inspect state
3. Verify component is wrapped in `ProjectContextProvider`
4. Check that artifact data contains required fields
