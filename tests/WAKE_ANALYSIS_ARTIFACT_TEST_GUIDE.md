# WakeAnalysisArtifact Component Test Guide

## Overview

The `WakeAnalysisArtifact` component displays wake simulation results with heat map visualization and performance metrics (AEP, CF).

## Component Location

- **Component**: `src/components/renewable/WakeAnalysisArtifact.tsx`
- **Registered in**: `src/components/ArtifactRenderer.tsx`
- **Exported from**: `src/components/renewable/index.ts`

## Data Structure

The component expects data with the following structure:

```typescript
{
  messageContentType: 'wake_simulation',
  title: string,
  subtitle?: string,
  projectId: string,
  performanceMetrics: {
    annualEnergyProduction?: number,
    netAEP?: number,
    grossAEP?: number,
    capacityFactor: number,
    wakeLosses: number,
    wakeEfficiency?: number
  },
  turbineMetrics?: {
    count: number,
    totalCapacity: number,
    averageWindSpeed?: number
  },
  monthlyProduction?: number[],
  visualizations?: {
    wake_heat_map?: string,
    wake_analysis?: string,
    performance_charts?: string[],
    seasonal_analysis?: string,
    variability_analysis?: string,
    wind_rose?: string,
    complete_report?: string
  },
  windResourceData?: {
    source: string,
    dataYear: number,
    reliability: string,
    meanWindSpeed?: number,
    prevailingDirection?: number,
    dataPoints?: number
  },
  dataSource?: string,
  dataYear?: number,
  message?: string
}
```

## Features

### 1. Performance Metrics Display
- **Annual Energy Production (AEP)**: Net energy after wake losses
- **Capacity Factor (CF)**: Average capacity utilization
- **Wake Losses**: Impact on production with severity indicator
- **Wake Efficiency**: Effective energy capture

### 2. Wake Loss Severity Indicators
- **Low** (< 5%): Green badge
- **Moderate** (5-8%): Blue badge
- **High** (8-12%): Grey badge
- **Very High** (> 12%): Red badge

### 3. Visualizations

#### Overview Tab
- Monthly energy production chart (Plotly bar chart)
- Performance summary (Gross AEP, Net AEP, Energy Loss)

#### Wake Heat Map Tab
- Interactive Folium map showing wake interactions
- Heat zones for each turbine
- Interaction lines between turbines
- Wind direction arrows

#### Analysis Charts Tab
- Wake deficit analysis
- Performance charts (multiple)
- Seasonal wind analysis
- Wind resource variability
- Wind rose

### 4. Turbine Configuration
- Number of turbines
- Total capacity (MW)
- Average wind speed (m/s)

### 5. Data Source Information
- NREL Wind Toolkit data
- Data year
- Number of data points analyzed
- Reliability indicator

### 6. Follow-Up Actions
- Generate comprehensive report
- Optimize layout to reduce wake losses
- Perform financial analysis
- Compare scenarios

## Testing

### Manual Testing

1. **Run wake simulation query**:
   ```
   "run wake simulation for project [project_id]"
   ```

2. **Verify artifact renders**:
   - Check title and subtitle display
   - Verify performance metrics (AEP, CF, wake losses)
   - Check wake loss severity badge color
   - Verify turbine configuration

3. **Test visualizations**:
   - Click "Wake Heat Map" tab → verify map loads
   - Click "Analysis Charts" tab → verify charts display
   - Check monthly production chart in Overview tab

4. **Test interactions**:
   - Click "Generate Report" button
   - Click "Optimize Layout" button
   - Verify follow-up actions trigger correctly

### Automated Testing

Run verification script:
```bash
npx tsx tests/verify-wake-analysis-artifact.ts
```

Expected output:
```
✅ ALL CHECKS PASSED

Features:
  ✓ Performance metrics display (AEP, CF, wake losses)
  ✓ Wake heat map visualization
  ✓ Monthly production chart
  ✓ Analysis charts (wake deficit, performance, seasonal)
  ✓ Turbine configuration details
  ✓ Data source information (NREL)
  ✓ Follow-up action buttons
```

### Integration Testing

Test with orchestrator:
```bash
node tests/test-wake-simulation-orchestrator.js
```

