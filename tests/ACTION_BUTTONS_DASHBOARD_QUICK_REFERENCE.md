# Action Buttons with Dashboard Access - Quick Reference

## Button Configuration by Artifact Type

### Terrain Analysis
```typescript
generateActionButtons('terrain_analysis', 'project-name')
```
**Returns:**
1. **Optimize Layout** (PRIMARY) - `optimize turbine layout for project-name`
2. **View Dashboard** (SECONDARY) - `show project dashboard for project-name`

---

### Wind Farm Layout
```typescript
generateActionButtons('wind_farm_layout', 'project-name')
```
**Returns:**
1. **Run Wake Simulation** (PRIMARY) - `run wake simulation for project-name`
2. **View Dashboard** (SECONDARY) - `show project dashboard for project-name`
3. **Refine Layout** (SECONDARY) - `optimize turbine layout with different spacing for project-name`

---

### Wake Simulation
```typescript
generateActionButtons('wake_simulation', 'project-name')
```
**Returns:**
1. **Generate Report** (PRIMARY) - `generate comprehensive executive report for project-name`
2. **View Dashboard** (SECONDARY) - `show project dashboard for project-name`
3. **Financial Analysis** (SECONDARY) - `perform financial analysis and ROI calculation for project-name`
4. **Optimize Layout** (SECONDARY) - `optimize turbine layout to reduce wake losses for project-name`

---

### Report Generation
```typescript
generateActionButtons('report_generation', 'project-name')
```
**Returns:**
1. **View Dashboard** (PRIMARY) - `show project dashboard for project-name`
2. **Export Report** (SECONDARY) - `export project report as PDF for project-name`

---

## Usage Examples

### In Orchestrator Handler
```typescript
import { generateActionButtons } from '../shared/actionButtonTypes';

function formatArtifacts(results, intentType, projectName, projectData) {
  const artifacts = [];
  
  for (const result of results) {
    if (!result.success || !result.data) continue;
    
    // Generate contextual action buttons
    const actions = generateActionButtons(
      result.type,
      projectName,
      projectData
    );
    
    const artifact = {
      type: result.type,
      data: result.data,
      actions: actions  // Include actions in artifact
    };
    
    artifacts.push(artifact);
  }
  
  return artifacts;
}
```

### In Frontend Component
```typescript
import { ActionButtons } from './ActionButtons';

function ArtifactComponent({ artifact }) {
  return (
    <div>
      {/* Artifact content */}
      
      {/* Action buttons */}
      {artifact.actions && artifact.actions.length > 0 && (
        <ActionButtons 
          actions={artifact.actions}
          onAction={(query) => handleAction(query)}
        />
      )}
    </div>
  );
}
```

## Testing

### Run Unit Tests
```bash
npm test -- tests/unit/test-action-buttons-dashboard-access.test.ts
```

### Test Specific Artifact Type
```typescript
import { generateActionButtons } from './actionButtonTypes';

const buttons = generateActionButtons('terrain_analysis', 'my-project');
console.log(buttons);
// [
//   { label: 'Optimize Layout', query: 'optimize turbine layout for my-project', icon: 'settings', primary: true },
//   { label: 'View Dashboard', query: 'show project dashboard for my-project', icon: 'status-info', primary: false }
// ]
```

## Key Features

✅ **Dashboard Access at Every Step** - Every artifact type includes a "View Dashboard" button
✅ **Consistent Structure** - All buttons have label, query, icon, and primary flag
✅ **Project Context** - Handles cases with and without project names
✅ **Primary Button Logic** - Exactly one primary button per artifact type
✅ **Valid Queries** - Generates valid queries with or without project context

## Icon Reference

| Icon | Usage |
|------|-------|
| `settings` | Layout optimization, refinement |
| `status-info` | Dashboard access, project details |
| `refresh` | Wake simulation, analysis |
| `file` | Report generation |
| `calculator` | Financial analysis |
| `download` | Export functionality |
| `folder` | Project list |

## Troubleshooting

### Buttons Not Showing
- Check that `actions` array is included in artifact object
- Verify `generateActionButtons` is called in `formatArtifacts`
- Ensure artifact type matches one of the supported types

### Wrong Buttons Displayed
- Verify artifact type is correct
- Check that project name is passed correctly
- Ensure TypeScript is compiled (`npx tsc`)

### Dashboard Button Missing
- All artifact types should include dashboard button
- Run unit tests to verify: `npm test -- tests/unit/test-action-buttons-dashboard-access.test.ts`
- Check that button filtering isn't removing dashboard buttons

## Related Files

- `amplify/functions/shared/actionButtonTypes.ts` - Button generation logic
- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator integration
- `src/components/renewable/ActionButtons.tsx` - Frontend rendering
- `tests/unit/test-action-buttons-dashboard-access.test.ts` - Unit tests
