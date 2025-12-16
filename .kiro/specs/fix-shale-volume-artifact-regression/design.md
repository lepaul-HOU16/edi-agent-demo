# Design Document

## Overview

This design fixes the shale volume calculator regression by creating a comprehensive shale volume analysis tool that generates rich interactive artifacts, matching the quality and structure of the porosity analysis tool. The fix involves creating proper artifact structures with visualizations, executive summaries, and methodology documentation instead of returning plain JSON strings.

## Architecture

### Current (Broken) Flow
```
User Request
  ↓
enhancedStrandsAgent.handleCalculateShale()
  ↓
enhancedCalculateShaleVolumeTool.func()
  ↓
ProfessionalResponseBuilder.buildShaleVolumeResponse()
  ↓
JSON.stringify(response) ← Returns STRING, no artifacts
  ↓
Agent receives string result
  ↓
formatShaleVolumeResponse() returns message text only
  ↓
Frontend receives text-only response ❌
```

### Fixed Flow
```
User Request
  ↓
enhancedStrandsAgent.handleCalculateShale()
  ↓
comprehensiveShaleVolumeAnalysisTool.func()
  ↓
Calculate shale volume from GR log
  ↓
Create artifact with messageContentType: 'comprehensive_shale_analysis'
  ↓
Return { success: true, message: "...", artifacts: [artifact] }
  ↓
Agent preserves artifacts in response
  ↓
Frontend receives rich artifact with visualizations ✅
```

## Components and Interfaces

### 1. Comprehensive Shale Volume Analysis Tool

**File:** `cdk/lambda-functions/chat/tools/comprehensiveShaleVolumeAnalysisTool.ts`

**Purpose:** Calculate shale volume and create comprehensive artifacts with visualizations

**Interface:**
```typescript
export const comprehensiveShaleVolumeAnalysisTool: MCPTool = {
  name: "calculate_shale_volume",
  description: "Calculate shale volume with comprehensive interactive analysis and visualizations",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    method: z.enum(["larionov_tertiary", "larionov_pre_tertiary", "clavier", "linear"]).describe("Shale volume calculation method"),
    parameters: z.object({
      grClean: z.number().optional().describe("Clean sand GR value (API), default 30"),
      grShale: z.number().optional().describe("Shale GR value (API), default 120")
    }).optional(),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async (params) => {
    // 1. Load well data from S3
    // 2. Parse LAS file and extract GR curve
    // 3. Calculate IGR and Vsh using specified method
    // 4. Identify clean sand intervals (Vsh < 30%)
    // 5. Calculate statistics (mean, std dev, min, max, net-to-gross)
    // 6. Create comprehensive artifact
    // 7. Return { success: true, message: "...", artifacts: [artifact] }
  }
};
```

### 2. Shale Volume Artifact Structure

**messageContentType:** `'comprehensive_shale_analysis'`

**Structure:**
```typescript
interface ShaleVolumeArtifact {
  messageContentType: 'comprehensive_shale_analysis';
  analysisType: 'single_well';
  wellName: string;
  method: string;
  
  executiveSummary: {
    title: string;
    method: string;
    keyFindings: string[];
    overallAssessment: string;
  };
  
  results: {
    shaleVolumeAnalysis: {
      method: string;
      formula: string;
      wellName: string;
      gammaRayData: {
        source: string;
        dataPoints: number;
        validPoints: number;
        grClean: string;
        grShale: string;
      };
      calculationResults: {
        averageShaleVolume: string;
        medianShaleVolume: string;
        standardDeviation: string;
        netToGross: string;
        uncertainty: string;
      };
    };
    
    cleanSandIntervals: {
      totalIntervals: number;
      criteria: string;
      bestIntervals: Array<{
        depth: string;
        thickness: string;
        averageShaleVolume: string;
        quality: string;
        completionPriority: string;
        netToGross: string;
      }>;
    };
    
    statisticalSummary: {
      distributionAnalysis: {
        distribution: string;
        cleanSandPeak: string;
        shalePeak: string;
        percentCleanSand: string;
      };
      uncertaintyAnalysis: {
        methodology: string;
        confidenceLevel: string;
        uncertaintyRange: string;
        reliabilityGrade: string;
      };
    };
  };
  
  visualizations: {
    depthPlots: {
      title: string;
      method: string;
      features: string[];
    };
    statisticalCharts: {
      title: string;
      charts: string[];
    };
    gammaRayCorrelation: {
      title: string;
      purpose: string;
      trendAnalysis: string;
    };
  };
  
  completionStrategy: {
    recommendedApproach: string;
    targetZones: string[];
    riskFactors: string[];
    expectedPerformance: string;
  };
  
  methodology: {
    formula: string;
    method: string;
    parameters: {
      grClean: { value: number; units: string; justification: string; };
      grShale: { value: number; units: string; justification: string; };
    };
    industryStandards: string[];
  };
}
```

### 3. Agent Handler Updates

**File:** `cdk/lambda-functions/chat/agents/enhancedStrandsAgent.ts`

**Method:** `handleCalculateShale()`

