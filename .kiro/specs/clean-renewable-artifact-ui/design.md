# Design Document

## Overview

This design removes unnecessary status text that appears before Cloudscape artifact templates in renewable energy analysis results. The goal is to provide a clean, professional UI where users see only the rich Cloudscape components without redundant text messages.

## Architecture

### Current Flow

```
User Query
    ↓
Renewable Orchestrator
    ↓
Returns: {
    message: "Terrain analysis completed successfully\nProject: for-wind-farm-26\n...",
    artifacts: [{ type: 'wind_farm_terrain_analysis', data: {...} }]
}
    ↓
ChatMessage Component
    ↓
Renders: AI Message Text + Artifact Component
```

### Problem

The orchestrator returns both:
1. **Text message** with status information (rendered by `AiMessageComponent`)
2. **Artifact** with full Cloudscape template (rendered by artifact component)

This creates redundancy where users see:
- "Terrain analysis completed successfully" (text)
- Then the full Cloudscape Container with the same information

### Proposed Solution

Modify the orchestrator to return **minimal or no text** when artifacts are present, allowing the Cloudscape template to be the primary UI.

## Components

### 1. Renewable Orchestrator (Backend)

**File**: `cdk/lambda-functions/renewable-orchestrator/orchestrator.ts`

**Current Behavior**:
```typescript
return {
    message: `Terrain analysis completed successfully
Project: ${projectId}
Project Status: ✓ Terrain Analysis ○ Layout Optimization ○ Wake Simulation ○ Report Generation
Next: Optimize turbine layout to maximize energy production`,
    artifacts: [terrainArtifact]
};
```

**Proposed Change**:
```typescript
return {
    message: "", // Empty or minimal message when artifact is present
    artifacts: [terrainArtifact]
};
```

**Rationale**: The Cloudscape artifact contains all necessary information including:
- Title and description in Header
- Project ID in footer
- Workflow status in WorkflowCTAButtons
- Next steps in WorkflowCTAButtons

### 2. Artifact Components (Frontend)

**Files**:
- `src/components/renewable/TerrainMapArtifact.tsx`
- `src/components/renewable/WindRoseArtifact.tsx`
- `src/components/renewable/LayoutMapArtifact.tsx`
- `src/components/renewable/SimulationChartArtifact.tsx`
- `src/components/renewable/ReportArtifact.tsx`

**No Changes Required**: These components already have complete Cloudscape templates with:
- Container with Header
- WorkflowCTAButtons for navigation
- All data visualization
- Project metadata

### 3. ChatMessage Component (Frontend)

**File**: `src/components/ChatMessage.tsx`

**Current Behavior**:
```typescript
// Renders AI message text first
<AiMessageComponent message={message} theme={theme} />

// Then renders artifact
<EnhancedArtifactProcessor rawArtifacts={artifacts} ... />
```

**No Changes Required**: When `message.content.text` is empty, `AiMessageComponent` will render nothing, allowing the artifact to be the only visible element.

## Data Models

### Orchestrator Response

```typescript
interface OrchestratorResponse {
    message: string;  // Empty or minimal when artifacts present
    artifacts: Artifact[];
    requestId?: string;
}
```

### Artifact Structure (Unchanged)

```typescript
interface TerrainArtifact {
    type: 'wind_farm_terrain_analysis';
    messageContentType: 'wind_farm_terrain_analysis';
    data: {
        projectId: string;
        title: string;
        subtitle?: string;
        coordinates: { lat: number; lng: number };
        metrics: {...};
        geojson: {...};
        message?: string;  // Optional description for Header
    };
}
```

## Implementation Strategy

### Phase 1: Orchestrator Message Cleanup

**Modify**: `cdk/lambda-functions/renewable-orchestrator/orchestrator.ts`

For each tool result handler:

1. **Terrain Analysis**:
   ```typescript
   // Before
   message: `Terrain analysis completed successfully\nProject: ${projectId}\n...`
   
   // After
   message: "" // Let Cloudscape template handle all UI
   ```

2. **Wind Rose**:
   ```typescript
   // Before
   message: `Wind rose analysis complete for (${lat}, ${lng})\n...`
   
   // After
   message: ""
   ```

3. **Layout Optimization**:
   ```typescript
   // Before
   message: `Layout optimization complete\nProject: ${projectId}\n...`
   
   // After
   message: ""
   ```

4. **Wake Simulation**:
   ```typescript
   // Before
   message: `Wake simulation complete\nProject: ${projectId}\n...`
   
   // After
   message: ""
   ```

5. **Report Generation**:
   ```typescript
   // Before
   message: `Report generated successfully\nProject: ${projectId}\n...`
   
   // After
   message: ""
   ```

### Phase 2: Verification

**Test Cases**:
1. Terrain analysis → Should show only Cloudscape Container
2. Wind rose → Should show only Cloudscape Container
3. Layout optimization → Should show only Cloudscape Container
4. Wake simulation → Should show only Cloudscape Container
5. Report generation → Should show only Cloudscape Container

