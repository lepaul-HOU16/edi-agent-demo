# Design Document

## Overview

This design addresses two critical issues in the petrophysics agent's porosity analysis:

1. **Missing Log Curve Data**: The porosity analysis artifact lacks raw log curve data (DEPT, RHOB, NPHI) needed for visualization
2. **Inconsistent Column Names**: Porosity column names don't match frontend expectations, causing undefined values

The solution involves modifying the comprehensive porosity analysis tool to include logData in the artifact structure and ensuring consistent property naming throughout the response chain.

## Architecture

### Current Flow
```
User Request → Enhanced Strands Agent → Comprehensive Porosity Tool → Artifact (no logData) → Frontend (missing curves)
```

### Fixed Flow
```
User Request → Enhanced Strands Agent → Comprehensive Porosity Tool → Artifact (with logData) → Frontend (renders curves)
```

### Components Affected

1. **comprehensivePorosityAnalysisTool.ts** - Add logData extraction and inclusion
2. **enhancedStrandsAgent.ts** - Ensure artifact structure is preserved
3. **ComprehensivePorosityAnalysisComponent.tsx** - Already expects logData, no changes needed

## Components and Interfaces

### Modified Artifact Structure

```typescript
interface ComprehensivePorosityArtifact {
  messageContentType: 'comprehensive_porosity_analysis';
  analysisType: 'single_well' | 'multi_well' | 'field_overview';
  wellName: string;
  
  // EXISTING FIELDS (unchanged)
  executiveSummary: { ... };
  results: {
    porosityAnalysis: { ... };
    enhancedPorosityAnalysis: { ... };
    reservoirIntervals: { ... };
    highPorosityZones: { ... };
  };
  completionStrategy: { ... };
  visualizations: { ... };
  
  // NEW FIELD: Raw log curve data for visualization
  logData: {
    DEPT: number[];      // Depth values
    RHOB: number[];      // Bulk density (input)
    NPHI: number[];      // Neutron porosity (input)
    PHID?: number[];     // Calculated density porosity
    PHIN?: number[];     // Calculated neutron porosity  
    PHIE?: number[];     // Calculated effective porosity
    GR?: number[];       // Gamma ray (if available)
  };
  
  // Metadata about curves
  curveMetadata: {
    depthUnit: string;
    depthRange: [number, number];
    sampleCount: number;
    nullValue: number;
  };
}
```

### Data Extraction Logic

The tool will extract curve data during analysis:

```typescript
// In analyzeSingleWellPorosity function
async function analyzeSingleWellPorosity(...): Promise<WellPorosityAnalysis> {
  // ... existing code to load well data ...
  
  // Extract raw curve data for visualization
  const logData = {
    DEPT: depths,
    RHOB: densityData,
    NPHI: neutronData,
    PHID: densityPorosity,
    PHIN: neutronPorosity,
    PHIE: effectivePorosity
  };
  
  // Add GR if available
  const grCurve = wellData.curves.find(c => c.name === 'GR');
  if (grCurve) {
    logData.GR = applyDepthFilter(grCurve.data, depths, depthRange);
  }
  
  return {
    ...existingFields,
    logData,
    curveMetadata: {
      depthUnit: 'ft',
      depthRange: [Math.min(...depths), Math.max(...depths)],
      sampleCount: depths.length,
      nullValue: -999.25
    }
  };
}
```

## Data Models

### WellPorosityAnalysis Interface (Extended)

```typescript
interface WellPorosityAnalysis {
  wellName: string;
  depthRange: [number, number];
  porosityStats: {
    densityPorosity: Statistics;
    neutronPorosity: Statistics;
    effectivePorosity: Statistics;
  };
  reservoirIntervals: ReservoirInterval[];
  lithologyAnalysis: LithologyAnalysis;
  highPorosityZones: HighPorosityZone[];
  reservoirQuality: string;
  completionRecommendations: string[];
  dataQuality: {
    completeness: number;
    validPoints: number;
    totalPoints: number;
  };
  
  // NEW: Raw curve data for visualization
  logData: {
    DEPT: number[];
    RHOB: number[];
    NPHI: number[];
    PHID: number[];
    PHIN: number[];
    PHIE: number[];
    GR?: number[];
  };
  
  // NEW: Curve metadata
  curveMetadata: {
    depthUnit: string;
    depthRange: [number, number];
    sampleCount: number;
    nullValue: number;
  };
}
```