**Changes:**
- Call `comprehensiveShaleVolumeAnalysisTool` instead of `enhancedCalculateShaleVolumeTool`
- Preserve artifacts in response without modification
- Remove `formatShaleVolumeResponse()` call that strips artifacts
- Match the pattern used in `handleCalculatePorosity()`

**Updated Implementation:**
```typescript
private async handleCalculateShale(message: string, wellName: string | null, method: string | null): Promise<any> {
  if (!wellName) {
    // Return helpful suggestions
  }
  
  const calcMethod = method || 'larionov_tertiary';
  
  // Import and call comprehensive tool
  const { comprehensiveShaleVolumeAnalysisTool } = await import('../tools/comprehensiveShaleVolumeAnalysisTool');
  
  const toolResult = await comprehensiveShaleVolumeAnalysisTool.func({
    wellName,
    method: calcMethod,
    parameters: {},
    depthStart: undefined,
    depthEnd: undefined
  });
  
  const result = JSON.parse(toolResult);
  
  if (result.success && result.artifacts && result.artifacts.length > 0) {
    // Preserve artifacts directly - don't format
    return {
      success: true,
      message: result.message || `Comprehensive shale volume analysis complete for ${wellName}`,
      artifacts: result.artifacts
    };
  }
  
  // Handle errors
  return {
    success: false,
    message: result.message || 'Shale volume calculation failed',
    artifacts: []
  };
}
```

### 4. Frontend Component

**File:** `src/components/cloudscape/CloudscapeShaleVolumeDisplay.tsx`

**Purpose:** Render comprehensive shale analysis artifacts

**Features:**
- Executive summary with key findings
- Depth plot showing Vsh vs depth with clean sand highlighting
- Statistical distribution charts
- Clean sand interval table with completion priorities
- Methodology documentation
- Completion strategy recommendations

## Data Models

### Shale Volume Calculation

**Input:**
- Well name
- Method (larionov_tertiary, larionov_pre_tertiary, clavier, linear)
- GR clean value (default: 30 API)
- GR shale value (default: 120 API)
- Optional depth range

**Processing:**
1. Load LAS file from S3
2. Extract GR curve data
3. Calculate IGR: `IGR = (GR - GR_clean) / (GR_shale - GR_clean)`
4. Clamp IGR to [0, 1]
5. Apply method-specific formula:
   - **larionov_tertiary:** `Vsh = 0.083 * (2^(3.7*IGR) - 1)`
   - **larionov_pre_tertiary:** `Vsh = 0.33 * (2^(2*IGR) - 1)`
   - **clavier:** `Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)`
   - **linear:** `Vsh = IGR`
6. Calculate statistics (mean, median, std dev, min, max)
7. Identify clean sand intervals (Vsh < 30%)
8. Calculate net-to-gross ratio

**Output:**
- Shale volume values array
- Statistics object
- Clean sand intervals array
- Comprehensive artifact

### Clean Sand Interval Identification