**Verification Points**:
- No duplicate status text
- Cloudscape Header shows appropriate title
- WorkflowCTAButtons show correct workflow state
- All data visualizations render correctly
- Project metadata visible in artifact footer

## Error Handling

### When Artifact Fails to Render

If artifact rendering fails, the empty message would leave users with no feedback.

**Solution**: Keep minimal error-safe message:
```typescript
// If artifact generation succeeds
message: ""

// If artifact generation fails
message: "Analysis complete. Unable to generate visualization."
```

### Graceful Degradation

```typescript
function generateOrchestratorResponse(toolResult, artifactSuccess) {
    if (artifactSuccess) {
        return {
            message: "", // Clean UI with artifact only
            artifacts: [artifact]
        };
    } else {
        return {
            message: "Analysis complete. Results available in project dashboard.",
            artifacts: []
        };
    }
}
```

## Testing Strategy

### Unit Tests

Test orchestrator response format:
```typescript
describe('Orchestrator Response', () => {
    it('should return empty message when artifact is present', () => {
        const response = generateTerrainResponse(data);
        expect(response.message).toBe("");
        expect(response.artifacts).toHaveLength(1);
    });
    
    it('should return fallback message when artifact fails', () => {
        const response = generateTerrainResponse(data, { artifactFailed: true });
        expect(response.message).toContain("Analysis complete");
        expect(response.artifacts).toHaveLength(0);
    });
});
```

### Integration Tests

Test end-to-end flow:
```typescript
describe('Renewable Energy UI', () => {
    it('should render only Cloudscape template for terrain analysis', async () => {
        const response = await sendMessage("analyze terrain at 40.7128, -74.0060");
        
        // Should not have status text
        expect(response).not.toContain("Terrain analysis completed successfully");
        expect(response).not.toContain("Project Status:");
        
        // Should have Cloudscape artifact
        expect(response.artifacts).toHaveLength(1);
        expect(response.artifacts[0].type).toBe('wind_farm_terrain_analysis');
    });
});
```

### Manual Testing

1. **Terrain Analysis**:
   - Query: "analyze terrain at 40.7128, -74.0060"
   - Expected: Only Cloudscape Container visible
   - Verify: No status text above container

2. **Wind Rose**:
   - Query: "show wind rose for project-123"
   - Expected: Only Cloudscape Container visible
   - Verify: No status text above container

3. **Full Workflow**:
   - Complete terrain → layout → simulation → report
   - Expected: Each step shows only Cloudscape Container
   - Verify: Workflow buttons show correct progress

## Deployment

### Backend Changes

```bash
# 1. Modify orchestrator
cd cdk/lambda-functions/renewable-orchestrator

# 2. Update message generation logic
# Edit orchestrator.ts

# 3. Build and deploy
cd ../../..
cd cdk
npm run build:all
cdk deploy --all --require-approval never
```

### Frontend Changes

**No deployment required** - Frontend already handles empty messages correctly.

### Rollback Plan

If issues arise:
```typescript
// Revert to previous message format
message: `Terrain analysis completed successfully
Project: ${projectId}
...`
```

## Performance Considerations

### Benefits

1. **Reduced Payload Size**: Shorter messages = smaller response size
2. **Faster Rendering**: No need to render duplicate text
3. **Cleaner DOM**: Fewer elements in the page

### Metrics

- Message size reduction: ~200-300 bytes per response
- Rendering time: Negligible improvement (< 10ms)
- User experience: Significant improvement (cleaner UI)

## Security Considerations

**No security impact**: This change only affects UI presentation, not data access or permissions.

## Accessibility

### Considerations

1. **Screen Readers**: Cloudscape Headers already have proper ARIA labels
2. **Keyboard Navigation**: WorkflowCTAButtons are keyboard accessible
3. **Visual Hierarchy**: Cloudscape design system ensures proper contrast and sizing

### Verification

- Test with screen reader (VoiceOver/NVDA)
- Verify keyboard navigation works
- Check color contrast ratios

## Future Enhancements

### Optional: Configurable Message Mode

Allow users to toggle between:
- **Clean Mode** (default): No status text, artifacts only
- **Verbose Mode**: Include status text for debugging

```typescript
interface UserPreferences {
    artifactDisplayMode: 'clean' | 'verbose';
}
```

### Optional: Loading States

Add loading indicator while artifact generates:
```typescript
// Show minimal loading message
message: "Generating visualization..."

// Replace with empty message when artifact ready
message: ""
```

## Success Criteria

1. ✅ No status text appears before Cloudscape artifacts
2. ✅ All artifact features remain functional
3. ✅ Workflow navigation works correctly
4. ✅ Error cases handled gracefully
5. ✅ Consistent across all renewable artifact types
6. ✅ No regressions in existing functionality

## Conclusion

This design achieves a clean, professional UI by removing redundant status text and relying on the comprehensive Cloudscape templates. The implementation is straightforward, requiring only backend message changes with no frontend modifications needed.