### Column Name Mapping

Ensure consistent naming throughout the artifact:

```typescript
// Frontend expects these paths:
results.enhancedPorosityAnalysis.calculationMethods.densityPorosity.average
results.enhancedPorosityAnalysis.calculationMethods.neutronPorosity.average
results.enhancedPorosityAnalysis.calculationMethods.effectivePorosity.average

// Backend must provide:
{
  results: {
    enhancedPorosityAnalysis: {
      calculationMethods: {
        densityPorosity: { average: "14.8%", ... },
        neutronPorosity: { average: "15.6%", ... },
        effectivePorosity: { average: "13.2%", ... }
      }
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Log curve data completeness
*For any* porosity analysis artifact with logData, all required curves (DEPT, RHOB, NPHI) must be present and have matching array lengths.
**Validates: Requirements 1.1, 1.2**

### Property 2: Depth alignment preservation
*For any* porosity analysis with depth filtering, the logData arrays must maintain the same depth registration as the original well data.
**Validates: Requirements 1.3**

### Property 3: Calculated curve alignment
*For any* porosity analysis with calculated curves (PHID, PHIN, PHIE), the calculated arrays must have the same length as the input curves (DEPT, RHOB, NPHI).
**Validates: Requirements 3.3**

### Property 4: Column name consistency
*For any* porosity analysis artifact, the property paths for porosity values must match the frontend's expected structure.
**Validates: Requirements 2.1, 2.2**

### Property 5: Graceful degradation
*For any* porosity analysis where optional curves (GR) are missing, the artifact must still be valid and renderable without those curves.
**Validates: Requirements 1.5**

## Error Handling

### Missing Curve Data
- If RHOB or NPHI curves are missing, return error artifact with clear message
- If DEPT curve is missing, attempt to generate from depth range
- If GR curve is missing, continue without it (optional)

### Data Quality Issues
- Filter out null values (-999.25) before including in logData
- Validate array lengths match before creating artifact
- Log warnings for data quality issues but don't fail

### Depth Range Filtering
- When depth range is specified, apply filtering consistently to all curves
- Ensure filtered arrays maintain alignment
- Validate filtered data has sufficient points (minimum 10)

## Testing Strategy

### Unit Tests
- Test logData extraction from well data
- Test depth filtering maintains alignment
- Test null value handling
- Test missing curve scenarios
- Test column name mapping

### Property-Based Tests
- Property 1: Generate random well data, verify all logData arrays have matching lengths
- Property 2: Generate random depth ranges, verify filtered data maintains alignment
- Property 3: Generate random porosity calculations, verify calculated curves match input lengths
- Property 4: Generate random artifacts, verify property paths exist and are accessible
- Property 5: Generate artifacts with missing optional curves, verify they render without errors

### Integration Tests
- Test full flow from user request to frontend rendering
- Test with real well data from S3
- Test with multiple wells
- Test with various depth ranges
- Verify log plots render correctly in frontend

## Implementation Notes

### Performance Considerations
- Log curve arrays can be large (thousands of points)
- Consider downsampling for visualization if arrays exceed 5000 points
- Use existing S3 artifact storage optimization (already samples to every 8th point)

### Backward Compatibility
- Existing artifacts without logData should still render (graceful degradation)
- Frontend already handles missing logData gracefully
- New logData field is additive, doesn't break existing functionality

### Multi-Well Analysis
- For multi-well analysis, include logData for each well
- Structure as array of well objects, each with its own logData
- Frontend can render multiple wells side-by-side

## Deployment Strategy

1. Deploy backend changes (Lambda functions)
2. Test on localhost with real well data
3. Verify log curves render correctly
4. Verify porosity columns display correct values
5. User validates fixes work as expected
6. Commit and push for CI/CD frontend deployment