**Algorithm:**
```typescript
function identifyCleanSandIntervals(depths: number[], vsh: number[]): CleanSandInterval[] {
  const intervals: CleanSandInterval[] = [];
  let inInterval = false;
  let intervalStart = 0;
  let intervalValues: number[] = [];
  
  for (let i = 0; i < vsh.length; i++) {
    if (vsh[i] < 0.30 && !inInterval) {
      // Start new interval
      inInterval = true;
      intervalStart = i;
      intervalValues = [vsh[i]];
    } else if (vsh[i] < 0.30 && inInterval) {
      // Continue interval
      intervalValues.push(vsh[i]);
    } else if (vsh[i] >= 0.30 && inInterval) {
      // End interval
      inInterval = false;
      const avgVsh = intervalValues.reduce((a, b) => a + b, 0) / intervalValues.length;
      const thickness = depths[i - 1] - depths[intervalStart];
      
      intervals.push({
        depthStart: depths[intervalStart],
        depthEnd: depths[i - 1],
        thickness,
        averageShaleVolume: avgVsh,
        quality: avgVsh < 0.15 ? 'Excellent' : avgVsh < 0.25 ? 'Good' : 'Fair',
        completionPriority: thickness > 15 && avgVsh < 0.20 ? 'Primary' : 'Secondary',
        netToGross: 1 - avgVsh
      });
    }
  }
  
  return intervals.sort((a, b) => a.averageShaleVolume - b.averageShaleVolume);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Artifact Structure Completeness
*For any* successful shale volume calculation, the returned artifact must contain all required fields: messageContentType, analysisType, wellName, method, executiveSummary, results, visualizations, completionStrategy, and methodology.
**Validates: Requirements 1.1, 1.4, 1.5**

### Property 2: Artifact Preservation Through Agent
*For any* tool response containing artifacts, the agent handler must preserve those artifacts without modification in the final response to the frontend.
**Validates: Requirements 3.3, 3.4, 3.5**

### Property 3: Method-Specific Formula Application
*For any* shale volume calculation with a specified method, the calculated Vsh values must match the results of applying that method's formula to the IGR values.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: IGR Bounds Enforcement
*For any* gamma ray value, the calculated IGR must be within the range [0, 1] regardless of input GR values.
**Validates: Requirements 4.5**

### Property 5: Clean Sand Interval Identification
*For any* shale volume array, all identified clean sand intervals must have average Vsh < 0.30, and all intervals with Vsh < 0.30 must be identified.
**Validates: Requirements 5.1**

### Property 6: Clean Sand Interval Metrics
*For any* identified clean sand interval, the thickness, average shale volume, and net-to-gross ratio must be correctly calculated from the depth and Vsh arrays.
**Validates: Requirements 5.2**

### Property 7: Quality Classification Consistency
*For any* clean sand interval, the quality classification (Excellent/Good/Fair) must match the average shale volume: Excellent if < 0.15, Good if < 0.25, Fair otherwise.
**Validates: Requirements 5.3**

### Property 8: Completion Priority Assignment
*For any* clean sand interval, the completion priority (Primary/Secondary) must be Primary if thickness > 15 ft AND average Vsh < 0.20, otherwise Secondary.
**Validates: Requirements 5.4**

### Property 9: Artifact Consistency with Porosity
*For any* shale volume artifact and porosity artifact, both must follow the same structural pattern with messageContentType, analysisType, executiveSummary, results, visualizations, and methodology sections.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 10: Non-Empty Results on Success
*For any* successful shale volume calculation, the artifact must contain at least one result value, and the statistics must include valid mean, min, and max values.
**Validates: Requirements 1.2, 1.3**

## Error Handling

### Missing Well Data
- **Error:** Well LAS file not found in S3
- **Response:** Clear error message with available wells list
- **User Action:** Specify a valid well name

### Missing GR Curve
- **Error:** GR curve not present in LAS file
- **Response:** Error message listing available curves
- **User Action:** Verify well has gamma ray log data

### Invalid GR Data
- **Error:** All GR values are null or -999.25
- **Response:** Data quality error with validation details
- **User Action:** Check well data quality

### Invalid Method
- **Error:** Unsupported shale volume method specified
- **Response:** Error message with list of valid methods
- **User Action:** Use larionov_tertiary, larionov_pre_tertiary, clavier, or linear

### Calculation Failure
- **Error:** Exception during Vsh calculation
- **Response:** Technical error message with stack trace in logs
- **User Action:** Report issue with well name and method

## Testing Strategy

### Unit Tests

**Test File:** `src/services/calculators/__tests__/shaleVolumeCalculator.test.ts`

**Test Cases:**
1. Calculate IGR with valid GR values
2. Calculate Vsh using larionov_tertiary method
3. Calculate Vsh using larionov_pre_tertiary method
4. Calculate Vsh using clavier method
5. Calculate Vsh using linear method
6. Handle null GR values (-999.25)
7. Clamp IGR to [0, 1] range
8. Identify clean sand intervals
9. Calculate interval statistics
10. Classify interval quality

### Property-Based Tests

**Test File:** `cdk/lambda-functions/chat/tools/__tests__/comprehensiveShaleVolumeAnalysisTool.test.ts`

**Property Tests:**
1. **Property 1: Artifact Structure Completeness** - Generate random well names and methods, verify all required fields present
2. **Property 3: Method-Specific Formula Application** - Generate random IGR arrays, verify Vsh matches formula for each method
3. **Property 4: IGR Bounds Enforcement** - Generate random GR values (including extremes), verify IGR always in [0, 1]
4. **Property 5: Clean Sand Interval Identification** - Generate random Vsh arrays, verify all intervals < 0.30 identified
5. **Property 6: Clean Sand Interval Metrics** - Generate random intervals, verify thickness and averages calculated correctly
6. **Property 7: Quality Classification Consistency** - Generate random Vsh values, verify quality matches thresholds
7. **Property 8: Completion Priority Assignment** - Generate random intervals, verify priority logic correct

### Integration Tests

**Test File:** `cdk/lambda-functions/chat/agents/__tests__/enhancedStrandsAgent.shale.test.ts`

**Test Cases:**
1. End-to-end shale volume calculation with real well data
2. Verify artifacts preserved through agent handler
3. Verify frontend receives complete artifact structure
4. Test error handling for missing wells
5. Test error handling for missing GR curve
6. Verify thought steps generated correctly
7. Verify multiple method calculations produce different results

## Summary

This design fixes the shale volume regression by creating a comprehensive analysis tool that generates rich artifacts matching the porosity tool's quality. The key changes are:

1. **New Tool:** `comprehensiveShaleVolumeAnalysisTool.ts` creates proper artifacts
2. **Agent Update:** `handleCalculateShale()` preserves artifacts without formatting
3. **Artifact Structure:** Complete with executive summary, visualizations, methodology, and completion strategy
4. **Clean Sand Identification:** Automatic interval detection with quality classification
5. **Consistency:** Matches porosity tool's artifact structure and quality

The fix ensures users get the same rich visualization experience for shale volume analysis that they currently enjoy for porosity analysis.
