# Default Title and Subtitle Generation - Quick Reference

## Overview

Task 8 adds automatic title and subtitle generation for all renewable energy artifacts when these fields are missing from the tool Lambda responses.

## Implementation Location

**File:** `amplify/functions/renewableOrchestrator/handler.ts`

## Functions Added

### 1. `getDefaultTitle(artifactType: string, projectId?: string): string`

Generates default titles for each artifact type:

| Artifact Type | Default Title |
|--------------|---------------|
| `terrain_analysis` | Terrain Analysis Results |
| `layout_optimization` | Wind Farm Layout Optimization |
| `wake_simulation` | Wake Simulation Analysis |
| `wind_rose_analysis` | Wind Rose Analysis |
| `report_generation` | Comprehensive Wind Farm Report |
| `project_dashboard` | Project Dashboard |

**With Project ID:** Appends ` - {projectId}` to the title

**Example:**
```typescript
getDefaultTitle('terrain_analysis', 'wind-farm-texas-123')
// Returns: "Terrain Analysis Results - wind-farm-texas-123"
```

### 2. `getDefaultSubtitle(artifactType: string, data: any): string`

Generates context-aware subtitles with coordinates and type-specific metrics:

#### Coordinate Extraction
- Extracts from `data.coordinates` or `data.location`
- Supports both `{latitude, longitude}` and `{lat, lon/lng}` formats
- Formats as: `Site: 35.0675°, -101.3954°`

#### Type-Specific Subtitles

**Terrain Analysis:**
- With metrics: `Site: 35.0675°, -101.3954° • 151 features analyzed`
- Without metrics: `Site terrain and constraints analysis`

**Layout Optimization:**
- With data: `Site: 35.0675°, -101.3954° • 25 turbines, 62.5 MW capacity`
- Without data: `Optimized turbine placement`

**Wake Simulation:**
- With AEP: `Site: 35.0675°, -101.3954° • 145.67 GWh/year`
- With turbine count: `Site: 35.0675°, -101.3954° • 25 turbines analyzed`
- Without data: `Wake effects and energy production`

**Wind Rose Analysis:**
- With wind stats: `Site: 35.0675°, -101.3954° • Average wind speed: 7.8 m/s`
- Without data: `Wind direction and speed distribution`

**Report Generation:**
- With coords: `Site: 35.0675°, -101.3954°`
- Without coords: `Executive summary and recommendations`

## Integration in formatArtifacts

Each artifact type now applies defaults:

```typescript
artifact = {
  type: 'wind_farm_terrain_analysis',
  data: {
    title: result.data.title || getDefaultTitle('terrain_analysis', result.data.projectId),
    subtitle: result.data.subtitle || getDefaultSubtitle('terrain_analysis', result.data),
    // ... other fields
  }
};
```

## Testing

### Verification Script
```bash
node tests/verify-default-title-subtitle.js
```

### Unit Tests
```bash
npm test tests/unit/test-default-title-subtitle.test.ts
```

### Integration Test
After deployment, check CloudWatch logs for:
```
✅ Artifact validated and added: {
  type: 'wind_farm_terrain_analysis',
  hasData: true,
  dataKeys: ['title', 'subtitle', 'coordinates', ...]
}
```

## Expected Behavior

### Before This Task
- Artifacts might have missing or inconsistent titles
- Subtitles might be undefined
- Frontend would need to handle missing metadata

### After This Task
- ✅ All artifacts have consistent titles
- ✅ All artifacts have informative subtitles
- ✅ Coordinates are displayed when available
- ✅ Type-specific metrics are included
- ✅ Fallback to generic descriptions when data is missing

## Deployment

```bash
# Deploy orchestrator with new functions
npx ampx sandbox

# Wait for deployment
# Test with any renewable query
```

## Verification Checklist

- [ ] `getDefaultTitle` function added before `formatArtifacts`
- [ ] `getDefaultSubtitle` function added before `formatArtifacts`
- [ ] All 5 artifact types updated in `formatArtifacts`:
  - [ ] terrain_analysis
  - [ ] layout_optimization
  - [ ] wind_rose_analysis
  - [ ] wake_simulation
  - [ ] report_generation
- [ ] TypeScript compiles without errors
- [ ] Verification script runs successfully
- [ ] CloudWatch logs show title and subtitle in artifacts

## Requirements Satisfied

✅ **Requirement 7.5:** Orchestrator generates default titles and subtitles for all artifacts

## Related Files

- Implementation: `amplify/functions/renewableOrchestrator/handler.ts`
- Types: `amplify/functions/renewableOrchestrator/types.ts`
- Tests: `tests/unit/test-default-title-subtitle.test.ts`
- Verification: `tests/verify-default-title-subtitle.js`

## Notes

- Defaults are only applied when `result.data.title` or `result.data.subtitle` are missing
- Existing titles/subtitles from tool Lambdas are preserved
- Coordinate formatting uses 4 decimal places for precision
- All numeric values are formatted appropriately (e.g., AEP to 2 decimals)