This verifies:
- Orchestrator creates `wake_simulation` artifact
- Artifact data structure matches component props
- Component renders without errors

## Example Test Queries

### Basic Wake Simulation
```
"run wake simulation for project wind-farm-001"
```

Expected result:
- Artifact with type `wake_simulation`
- Performance metrics displayed
- Wake heat map rendered
- Monthly production chart shown

### After Layout Optimization
```
"optimize layout at 35.067482, -101.395466"
"run wake simulation"
```

Expected result:
- Uses layout from previous step
- Shows wake interactions between turbines
- Displays energy losses due to wake effects

## Troubleshooting

### Artifact Not Rendering

**Check 1**: Verify orchestrator creates correct artifact type
```javascript
// Should be:
artifact = {
  type: 'wake_simulation',
  data: { messageContentType: 'wake_simulation', ... }
}
```

**Check 2**: Verify ArtifactRenderer has wake_simulation case
```typescript
case 'wake_simulation':
case 'wake_analysis':
  return <WakeAnalysisArtifact data={artifact as any} />
```

### Missing Visualizations

**Check 1**: Verify simulation handler returns visualization URLs
```python
response_data['visualizations'] = {
  'wake_heat_map': 'https://s3.../wake_map.html',
  'wake_analysis': 'https://s3.../wake_analysis.png'
}
```

**Check 2**: Check S3 bucket permissions
```bash
aws s3 ls s3://[bucket]/renewable/wake_simulation/[project_id]/
```

### Performance Metrics Missing

**Check 1**: Verify simulation handler calculates metrics
```python
response_data['performanceMetrics'] = {
  'annualEnergyProduction': net_aep_gwh,
  'capacityFactor': capacity_factor,
  'wakeLosses': wake_loss_percent / 100
}
```

**Check 2**: Check orchestrator maps metrics correctly
```typescript
artifact.data.performanceMetrics = result.data.performanceMetrics
```

## Component Validation Checklist

- [ ] Component file exists at `src/components/renewable/WakeAnalysisArtifact.tsx`
- [ ] Component exported from `src/components/renewable/index.ts`
- [ ] Component imported in `src/components/ArtifactRenderer.tsx`
- [ ] `wake_simulation` case added to ArtifactRenderer switch
- [ ] No TypeScript errors
- [ ] Performance metrics display correctly
- [ ] Wake heat map renders in iframe
- [ ] Monthly production chart displays (Plotly)
- [ ] Analysis charts render as images
- [ ] Turbine configuration expandable section works
- [ ] Data source information displays
- [ ] Follow-up action buttons trigger callbacks
- [ ] Wake loss severity badge shows correct color
- [ ] Component handles missing optional data gracefully

## Success Criteria

✅ Component renders wake simulation results
✅ Heat map visualization displays correctly
✅ Performance metrics (AEP, CF) shown accurately
✅ Wake loss severity indicated with color-coded badge
✅ Monthly production chart interactive
✅ All visualization tabs functional
✅ Follow-up actions trigger correctly
✅ Data source information displayed
✅ Component handles minimal data gracefully
✅ No console errors during rendering

## Next Steps

After verifying the component works:

1. Test with real wake simulation data
2. Verify S3 visualization URLs load correctly
3. Test follow-up action integration
4. Validate with different wake loss scenarios
5. Test responsive design on different screen sizes
6. Verify accessibility compliance
7. Test with missing optional fields
8. Validate error handling

## Related Components

- **SimulationChartArtifact**: General simulation results (may be deprecated in favor of WakeAnalysisArtifact)
- **WakeAnalysisDashboard**: Dashboard view with multiple wake charts
- **WakeAnalysisVisualization**: Detailed wake visualization component
- **LayoutMapArtifact**: Turbine layout visualization (provides input for wake simulation)

## Documentation

- **Task**: `.kiro/specs/complete-renewables-integration/tasks.md` - Task 13
- **Requirements**: Wake Simulation Integration requirements
- **Design**: Wake analysis visualization design
- **Orchestrator**: `amplify/functions/renewableOrchestrator/handler.ts` - wake_simulation case
- **Simulation Handler**: `amplify/functions/renewableTools/simulation/handler.py`
